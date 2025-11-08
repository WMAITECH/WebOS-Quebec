# 🌐 WOSQ v4 - Commande `serve` Intégrée

## Nouvelle Fonctionnalité: Diagnostic HTTP/CORS dans le Terminal

WOSQ v4 intègre maintenant une commande `serve` directement dans le terminal bash qui diagnostique l'environnement d'exécution et fournit des instructions pour activer toutes les fonctionnalités.

---

## 🚀 Utilisation

### Depuis le Terminal WOSQ

1. Ouvrez le **Terminal** (icône 💻 dans le Dock)
2. Tapez la commande:
   ```bash
   serve
   ```

### Depuis la Notification de Démarrage

Quand WOSQ détecte que Cross-Origin Isolation n'est pas activé, une notification apparaît avec un bouton **"📋 Voir Instructions"** qui ouvre automatiquement le terminal et exécute la commande `serve`.

---

## 📊 Que fait la commande `serve` ?

### Si Cross-Origin Isolation est DÉSACTIVÉ ❌

```
╔════════════════════════════════════════════════════════╗
║  WOSQ HTTP Server - Serveur avec COOP/COEP            ║
╚════════════════════════════════════════════════════════╝

⚠️  Cross-Origin Isolation NON détecté

Le Service Worker va activer les headers COOP/COEP.
Cela permettra à WebLLM et aux fonctionnalités IA
de fonctionner correctement.

🔄 Préparation du serveur...

✅ Service Worker configuré avec headers COOP/COEP

📋 Instructions:
   1. Le fichier doit être servi via HTTP/HTTPS
   2. Options recommandées:

   • Python (serveur inclus):
     $ python server.py
     Puis: http://localhost:8000/WOSQ.v4.wm.html

   • npm/Vite:
     $ npm run dev
     Puis: http://localhost:5173/WOSQ.v4.wm.html

   • Node http-server:
     $ npx http-server -p 8000 --cors

💡 Une fois servi via HTTP, rafraîchissez la page
   et Cross-Origin Isolation sera activé.

📖 Voir README-CHROME.md pour plus de détails
```

### Si Cross-Origin Isolation est ACTIVÉ ✅

```
╔════════════════════════════════════════════════════════╗
║  WOSQ HTTP Server - Serveur avec COOP/COEP            ║
╚════════════════════════════════════════════════════════╝

✅ Cross-Origin Isolation ACTIF

Le serveur est déjà correctement configuré!

📊 Status:
   • URL: http://localhost:8000/WOSQ.v4.wm.html
   • COOP: same-origin ✓
   • COEP: credentialless ✓
   • SharedArrayBuffer: ✓
   • WebAssembly: ✓

🤖 Fonctionnalités IA disponibles:
   • WebLLM (modèles locaux)
   • Commande: aipersist enable
   • Commande: aicache stats

Tout est prêt pour une utilisation complète!
```

---

## 🛠️ Options de Serveur

### Option 1: Serveur Python Inclus (Recommandé ⭐)

Le fichier `server.py` est inclus dans le dossier `public/` et configure automatiquement tous les headers nécessaires.

```bash
cd public/
python server.py
```

**Avantages:**
- ✅ Headers COOP/COEP automatiques
- ✅ Interface CLI claire
- ✅ Aucune installation requise (Python 3 standard)
- ✅ Cross-platform (Windows, macOS, Linux)

### Option 2: npm/Vite (Développement)

```bash
npm run dev
```

**Avantages:**
- ✅ Hot reload automatique
- ✅ Headers préconfigurés dans `vite.config.ts`
- ✅ Build tools intégrés

### Option 3: Node http-server

```bash
npx http-server -p 8000 --cors
```

**Note:** Peut ne pas configurer COOP/COEP automatiquement. Préférez Python ou Vite.

---

## 🔍 Vérification Manuelle

### Dans la Console du Navigateur (F12)

```javascript
// Vérifier Cross-Origin Isolation
console.log('Cross-Origin Isolated:', window.crossOriginIsolated);

// Vérifier SharedArrayBuffer
console.log('SharedArrayBuffer:', typeof SharedArrayBuffer !== 'undefined');

// Vérifier WebAssembly
console.log('WebAssembly:', typeof WebAssembly !== 'undefined');

// Vérifier WebGPU (pour WebLLM)
console.log('WebGPU:', !!navigator.gpu);
```

**Résultats attendus (avec serveur HTTP):**
```
Cross-Origin Isolated: true
SharedArrayBuffer: true
WebAssembly: true
WebGPU: true (Chrome/Edge)
```

---

## 📚 Commandes Terminal Associées

### Aide sur la commande `serve`

```bash
man serve
```

Affiche le manuel complet de la commande.

### Autres commandes réseau

```bash
ping localhost          # Test de connectivité
ifconfig               # Configuration réseau
netstat                # Statistiques réseau
```

