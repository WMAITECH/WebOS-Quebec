# ⚠️ Important: WOSQ v4 sur Chrome

## Problème: Fichier ouvert directement (file://)

Vous avez ouvert `WOSQ.v4.wm.html` directement depuis le système de fichiers.

**Chrome bloque les fonctionnalités avancées** en mode `file://`:
- ❌ Cross-Origin Isolation désactivé
- ❌ SharedArrayBuffer non disponible
- ❌ WebLLM (IA locale) ne peut pas fonctionner
- ⚠️ Service Worker peut avoir des problèmes

## ✅ Solution Simple

### Lancez le serveur Python inclus:

```bash
cd public/
python server.py
```

Puis ouvrez: **http://localhost:8000/WOSQ.v4.wm.html**

Le serveur configure automatiquement tous les headers nécessaires!

---

## Pourquoi ça marche dans Bolt ?

Bolt utilise un **serveur HTTP avec les bons headers**:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: credentialless
```

Chrome en local (file://) ne peut pas appliquer ces headers.

---

## Alternatives

### Option 1: Serveur Python (recommandé)
```bash
python server.py
```

### Option 2: npm/Vite
```bash
npm run dev
```

### Option 3: Serveur Node
```bash
npx http-server public/ -p 8000 --cors
```

---

## Que se passe-t-il sans serveur ?

WOSQ v4 fonctionne en **mode dégradé**:

**Disponible** ✅:
- Interface WebOS complète
- Gestionnaire de fichiers
- Terminal bash
- Applications de base
- Mode hors-ligne (limité)

**Non disponible** ❌:
- IA WebLLM locale
- Commandes `aipersist`, `aicache`
- Assistant IA intégré

---

## Test Rapide

Ouvrez la console (F12) et tapez:
```javascript
console.log(window.crossOriginIsolated);
```

- `true` ✅ = WebLLM disponible
- `false` ❌ = Mode dégradé

---

📖 Voir `START-WOSQ.md` pour le guide complet
