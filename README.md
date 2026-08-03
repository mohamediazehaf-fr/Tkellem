# Tkellem — Déploiement

Ce dossier contient tout le nécessaire pour héberger l'app en ligne, avec les clés API protégées côté serveur.

## Ce que tu dois faire, étape par étape

### 1. Créer un compte GitHub (si tu n'en as pas)
Va sur github.com → "Sign up". Gratuit.

### 2. Créer un nouveau dépôt (repository)
- Clique "New repository"
- Nom : `tkellem-darija` (ou ce que tu veux)
- Laisse "Public" ou "Private", peu importe
- Ne coche aucune case (pas de README, pas de .gitignore) — on a déjà nos fichiers
- Clique "Create repository"

### 3. Uploader les fichiers (sans ligne de commande)
Sur la page du dépôt vide, GitHub propose un lien "uploading an existing file" — clique-le, puis fais un glisser-déposer de **tous les fichiers de ce dossier** (`server.js`, `package.json`, `README.md`, et le dossier `public` avec `index.html` dedans). Valide avec "Commit changes".

### 4. Créer ta clé API Anthropic (Claude)
- Va sur **console.anthropic.com**
- Crée un compte si besoin
- Va dans "API Keys" → "Create Key" → copie-la (tu ne pourras plus la revoir ensuite)
- Anthropic demande généralement d'ajouter un moyen de paiement pour activer l'API (au-delà d'un crédit d'essai éventuel) — les coûts pour ce type de test restent très faibles (quelques centimes par conversation)

### 5. Récupérer ta clé ElevenLabs (tu l'as déjà normalement)
Si tu ne l'as plus : elevenlabs.io → Settings → API Keys.

### 6. Créer un compte Render
Va sur **render.com** → "Get Started" → connecte-toi avec ton compte GitHub (le plus simple, ça lie directement les deux).

### 7. Créer le service web
- Sur Render, clique "New +" → "Web Service"
- Choisis ton dépôt `tkellem-darija`
- Render détecte normalement Node.js automatiquement. Vérifie :
  - **Build Command** : `npm install`
  - **Start Command** : `node server.js`
  - **Plan** : Free
- Ne clique pas encore sur "Create Web Service" — d'abord :

### 8. Ajouter les clés API en variables d'environnement
Toujours sur cette page de création, cherche la section **"Environment Variables"** → ajoute :
| Clé | Valeur |
|---|---|
| `ANTHROPIC_API_KEY` | ta clé Anthropic |
| `ELEVENLABS_API_KEY` | ta clé ElevenLabs |

C'est cette étape qui garde tes clés en sécurité — elles ne sont jamais écrites dans le code.

### 9. Déployer
Clique "Create Web Service". Render installe et démarre le serveur (2-3 minutes). Une fois terminé, tu obtiens une adresse du type :
`https://tkellem-darija.onrender.com`

### 10. Tester
Ouvre cette adresse sur ton téléphone ou ton ordinateur, dans un vrai navigateur (Chrome de préférence). Le micro, la voix ElevenLabs et la conversation devraient tous fonctionner ensemble cette fois.

## Limite du plan gratuit Render à connaître
Le service gratuit "s'endort" après 15 minutes sans visite, et prend quelques secondes à se réveiller au prochain accès. Pour un test entre toi et quelques personnes, ce n'est pas un problème. Si tu veux que ça reste toujours instantané (pour de vrais utilisateurs), il faudra passer sur un plan payant (à partir de ~7$/mois) plus tard.

## Pour remettre à jour le code plus tard
Si je te donne des fichiers modifiés, il suffit de les re-uploader sur GitHub (même méthode qu'à l'étape 3) — Render redéploie automatiquement à chaque changement.
