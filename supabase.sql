-- ============================================================
-- Beldi — tables nécessaires au classement et aux défis 1v1
--
-- À exécuter UNE FOIS dans Supabase : dashboard → SQL Editor → New query
-- → coller tout ce fichier → Run. Le script est idempotent : le relancer
-- ne casse rien.
--
-- La table "progress" existante n'est pas touchée : elle reste privée.
-- Tout ce qui est destiné à être vu des autres utilisateurs vit dans
-- "leaderboard", et rien d'autre. C'est la frontière de confidentialité.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Classement
-- Ne contient QUE le pseudo choisi et le meilleur score. Jamais l'email,
-- jamais le prénom réel, jamais la photo.
-- ------------------------------------------------------------
create table if not exists public.leaderboard (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  pseudo       text not null,
  best_score   int  not null default 0,
  best_time_ms int  not null default 0,
  games_played int  not null default 0,
  updated_at   timestamptz not null default now()
);

alter table public.leaderboard enable row level security;

drop policy if exists "leaderboard_read" on public.leaderboard;
create policy "leaderboard_read" on public.leaderboard
  for select to authenticated using (true);

drop policy if exists "leaderboard_insert_own" on public.leaderboard;
create policy "leaderboard_insert_own" on public.leaderboard
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "leaderboard_update_own" on public.leaderboard;
create policy "leaderboard_update_own" on public.leaderboard
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists leaderboard_rank_idx
  on public.leaderboard (best_score desc, best_time_ms asc);


-- ------------------------------------------------------------
-- 2. Défis 1v1 asynchrones
-- "seed" garantit que les deux adversaires reçoivent exactement les mêmes
-- questions, dans le même ordre, avec les mêmes propositions.
-- ------------------------------------------------------------
create table if not exists public.duels (
  id                 uuid primary key default gen_random_uuid(),
  seed               bigint not null,
  challenger_id      uuid not null references auth.users(id) on delete cascade,
  challenger_pseudo  text not null,
  challenger_score   int,
  challenger_time_ms int,
  opponent_id        uuid references auth.users(id) on delete cascade,
  opponent_pseudo    text,
  opponent_score     int,
  opponent_time_ms   int,
  created_at         timestamptz not null default now()
);

alter table public.duels enable row level security;

-- Lecture : les deux participants, plus tout connecté sur un défi encore libre
-- (c'est ce qui permet à l'invité d'ouvrir le lien avant d'accepter).
drop policy if exists "duels_read" on public.duels;
create policy "duels_read" on public.duels
  for select to authenticated
  using (auth.uid() = challenger_id or auth.uid() = opponent_id or opponent_id is null);

drop policy if exists "duels_insert_own" on public.duels;
create policy "duels_insert_own" on public.duels
  for insert to authenticated with check (auth.uid() = challenger_id);

-- Mise à jour : le lanceur, l'adversaire déjà inscrit, ou celui qui accepte un défi libre.
drop policy if exists "duels_update_participants" on public.duels;
create policy "duels_update_participants" on public.duels
  for update to authenticated
  using (auth.uid() = challenger_id or auth.uid() = opponent_id or opponent_id is null);

create index if not exists duels_challenger_idx on public.duels (challenger_id, created_at desc);
create index if not exists duels_opponent_idx   on public.duels (opponent_id,   created_at desc);


-- ------------------------------------------------------------
-- 3. Amis
-- Une ligne par demande, dans le sens demandeur → destinataire. Le pseudo est
-- recopié pour pouvoir afficher une liste d'amis sans lire la table des autres.
-- ------------------------------------------------------------
create table if not exists public.friendships (
  id               uuid primary key default gen_random_uuid(),
  requester_id     uuid not null references auth.users(id) on delete cascade,
  requester_pseudo text not null,
  addressee_id     uuid not null references auth.users(id) on delete cascade,
  addressee_pseudo text not null,
  status           text not null default 'pending' check (status in ('pending','accepted')),
  created_at       timestamptz not null default now(),
  unique (requester_id, addressee_id)
);

