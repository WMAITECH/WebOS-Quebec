# 🚀 Comment Utiliser WebOS Québec

## ⚡ Démarrage Rapide

```bash
npm run dev
```

Le système s'ouvre automatiquement dans votre navigateur!

---

## ✅ Ce Qui a Été Corrigé

### Problème 1: Erreur de module `@mlc-ai/web-llm`
**Résolu:** WebOS est maintenant dans `public/` et n'est plus analysé par Vite.

### Problème 2: Système bloqué à "Initialisation..."
**Résolu:** L'IA n'est plus chargée au démarrage. Elle se charge uniquement quand vous ouvrez l'app Chat.

---

## 📊 Flux de Démarrage (Maintenant RAPIDE!)

```
1. npm run dev
   ↓
2. Navigateur s'ouvre sur http://localhost:5173/
   ↓
3. Redirection vers /webos-quebec.html
   ↓
4. Écran de chargement (1-2 secondes max!)
   • 10% - Supabase
   • 30% - Système de fichiers
   • 50% - Noyau
   • 70% - Interface
   • 100% - Prêt!
   ↓
5. Écran de connexion/inscription
   ↓
6. Bureau WebOS! 🎉
```

**Note:** L'IA n'est PAS chargée au démarrage. Le statut affiche "🤖 IA: Non chargée".

---

## 🤖 Chargement de l'IA

L'IA (Llama 3.2 3B) est un modèle de **plusieurs Go** qui fonctionne 100% dans le navigateur.

### Quand L'IA Se Charge

**Automatiquement** quand vous ouvrez l'application **Chat** pour la première fois.

### Durée de Chargement

- **Première fois:** 3-5 minutes (téléchargement du modèle)
- **Fois suivantes:** Instantané (modèle en cache)

### Statut de l'IA

Dans la barre supérieure, vous voyez:

- 🤖 **IA: Non chargée** → L'IA n'a pas encore été initialisée
- 🤖 **IA: Chargement...** → L'IA est en train de se charger (jaune)
- 🤖 **IA: Prête** → L'IA est disponible (vert)
- 🤖 **IA: Erreur** → Problème de chargement (rouge)

### Utiliser l'IA

1. Ouvrir l'app **Chat** depuis le dock
2. Attendre 3-5 min la première fois
3. Commencer à discuter!

**Le chat fonctionne 100% offline après le premier chargement!**

---

## 🎯 Les 5 Applications

Une fois connecté, vous avez accès à:

### 1. 🏛️ Portail Citoyen
Services gouvernementaux simulés.

### 2. 📄 Éditeur de Documents
Éditeur de texte simple avec sauvegarde.

### 3. 💬 Chat IA
Chat avec Llama 3.2 3B (chargement à la demande).

### 4. 📂 Gestionnaire de Fichiers
Explorateur de fichiers avec OPFS (Origin Private File System).

### 5. 💻 Terminal
Terminal avec commandes système simulées.

---

## 🔐 Authentification

L'authentification utilise Supabase (email/password).

### Créer un Compte

1. Cliquez sur "S'inscrire"
2. Entrez email + mot de passe
3. Cliquez "Créer un compte"

**Note:** La confirmation par email est DÉSACTIVÉE. Le compte est immédiatement actif!

### Se Connecter

1. Entrez email + mot de passe
2. Cliquez "Se connecter"

---

## 📁 Structure du Projet

```
Projet/
├── index.html                   → Redirecteur vers WebOS
├── public/
│   ├── webos-quebec.html       → WebOS complet (53KB)
│   ├── test-webos.html         → Tests
│   ├── manifest.json           → PWA
│   └── sw.js                   → Service Worker
├── src/
│   ├── App.tsx                 → (Non utilisé pour WebOS)
│   └── ...
└── dist/ (après build)
    ├── index.html              → Redirecteur
    ├── webos-quebec.html       → WebOS (copié auto)
    └── ...
```

**Important:** Le vrai système est dans `public/webos-quebec.html`. Les fichiers React dans `src/` ne sont pas utilisés pour WebOS.

---

## 🛠️ Commandes

```bash
# Développement
npm run dev          # Serveur dev (port 5173)

# Production
npm run build        # Build optimisé
npm run preview      # Preview du build

# Qualité
npm run lint         # Linter ESLint
npm run typecheck    # Vérification TypeScript
```

---

