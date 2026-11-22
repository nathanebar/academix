# Academix

- `academix-backend/` : API Express 5 + Sequelize (PostgreSQL), stockage S3/MinIO, auth NTLM **ou** username/password.
- `academix-frontend/` : React 18 (Create React App, TypeScript), interface en hébreu (RTL).
- `docker-compose.yml` : infra locale (PostgreSQL 16 + MinIO).

## Lancement local (hors réseau)

Prérequis : Node.js ≥ 20, Docker Desktop.

```bash
# 1. Infra
docker compose up -d            # Postgres :5432, MinIO :9000 (console :9001, minioadmin/minioadmin)

# 2. Backend
cd academix-backend
cp .env.example .env            # puis mettre un JWT_SECRET aléatoire
npm install
npm run db:init                 # crée toutes les tables depuis les models + triggers
npm run db:seed                 # rôles, système "Academix", utilisateur admin/admin (SYSTEM-ADMIN)
npm run dev                     # http://localhost:8007

# 3. Frontend (autre terminal)
cd academix-frontend
npm install                     # .env.development est déjà fourni
npm start                       # http://localhost:3000 -> page de connexion
```

Créer d'autres comptes : `npm run user:create -- <username> <password> [nom] [militaryid]`.

### Ports de l'infra
Si un port est déjà pris (par exemple un PostgreSQL installé sur Windows occupe 5432), créer un fichier `.env` à la racine du dépôt (ignoré par git) :

```bash
POSTGRES_PORT=5433
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001
```

puis reporter les mêmes valeurs dans `academix-backend/.env` (`DB_PORT=5433`, `S3_ENDPOINT=http://localhost:<MINIO_PORT>`) et, si `MINIO_PORT` change, dans `REACT_APP_S3_BASE_URL` du front (`academix-frontend/.env.development.local`).

L'image MinIO est `cgr.dev/chainguard/minio` (épinglée par digest dans `docker-compose.yml`) : `minio/minio` et `minio/mc` ne sont plus publiées sur Docker Hub.

### Authentification
| `AUTH_MODE` | Utilisation | Fonctionnement |
|---|---|---|
| `local` | hors réseau | `POST /api/auth/login` vérifie `Users.password` (hash scrypt natif Node), pose les cookies `token` (JWT httpOnly) + `userInfo`. Page de connexion et bouton de déconnexion côté front. |
| `ntlm` | réseau fermé | `GET /api/auth/ntlm` (express-ntlm sur `NTLM_DOMAIN` / `NTLM_DOMAIN_CONTROLLER`), comportement d'origine. `/api/auth/login` n'existe pas dans ce mode. |

Le front lit le mode via `GET /api/auth/mode`. `REQUIRE_AUTH=true` impose un JWT valide sur toutes les routes `/api` (désactivé par défaut pour ne pas changer le comportement d'origine).

### Base de données
Les migrations de `migrations/` sont **incohérentes** : table `TeamCourseBatches` jamais créée, clés étrangères vers des tables créées plus tard, doublons, timestamps invalides, et des tables absentes. Le schéma est donc créé par `npm run db:init` (`sequelize.sync()` à partir des models). Options : `-- --alter` ajuste les tables existantes, `-- --force` **supprime et recrée tout**.

### Médias
Le dossier `academix-frontend/src/media/` n'a pas été extrait. `npm run media:placeholders` génère des images neutres aux chemins attendus (87 fichiers). Il ne remplace jamais un fichier existant : copier les vrais médias par-dessus suffit.

## Redéploiement sur le réseau fermé — checklist

1. **Dépendances hors ligne** : transférer `node_modules` (même OS et même version de Node que la cible) ou un cache npm / registre interne (Verdaccio). Pour le front, on peut aussi ne transférer que le dossier `build/`.
2. **ffmpeg** : `@ffmpeg-installer` contient un binaire propre à chaque OS. Si la plateforme diffère, fournir le binaire et définir `FFMPEG_PATH`.
3. **Backend `.env`** :
   - `NODE_ENV=production`
   - `AUTH_MODE=ntlm`, `NTLM_DOMAIN`, `NTLM_DOMAIN_CONTROLLER`
   - `HTTPS=true`, `CERT_PATH=certificate/cert.pfx`, `PASSWORD=<passphrase>`
   - `DB_*` : l'ancienne base tournait probablement sur le port **5433** d'après les logs
   - `S3_*` (+ `S3_STORAGE_CLASS=STANDARD_IA` si c'était le cas avant)
   - `CORS_ORIGINS=<url du front>`
   - `PEOPLE_API_URL` / `PEOPLE_API_COOKIE` pour la recherche annuaire (utiliser un compte de service, ne pas réutiliser le cookie qui était en dur)
4. **Base existante** : ne pas lancer `db:init -- --force`. `db:init` sans option crée seulement les tables manquantes. Faire un `pg_dump` avant.
5. **Frontend** : construire avec les variables de la cible, par exemple :
   `REACT_APP_API_BASE_URL=https://<api>:8007/api REACT_APP_S3_BASE_URL=https://<minio> REACT_APP_PHOTO_API_URL=... REACT_APP_CHAT_URL=... npm run build:prod`
   Le cookie `userInfo` doit être lisible par le front : servir le front et l'API sur le même hôte, ou via un reverse proxy.
6. Remettre les vrais médias dans `academix-frontend/src/media/` avant le build.
7. Mettre un `.env` propre sur la cible et ne pas reprendre `config/config.json`, qui contient d'anciens mots de passe et n'est plus utilisé.

## Points de sécurité connus (non corrigés)
- Sans `REQUIRE_AUTH=true`, aucune route `/api/*` n'exige d'authentification.
- Injection SQL possible : `teamId` est interpolé dans la requête à `src/controllers/taskAssignment.controller.js` (~ligne 1948).
- `errorHandler` renvoie `error.message` au client ; les appels HTTPS internes utilisent `rejectUnauthorized: false`.
- `academix-backend/logs/` contient environ 68 Mo de logs de production (IP, usernames, corps de requêtes) : à purger avant tout partage.