alter table public.friendships enable row level security;

-- Lecture : uniquement les liens qui te concernent.
drop policy if exists "friendships_read" on public.friendships;
create policy "friendships_read" on public.friendships
  for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Envoi d'une demande : seulement en ton propre nom.
drop policy if exists "friendships_insert_own" on public.friendships;
create policy "friendships_insert_own" on public.friendships
  for insert to authenticated with check (auth.uid() = requester_id);

-- Acceptation : réservée au destinataire.
drop policy if exists "friendships_accept" on public.friendships;
create policy "friendships_accept" on public.friendships
  for update to authenticated
  using (auth.uid() = addressee_id) with check (auth.uid() = addressee_id);

-- Refus ou retrait : les deux côtés peuvent supprimer le lien.
drop policy if exists "friendships_delete" on public.friendships;
create policy "friendships_delete" on public.friendships
  for delete to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create index if not exists friendships_requester_idx on public.friendships (requester_id, status);
create index if not exists friendships_addressee_idx on public.friendships (addressee_id, status);


-- ------------------------------------------------------------
-- 4. Mesure de consommation
-- Table en ajout seul : chaque ligne est un lot d'appels consommés par un
-- utilisateur. Pas de lecture-modification-écriture, donc pas de conflit entre
-- appareils, et l'historique reste intact.
-- Sert à répondre à UNE question : combien me coûte un utilisateur actif ?
-- ------------------------------------------------------------
create table if not exists public.usage_events (
  id              bigserial primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  at              timestamptz not null default now(),
  chat_calls      int not null default 0,
  input_tokens    int not null default 0,  -- exclut l'écriture ET la lecture de cache
  cache_read      int not null default 0,  -- facturé 0,1x
  cache_write     int not null default 0,  -- facturé 1,25x : le cache se paie avant de rapporter
  output_tokens   int not null default 0,
  tts_calls       int not null default 0,  -- générations réelles, cache exclu
  stt_calls       int not null default 0
);

-- pour les installations créées avant l'ajout de cette colonne
alter table public.usage_events add column if not exists cache_write int not null default 0;

alter table public.usage_events enable row level security;

-- Chacun n'écrit et ne relit que sa propre consommation. Toi, tu lis tout depuis
-- le dashboard (qui contourne RLS).
drop policy if exists "usage_insert_own" on public.usage_events;
create policy "usage_insert_own" on public.usage_events
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "usage_read_own" on public.usage_events;
create policy "usage_read_own" on public.usage_events
  for select to authenticated using (auth.uid() = user_id);

create index if not exists usage_events_idx on public.usage_events (user_id, at desc);


-- ============================================================
-- LA REQUÊTE QUI DONNE TON COÛT RÉEL
-- À coller dans SQL Editor quand tu veux savoir où tu en es. Tarifs de Sonnet 4.6 :
-- 3 $ le million en entrée, 15 $ en sortie, lecture de cache à 0,1x (= 0,30 $) et
-- écriture de cache à 1,25x (= 3,75 $). Ajuste ces quatre nombres si tu changes
-- de modèle.
--
-- select
--   u.user_id,
--   l.pseudo,
--   count(*)                        as lots,
--   sum(u.chat_calls)               as appels_claude,
--   sum(u.tts_calls)                as generations_voix,
--   sum(u.stt_calls)                as transcriptions,
--   sum(u.cache_read)               as tokens_relus_du_cache,
--   round((
--     sum(u.input_tokens)  * 3.00 / 1000000 +
--     sum(u.cache_write)   * 3.75 / 1000000 +
--     sum(u.cache_read)    * 0.30 / 1000000 +
--     sum(u.output_tokens) * 15.0 / 1000000
--   )::numeric, 4)                  as cout_claude_usd
-- from public.usage_events u
-- left join public.leaderboard l on l.user_id = u.user_id
-- where u.at > now() - interval '30 days'
-- group by u.user_id, l.pseudo
-- order by cout_claude_usd desc;
--
-- Pour juger si le cache est rentable, compare tokens_relus_du_cache à ce qu'ils
-- auraient coûté plein tarif : chaque token relu t'a coûté 0,30 $ le million au
-- lieu de 3,00 $. C'est une économie de 90 % sur cette part.
--
-- Le coût ElevenLabs ne s'exprime pas en dollars ici : c'est du crédit. Retiens
-- que generations_voix compte les VRAIES générations, celles qui n'ont pas été
-- servies par le stock partagé. Si ce nombre reste bas alors que l'app est
-- utilisée, c'est que le cache fait son travail.
-- ============================================================