---

## 🤖 Fonctionnalités IA Activées

Une fois Cross-Origin Isolation activé, vous avez accès à:

### Commandes IA Terminal

```bash
# Activer la persistance IA
aipersist enable

# Vérifier le status
aipersist status

# Désactiver
aipersist disable

# Gérer le cache WebLLM
aicache stats
aicache clear
aicache list
```

### Applications IA

- **Assistant IA** (💬 icône dans le Dock)
  - Chat avec WebLLM Llama 3.2 3B
  - Streaming temps réel
  - Synthèse vocale TTS
  - Sauvegarde conversations

---

## ⚠️ Limitations Sans Cross-Origin Isolation

### Ce qui NE fonctionne PAS en mode `file://`

- ❌ WebLLM (IA locale)
- ❌ Commandes `aipersist`, `aicache`
- ❌ Assistant IA intégré
- ❌ SharedArrayBuffer
- ⚠️ Service Worker limité

### Ce qui FONCTIONNE toujours

- ✅ Interface WebOS complète
- ✅ Terminal bash (toutes commandes sauf IA)
- ✅ Gestionnaire de fichiers (OPFS)
- ✅ Applications (Messages, Mail, OSINT)
- ✅ Authentification Supabase
- ✅ Temps réel (Realtime)
- ✅ Stockage local (localStorage, IndexedDB)

---

## 💡 Astuces

### 1. Bookmark l'URL HTTP

Une fois le serveur lancé, ajoutez `http://localhost:8000/WOSQ.v4.wm.html` à vos favoris pour un accès rapide.

### 2. Script de Démarrage Automatique

Créez un fichier `start-wosq.sh`:

```bash
#!/bin/bash
cd public/
python server.py
```

Puis:
```bash
chmod +x start-wosq.sh
./start-wosq.sh
```

### 3. Vérification Rapide

Ajoutez cette fonction à votre profil bash:

```bash
wosq-check() {
  curl -sI http://localhost:8000/WOSQ.v4.wm.html | grep -i "cross-origin"
}
```

---

## 🐛 Dépannage

### Le serveur Python ne démarre pas

**Erreur:** `Address already in use`

**Solution:**
```bash
# Trouver le processus utilisant le port 8000
lsof -i :8000
# ou sur Windows
netstat -ano | findstr :8000

# Tuer le processus ou utiliser un autre port
python server.py 3000
```

### Les headers COOP/COEP ne sont pas appliqués

**Vérification:**
```bash
curl -I http://localhost:8000/WOSQ.v4.wm.html | grep -i cross-origin
```

**Doit afficher:**
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: credentialless
```

**Solution:** Utilisez le serveur Python inclus (`server.py`) qui configure ces headers automatiquement.

### WebLLM ne charge toujours pas

**Vérifications:**
1. ✅ Cross-Origin Isolation activé
2. ✅ Navigateur compatible (Chrome/Edge avec WebGPU)
3. ✅ Mémoire suffisante (~4 GB RAM libre)
4. ✅ GPU disponible

```javascript
// Dans la console
console.log('GPU:', await navigator.gpu?.requestAdapter());
```

---

## 📖 Documentation Complémentaire

- **START-WOSQ.md** - Guide de démarrage complet
- **README-CHROME.md** - Explication problème Chrome/file://
- **WOSQ-V4-ARCHITECTURE.md** - Architecture technique
- **server.py** - Code source serveur Python

---

## 🎯 Workflow Recommandé

### Première Utilisation

1. **Télécharger** WOSQ.v4.wm.html
2. **Ouvrir** le fichier dans le navigateur
3. **Voir** la notification Cross-Origin
4. **Cliquer** "📋 Voir Instructions"
5. **Terminal s'ouvre** avec commande `serve`
6. **Lire** les instructions
7. **Lancer** `python server.py`
8. **Ouvrir** http://localhost:8000/WOSQ.v4.wm.html
9. **Profiter** de toutes les fonctionnalités!

### Utilisation Quotidienne

1. **Lancer** `python server.py` (une seule fois)
2. **Ouvrir** http://localhost:8000/WOSQ.v4.wm.html
3. **Travailler** avec WOSQ
4. **Fermer** (le serveur reste actif)

---

## ✨ Résumé

La commande `serve` intégrée dans WOSQ v4 fournit:

✅ **Diagnostic automatique** de l'environnement
✅ **Instructions claires** pour chaque situation
✅ **Vérification complète** des capacités (COOP, COEP, SharedArrayBuffer, WebAssembly, WebGPU)
✅ **Guide pas à pas** pour activer toutes les fonctionnalités
✅ **Intégration terminal** pour une expérience fluide
✅ **Documentation contextuelle** accessible via `man serve`

**Un simple `serve` dans le terminal vous dit exactement quoi faire!**

---

*Fier de notre souveraineté numérique!* ⚜️
