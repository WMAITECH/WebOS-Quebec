# 🚀 Guide de Démarrage - WOSQ v4

## Pourquoi un serveur HTTP est nécessaire ?

**WOSQ v4** utilise WebLLM (IA locale dans le navigateur) qui nécessite:
- ✅ Cross-Origin Isolation (COOP/COEP headers)
- ✅ SharedArrayBuffer
- ✅ WebGPU/WebAssembly

⚠️ **Ces fonctionnalités ne sont PAS disponibles avec `file://`**

## Solutions pour lancer WOSQ v4

### Option 1: Serveur Python inclus (Recommandé)

```bash
# Dans le dossier public/
python server.py

# Ou spécifier un port
python server.py 3000
```

Puis ouvrir: `http://localhost:8000/WOSQ.v4.wm.html`

### Option 2: Serveur Vite (Développement)

```bash
# À la racine du projet
npm install
npm run dev
```

Puis ouvrir: `http://localhost:5173/WOSQ.v4.wm.html`

### Option 3: Serveur Node simple

```bash
npx http-server -p 8000 --cors -o WOSQ.v4.wm.html
```

### Option 4: Python HTTP simple (basique)

```bash
python -m http.server 8000
```

⚠️ Cette option ne configure PAS les headers COOP/COEP automatiquement

## Vérification

Une fois le serveur lancé, ouvrez la console (F12) et vérifiez:

```javascript
console.log(window.crossOriginIsolated);
// Doit afficher: true
```

Si `true` ✅ → WebLLM disponible
Si `false` ❌ → Mode dégradé (pas d'IA locale)

## Fonctionnalités en Mode Dégradé

Sans Cross-Origin Isolation, WOSQ v4 fonctionne mais **sans**:
- ❌ IA locale WebLLM
- ❌ Commande `aipersist`
- ❌ Assistant IA intégré

Toutes les autres fonctionnalités restent disponibles:
- ✅ Interface WebOS complète
- ✅ Gestionnaire de fichiers (OPFS)
- ✅ Terminal bash
- ✅ Applications (Mail, Messages, OSINT)
- ✅ Service Worker
- ✅ Mode hors-ligne

## Diagnostic

### Erreur "SharedArrayBuffer is not defined"
→ Cross-Origin Isolation manquant. Utilisez un serveur HTTP avec headers.

### L'IA ne charge pas
→ Vérifiez dans le terminal:
```bash
aicache stats
```

### Service Worker ne s'enregistre pas
→ Normal en mode `file://`. Utilisez HTTP/HTTPS.

## Support

Pour plus d'informations, consultez:
- `WOSQ-V4-QUICKSTART.md` - Guide complet
- `WOSQ-V4-ARCHITECTURE.md` - Architecture technique
- Console du navigateur (F12) - Logs détaillés