## 🐛 Dépannage

### Le système ne démarre toujours pas

**Vérifier:**
```bash
# 1. webos-quebec.html existe dans public/?
ls -lh public/webos-quebec.html
# Devrait afficher: 53K

# 2. Le build fonctionne?
npm run build
# Devrait afficher: ✓ built in XXXms

# 3. Vérifier la console du navigateur (F12)
# Chercher des erreurs rouges
```

### L'IA ne charge jamais

**Causes possibles:**

1. **Navigateur non compatible**
   - Chrome/Edge 113+ recommandé
   - Firefox peut avoir des problèmes avec WebGPU

2. **Pas assez de RAM**
   - Minimum: 4GB RAM libre
   - Recommandé: 8GB+ RAM

3. **Bloqueur de scripts**
   - Désactiver uBlock/AdBlock pour localhost
   - Vérifier les Content Security Policy

**Solution:** Utiliser Chrome ou Edge avec au moins 8GB RAM.

### Erreur "Failed to resolve import"

**Cause:** Vous avez peut-être modifié webos-quebec.html et Vite essaie de l'analyser.

**Solution:** webos-quebec.html DOIT rester dans `public/`. Ne le déplacez jamais dans `src/`.

### Port déjà utilisé

```bash
npm run dev -- --port 3000
```

---

## 📱 PWA (Progressive Web App)

WebOS peut être installé comme une app!

### Installer Sur Bureau

1. Chrome: Menu → "Installer WebOS Québec"
2. Edge: Icône "+" dans la barre d'adresse

### Installer Sur Mobile

1. Safari iOS: Partager → "Sur l'écran d'accueil"
2. Chrome Android: Menu → "Ajouter à l'écran d'accueil"

---

## 🌐 URLs Utiles

En mode dev:
- http://localhost:5173/ → Redirige vers WebOS
- http://localhost:5173/webos-quebec.html → WebOS direct
- http://localhost:5173/test-webos.html → Tests

---

## 🔧 Configuration

### Variables d'Environnement

Le fichier `.env` contient:
```
VITE_SUPABASE_URL=https://gmxtzxiwdacfszrvjxtb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**Important:** Ces clés sont aussi hardcodées dans `webos-quebec.html` car c'est un fichier standalone.

### Supabase Database

Les tables créées:
- `ai_conversations` → Historique des chats IA
- `user_files` → Métadonnées des fichiers
- `user_documents` → Documents de l'éditeur

---

## 🚢 Déploiement

```bash
# 1. Build
npm run build

# 2. Tester
npm run preview

# 3. Déployer dist/ sur:
# - Netlify
# - Vercel
# - GitHub Pages
# - Cloudflare Pages
```

Le fichier `public/webos-quebec.html` sera automatiquement copié dans `dist/`!

---

## ⚠️ Limitations Connues

### IA (WebLLM)

- **Navigateur:** Chrome/Edge 113+ uniquement
- **RAM:** Minimum 4GB, recommandé 8GB+
- **Stockage:** ~3GB pour le modèle en cache
- **Premier chargement:** 3-5 minutes
- **Performance:** Dépend du GPU/CPU

### Stockage (OPFS)

- **Navigateur:** Chrome 86+, Firefox 111+, Safari 15.2+
- **Limite:** ~60% de l'espace disque libre (quotas du navigateur)
- **Privé:** Chaque origine a son propre OPFS

### Général

- **Offline:** Fonctionne offline après premier chargement
- **Multi-onglets:** Peut avoir des problèmes avec OPFS
- **Mobile:** Interface optimisée mais IA peut être lente

---

## 📚 Ressources

- [Web LLM](https://github.com/mlc-ai/web-llm) - IA dans le navigateur
- [Supabase](https://supabase.com) - Backend authentification/DB
- [OPFS](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) - Système de fichiers

---

## ✅ Checklist de Première Utilisation

- [ ] `npm install` exécuté
- [ ] `npm run dev` lancé
- [ ] Navigateur ouvert automatiquement
- [ ] Compte créé (email + password)
- [ ] Connexion réussie
- [ ] Bureau visible avec 5 apps dans le dock
- [ ] App Chat ouverte (IA commence à charger)
- [ ] Patienter 3-5 min pour l'IA
- [ ] Tester les autres apps!

---

**Prêt à explorer?** → `npm run dev` 🚀⚜️