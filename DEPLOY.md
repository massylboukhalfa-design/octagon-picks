# 🥊 Octagon Picks — Guide de déploiement

## Stack
- **Frontend** : Next.js 14 (App Router) + Tailwind CSS
- **Backend / Auth / BDD** : Supabase
- **Déploiement** : Vercel (gratuit)

---

## Étape 1 — Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) et connecte-toi
2. Clique **New project**
3. Choisis un nom (ex: `octagon-picks`), un mot de passe fort, région **West EU (Ireland)**
4. Attends ~2 minutes que le projet soit prêt

### 1.1 Créer la base de données

1. Dans ton projet Supabase, va dans **SQL Editor**
2. Clique **New query**
3. Copie-colle tout le contenu de `supabase_schema.sql`
4. Clique **Run**
5. ✅ Tu devrais voir *"Success. No rows returned"*

### 1.2 Récupérer les clés API

Dans **Project Settings > API** :
- Copie **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copie **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Étape 2 — Configurer l'authentification Supabase

1. Dans Supabase, va dans **Authentication > Providers**
2. Assure-toi que **Email** est activé
3. Dans **Authentication > URL Configuration** :
   - **Site URL** : `https://ton-app.vercel.app` (à mettre à jour après le déploiement)
   - **Redirect URLs** : ajoute `https://ton-app.vercel.app/auth/callback`

> Pour la beta, tu peux désactiver "Confirm email" dans **Authentication > Providers > Email** pour simplifier l'onboarding.

---

## Étape 3 — Installer et tester en local

```bash
# Clone / positionne-toi dans le dossier du projet
cd ufc-pronostics

# Installe les dépendances
npm install

# Crée le fichier d'environnement
cp .env.local.example .env.local
```

Ouvre `.env.local` et remplis :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
```

```bash
# Lance le serveur de dev
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) — tu devrais voir la landing page.

---

## Étape 4 — Déployer sur Vercel

### 4.1 Push sur GitHub

```bash
git init
git add .
git commit -m "feat: initial commit"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/octagon-picks.git
git push -u origin main
```

### 4.2 Déployer via Vercel

1. Va sur [vercel.com](https://vercel.com) et connecte-toi avec GitHub
2. Clique **Add New Project**
3. Importe le repo `octagon-picks`
4. Dans **Environment Variables**, ajoute :
   - `NEXT_PUBLIC_SUPABASE_URL` = ton URL Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = ta clé anon
5. Clique **Deploy**
6. ✅ Ton app est en ligne en ~2 minutes

### 4.3 Mettre à jour Supabase avec l'URL Vercel

Après déploiement, va dans Supabase **Authentication > URL Configuration** :
- Mets à jour **Site URL** avec ton URL Vercel (ex: `https://octagon-picks-xxx.vercel.app`)
- Ajoute l'URL de callback : `https://octagon-picks-xxx.vercel.app/auth/callback`

---

## Étape 5 — Créer ton compte admin

1. Inscris-toi sur l'app normalement (via `/auth/register`)
2. Dans Supabase, va dans **Table Editor > profiles**
3. Trouve ta ligne, clique dessus
4. Mets `is_admin` à `TRUE`
5. ✅ Tu as maintenant accès au bouton "+ Créer un event" sur la page Événements

---

## Étape 6 — Inviter tes amis pour la beta

1. Partage le lien Vercel avec tes amis
2. Ils créent leur compte
3. Tu crées une ligue depuis `/leagues`
4. Tu leur donnes le **code d'invitation** à 6 caractères
5. Ils rejoignent la ligue en entrant le code

---

## Workflow d'utilisation

```
Admin                     Utilisateurs
  │                           │
  │  Crée l'événement UFC      │
  │  avec les combats          │
  │                           │
  │                     Rejoignent la ligue
  │                     Sélectionnent la ligue
  │                     Pronostiquent chaque combat
  │                     (avant la deadline)
  │                           │
  │  Saisit les résultats      │
  │  → /events/[id]/results    │
  │  Clique "Valider"          │
  │                           │
  │  → Points calculés auto    │
  │                     Consultent le classement
```

---

## Système de points

| Action | Points |
|--------|--------|
| ✅ Bon gagnant | +10 pts |
| 🎯 Bonne méthode (KO, Sub, Decision...) | +5 pts |
| 🔢 Bon round | +5 pts |
| 🏆 Combo parfait (les 3) | +10 pts bonus |
| **Total max par combat** | **30 pts** |

---

## Structure des fichiers

```
ufc-pronostics/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Styles globaux
│   ├── auth/
│   │   ├── login/page.tsx          # Connexion
│   │   ├── register/page.tsx       # Inscription
│   │   └── callback/route.ts       # OAuth callback
│   ├── dashboard/
│   │   ├── layout.tsx              # Layout avec nav
│   │   └── page.tsx                # Dashboard principal
│   ├── leagues/
│   │   ├── page.tsx                # Liste des ligues
│   │   └── [id]/page.tsx           # Détail ligue + classement
│   ├── events/
│   │   ├── page.tsx                # Liste des events
│   │   ├── [id]/
│   │   │   ├── page.tsx            # Détail event + pronostics
│   │   │   └── results/page.tsx    # Saisie résultats (admin)
│   │   └── admin/new/page.tsx      # Créer un event (admin)
│   └── api/
│       └── calculate-points/route.ts # Calcul des points
├── components/
│   ├── auth/LogoutButton.tsx
│   ├── leagues/
│   │   ├── CreateLeagueForm.tsx
│   │   └── JoinLeagueForm.tsx
│   └── events/
│       ├── PredictionForm.tsx
│       ├── NewEventForm.tsx
│       └── ResultsForm.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── utils.ts
├── types/index.ts
├── middleware.ts
└── supabase_schema.sql             # 👈 Script BDD complet
```

---

## Évolutions possibles (post-beta)

- **Cron job Supabase** pour verrouiller les events automatiquement à la deadline
- **Notifications email** via Supabase Edge Functions + Resend
- **Historique personnel** avec stats par fighter, méthode favorite...
- **Ligues publiques** avec code de partage
- **API UFC officielle** pour auto-remplir les combats
