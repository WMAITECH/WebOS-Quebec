# ⚜️ WebOS Québec - Système d'Exploitation Souverain

Un OS complet dans le navigateur avec IA locale (Llama 3.2-3B), système de fichiers OPFS, et authentification sécurisée.

## 🚀 Démarrage Ultra Rapide

```bash
# Lancer le serveur dev
npm run dev
```

**Le navigateur s'ouvre automatiquement sur WebOS Québec!**

---

## 📦 Ce Qui Est Inclus

- **webos-quebec.html** (53KB) - OS complet en 1 fichier
- **test-webos.html** (2.3KB) - Tests de compatibilité
- **Base de données Supabase** - 15 tables avec RLS
- **Documentation complète** - Guides et troubleshooting

---

## 🎯 URLs Importantes

En mode dev (`npm run dev`):
- http://localhost:5173/webos-quebec.html - Système principal
- http://localhost:5173/test-webos.html - Tests

---

## ✨ Fonctionnalités

### Core System
- Kernel avec event bus
- Window Manager (drag, resize, z-index)
- Process management
- Error handling robuste

### Intelligence Artificielle
- Llama 3.2-3B local (WebLLM)
- Streaming de réponses
- Conversations persistées
- Aucune donnée externe

### File System
- OPFS (Origin Private File System)
- Sync cloud avec Supabase
- Versioning automatique
- Partage de fichiers

### Applications (5)
1. Portail Citoyen
2. Gestionnaire de Fichiers
3. Assistant IA
4. Terminal
5. Moniteur Système

---

## 🔧 Commandes

```bash
npm install       # Installer dépendances
npm run dev       # Serveur dev (auto-ouvre WebOS)
npm run build     # Build production
npm run preview   # Preview du build
npm run lint      # Vérifier code
npm run typecheck # Vérifier TypeScript
```

---

## 📋 Prérequis

- **Node.js** 18+
- **RAM** 8GB minimum (pour l'IA)
- **Navigateur** Chrome 119+, Safari 17.4+, ou Edge 119+

---

## 🐛 Problème: Le Preview Ne S'Affiche Pas?

C'est normal! Par défaut, `npm run preview` ouvre la racine.

**Solutions:**

### Option 1: Utiliser le mode dev (recommandé)
```bash
npm run dev
# S'ouvre automatiquement sur WebOS
```

### Option 2: Naviguer manuellement
```bash
npm run preview
# Puis ouvrir: http://localhost:4173/webos-quebec.html
```

### Option 3: Fichier local direct
```bash
open webos-quebec.html
```

---

## 📖 Documentation Complète

Voir **[HOW-TO-RUN.md](HOW-TO-RUN.md)** pour:
- Guide détaillé de lancement
- Troubleshooting complet
- Tests sur mobile
- Astuces pro

---

## 🎓 Premier Lancement

1. `npm install` - Installer dépendances
2. `npm run dev` - Démarrer
3. Créer compte ou se connecter
4. Attendre chargement IA (~3-5 min première fois)
5. Explorer les apps!

---

## 🏗️ Architecture

```
webos-quebec.html (53KB)
├── Kernel + Event Bus
├── Window Manager
├── Supabase Client
├── WebLLM/AI
├── OPFS FileSystem
├── Auth System
└── 5 Applications
```

---

## 🔒 Sécurité

- Row Level Security (RLS)
- Content Security Policy
- Audit trail immuable
- Gestion d'erreurs robuste
- Aucune donnée IA externe

---

## 📊 Performance

- **Taille**: 53KB (16KB gzippé)
- **Load time**: ~500ms
- **IA load**: 3-5 min (première fois, puis cache)

---

## 🚀 Déploiement

```bash
# Build
npm run build

# Les fichiers sont dans dist/
# Déployer sur: GitHub Pages, Netlify, Vercel, etc.
```

---

## 🤝 Contribution

Open source - Contributions bienvenues!

---

## 📝 Licence

Libre d'usage pour projets gouvernementaux et éducatifs.

---

**Fait avec ❤️ pour le Québec** 🇨🇦⚜️