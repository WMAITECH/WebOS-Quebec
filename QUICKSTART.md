# ⚡ QUICKSTART - WebOS Québec

## 🚀 Lancer en 1 Commande

```bash
npm run dev
```

**Le navigateur s'ouvre automatiquement et charge WebOS Québec!**

---

## 📁 Comment Ça Marche

### Architecture des Fichiers

```
Projet/
├── index.html                  → Redirecteur (à la racine pour Vite)
├── public/
│   ├── webos-quebec.html      → WebOS complet (53KB)
│   ├── test-webos.html        → Tests (2.3KB)
│   ├── manifest.json          → PWA config
│   └── sw.js                  → Service Worker
└── dist/ (après build)
    ├── index.html             → Redirecteur
    ├── webos-quebec.html      → WebOS (copié auto)
    ├── test-webos.html        → Tests (copié auto)
    └── assets/                → Ressources
```

### Flux de Démarrage

1. `npm run dev` démarre Vite sur `localhost:5173`
2. Le navigateur s'ouvre sur `/`
3. `index.html` redirige vers `/webos-quebec.html`
4. Vite sert `public/webos-quebec.html` tel quel (pas de traitement)
5. WebOS se charge!

---

## 🎯 URLs Disponibles

En mode dev:
- http://localhost:5173/ → Redirige vers WebOS
- http://localhost:5173/webos-quebec.html → WebOS direct
- http://localhost:5173/test-webos.html → Tests

---

## ✅ Pourquoi Cette Architecture?

### Problème Résolu

**Avant:** Vite essayait d'analyser `webos-quebec.html` comme un module et échouait sur les imports dynamiques (`@mlc-ai/web-llm`)

**Solution:** Déplacer WebOS dans `public/` pour que Vite le serve tel quel, sans transformation

### Avantages

✅ **Pas d'erreur de module** - WebOS n'est pas traité par Vite
✅ **Imports dynamiques fonctionnent** - CDN chargés directement dans le navigateur
✅ **Build simple** - Vite copie automatiquement `public/` vers `dist/`
✅ **Hot reload** - Les changements dans `public/` se reflètent instantanément
✅ **Production ready** - Même comportement en dev et prod

---

## 🔧 Commandes

```bash
npm run dev       # Serveur dev + auto-ouverture
npm run build     # Build production (copie auto public/)
npm run preview   # Preview du build
npm run lint      # Vérifier code
npm run typecheck # Vérifier types
```

---

## 🐛 Troubleshooting

### Erreur: "Failed to resolve import @mlc-ai/web-llm"

✅ **Résolu!** WebOS est maintenant dans `public/` et n'est plus analysé par Vite.

### Je vois "Start prompting..."

**Cause:** Le serveur dev n'a pas été redémarré après les changements.

**Solution:**
```bash
# Ctrl+C pour arrêter
npm run dev
# Puis rafraîchir le navigateur (Ctrl+Shift+R)
```

### WebOS ne se charge pas

**Vérifications:**
```bash
# 1. Fichier existe?
ls -lh public/webos-quebec.html
# Doit afficher: 53K

# 2. Index redirige?
grep "webos-quebec" index.html
# Doit afficher: window.location.href = '/webos-quebec.html';

# 3. Build fonctionne?
npm run build
# Doit afficher: ✓ built
```

### Port déjà utilisé

```bash
npm run dev -- --port 3000
```

---

## 📊 Vérification Rapide

```bash
# Tout vérifier d'un coup
echo "1. Public:" && ls -lh public/*.html && \
echo "" && echo "2. Index:" && grep "webos-quebec" index.html && \
echo "" && echo "3. Build:" && npm run build 2>&1 | grep "built"
```

Devrait afficher:
- ✅ webos-quebec.html (53KB) dans public/
- ✅ window.location.href dans index.html
- ✅ built in XXXms

---

## 🎓 Première Utilisation

1. `npm run dev`
2. Créer un compte (email + mot de passe)
3. Se connecter
4. Attendre 3-5 min (chargement IA première fois)
5. Explorer les 5 apps du dock!

---

## 🚢 Déploiement

```bash
# Build
npm run build

# Tester en local
npm run preview

# Déployer dist/ sur:
# - Netlify
# - Vercel
# - GitHub Pages
# - Cloudflare Pages
```

Le fichier `public/webos-quebec.html` sera automatiquement copié dans `dist/`!

---

## 💡 Éditer WebOS

Pour modifier le système WebOS:

1. Éditer `public/webos-quebec.html`
2. Sauvegarder
3. Rafraîchir le navigateur (Ctrl+R)

Vite sert les fichiers de `public/` directement, donc les changements sont instantanés!

---

## ✅ Checklist de Vérification

Avant de dire que ça ne marche pas:

- [ ] `npm install` exécuté?
- [ ] `npm run dev` lancé?
- [ ] Navigateur rafraîchi (Ctrl+Shift+R)?
- [ ] URL est `localhost:5173`?
- [ ] `public/webos-quebec.html` existe (53KB)?
- [ ] `index.html` contient la redirection?

Si tous ✅ et ça ne marche toujours pas, ouvrez directement:
```
http://localhost:5173/webos-quebec.html
```

---

**Prêt?** → `npm run dev` 🚀⚜️