-- ============================================================
-- STOCK D'AUDIO PARTAGÉ — à faire dans l'interface, pas en SQL
--
-- Le contenu fixe de l'app (carnet, grammaire, « Je débute ») ne change jamais,
-- mais il était régénéré par ElevenLabs pour chaque utilisateur et à chaque
-- rechargement. Avec ce stock, chaque phrase est générée UNE fois pour tous.
--
-- 1. Storage → New bucket → nom : tts → cocher « Public bucket » → créer.
--    Public est nécessaire : le navigateur lit les mp3 en direct, sans passer par
--    ton serveur. Ça marche même quand Render dort, et ça épargne sa bande passante.
--
-- 2. Settings → API → copier la clé « service_role ».
--
-- 3. Sur Render, ajouter deux variables d'environnement :
--       SUPABASE_URL          = https://sirzvmrlbfsunquxlqwi.supabase.co
--       SUPABASE_SERVICE_KEY  = (la clé service_role)
--
--    ATTENTION : la clé service_role contourne toutes les règles RLS. Elle ne doit
--    JAMAIS être mise dans public/index.html — uniquement en variable Render, lue
--    par server.js. Si elle fuite, il faut la régénérer immédiatement.
--
-- Tant que ces deux variables sont absentes, l'app fonctionne comme avant, sans
-- stock. Pour désactiver sans les retirer : TKELLEM_TTS_CACHE=off.
-- ============================================================


-- ============================================================
-- ENVOI D'EMAILS — rien à faire en SQL, mais à savoir
--
-- Le service email intégré de Supabase est prévu pour le développement : il
-- plafonne à quelques messages par heure POUR TOUT LE PROJET, pas par personne.
-- Les inscriptions échouent alors avec « email rate limit exceeded », et les
-- réinitialisations de mot de passe consomment le même quota.
--
-- Deux sorties, dans l'ordre de préférence :
--   1. Authentication → Emails → SMTP Settings : brancher un fournisseur
--      (Resend, Brevo, Mailgun…). Le plafond disparaît.
--   2. Authentication → Sign In / Providers → Email → décocher « Confirm email ».
--      Plus aucun email à l'inscription, donc plus de limite. Contrepartie : une
--      adresse mal saisie ne sera jamais détectée, et « mot de passe oublié »
--      restera inutilisable pour cette personne.
-- ============================================================


-- ============================================================
-- DEUX LIMITES À CONNAÎTRE, elles sont assumées et pas accidentelles
--
-- 1. Les scores sont déclarés par le navigateur. N'importe qui sachant ouvrir
--    la console peut s'attribuer 10/10. Empêcher ça demanderait de rejouer la
--    partie côté serveur — hors de proportion pour une app entre proches.
--
-- 2. Un défi encore libre est lisible par tout utilisateur connecté, pas
--    seulement par le destinataire du lien. Concrètement : un inconnu inscrit
--    pourrait accepter un défi qui ne lui était pas destiné. Pour fermer ça il
--    faudrait une fonction Postgres "security definer" validant un jeton en
--    plus de l'identifiant — faisable, mais incohérent avec le point 1.
-- ============================================================
