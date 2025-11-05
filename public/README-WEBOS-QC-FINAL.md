# WebOS Québec Final ⚜️

## 🎯 Qu'est-ce que c'est?

**WebOS Québec Final** est un système d'exploitation web souverain ultra-sophistiqué conçu pour le gouvernement du Québec. Il s'agit d'un **fichier HTML5 monolithique autonome** qui intègre tout ce dont vous avez besoin dans un seul fichier.

---

## ✨ Caractéristiques Principales

### 🏗️ Architecture
- ✅ **Fichier unique** - Tout dans un seul HTML5 (webos-qc-final.html)
- ✅ **Autonome** - Fonctionne sans serveur web
- ✅ **Sophistiqué** - Code de niveau production

### 💾 Persistance Dual-Mode
- ✅ **Mode Cloud** - Synchronisation via Supabase
- ✅ **Mode Local** - Fonctionnement hors ligne complet avec OPFS

### 📱 8 Applications Natives
1. **Portail Citoyen** - Dashboard avec notifications
2. **Gestionnaire de Fichiers** - Explorateur OPFS complet
3. **Assistant IA** - Llama 3.2 3B local avec streaming
4. **Terminal** - 50+ commandes Unix
5. **Moniteur Système** - Performance, logs, backups
6. **OSINT Intelligence** - Agrégation multi-sources
7. **Messages** - Messagerie temps réel
8. **Courriel** - Client email complet

### 🔐 Sécurité
- ✅ Authentification Supabase
- ✅ 2FA avec SMS optionnel
- ✅ Row Level Security (RLS)
- ✅ Chiffrement AES-GCM pour snapshots

### ⚡ Performance
- ✅ Web Vitals monitoring
- ✅ Code splitting virtuel
- ✅ Lazy loading
- ✅ Cache intelligent

---

## 🚀 Démarrage Rapide

### Prérequis

**Navigateur moderne** avec support pour:
- WebGPU (pour IA locale)
- OPFS (pour stockage local)
- ES2022+ JavaScript

**Navigateurs recommandés**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Étapes

1. **Ouvrir le fichier**:
   ```bash
   # Ouvrir directement dans le navigateur
   open webos-qc-final.html

   # Ou avec un serveur local
   python -m http.server 8000
   # Puis ouvrir http://localhost:8000/webos-qc-final.html
   ```

2. **Créer un compte**:
   - Cliquer sur "Créer un compte"
   - Remplir le formulaire
   - Connexion automatique

3. **Explorer**:
   - Utiliser le dock en bas
   - Cliquer sur les icônes pour lancer les applications
   - Drag & drop pour déplacer les fenêtres

---

## 📖 Documentation

### Documentation Complète

Consultez **WEBOS-QC-FINAL-DOCUMENTATION.md** pour:
- Architecture détaillée
- Guide complet de chaque application
- API et développement
- Exemples de code
- Dépannage

### Structure des Fichiers

```
webos-qc-final.html                    # ← FICHIER PRINCIPAL MONOLITHIQUE
WEBOS-QC-FINAL-DOCUMENTATION.md        # Documentation exhaustive
README-WEBOS-QC-FINAL.md               # Ce fichier (guide rapide)
```

---

## 🎮 Utilisation de Base

### Applications

**Portail Citoyen** (1ère icône):
- Dashboard central
- Notifications
- Statistiques

**Gestionnaire de Fichiers** (2ème icône):
- Créer, éditer, supprimer fichiers
- Arborescence complète
- Recherche avancée

**Assistant IA** (3ème icône):
- Chat avec IA locale
- Streaming en temps réel
- Synthèse vocale (TTS)

**Terminal** (4ème icône):
- Shell bash-compatible
- Commandes: `ls`, `cat`, `grep`, `ps`, etc.
- Tapez `help` pour la liste complète

**Moniteur Système** (5ème icône):
- Logs système
- Métriques performance
- Sauvegardes OPFS chiffrées

**OSINT Intelligence** (6ème icône):
- Recherche multi-sources
- Mode actualités
- Analyse sémantique

**Messages** (7ème icône):
- Conversations temps réel
- Pièces jointes
- Accusés de lecture

**Courriel** (8ème icône):
- Emails complets
- Composition
- Pièces jointes

---

## 🔧 Configuration

### Mode de Persistance

**Par défaut**: Mode Cloud (Supabase)

**Changer en mode local**:
```javascript
// Ouvrir la console du navigateur (F12)
StorageManager.setMode('local');
```

**Synchroniser**:
```javascript
StorageManager.sync();
```

### Supabase

**Configuration dans le code**:
```javascript
const CONFIG = {
  supabase: {
    url: 'https://gwcpuwihjouusnohkmcy.supabase.co',
    anonKey: 'eyJ...'
  }
};
```

### IA Locale

**L'IA se charge automatiquement** à la première utilisation de l'Assistant IA.

**Désactiver l'IA**:
```javascript
// Dans la console (F12)
CONFIG.webllm = null;
```

---

## 🛠️ Développement

### Ajouter une Application

```javascript
Apps.MyApp = {
  open() {
    const content = '<div>Mon contenu</div>';
    WindowManager.create('myapp', 'Mon App', content, {
      width: 600,
      height: 400
    });
  }
};
```

### Ajouter au Dock

```html
<!-- Dans le HTML -->
<div class="dock-item" onclick="Apps.MyApp.open()">
  <svg>...</svg>
</div>
```

### Événements Système

```javascript
// Écouter événements
Kernel.on('window:created', (data) => {
  console.log('Fenêtre créée:', data);
});

// Émettre événements
Kernel.emit('custom:event', { data: 'value' });
```

---

## 📊 Performance

### Métriques

Le système surveille automatiquement:
- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)
- **TTFB** (Time To First Byte)

### Voir les Métriques

```javascript
// Console (F12)
PerformanceMonitor.getReport();
```

### Exporter Rapport

```javascript
const report = PerformanceMonitor.exportReport();
console.log(report);
```

---

## 💾 Sauvegardes

### Créer Snapshot

Via **Moniteur Système** > **Onglet Sauvegardes**:
1. Cliquer "Créer Sauvegarde"
2. Entrer mot de passe (optionnel)
3. Snapshot créé et chiffré

### Restaurer Snapshot

1. Cliquer "Restaurer"
2. Sélectionner fichier .webosq
3. Entrer mot de passe si chiffré
4. Restauration automatique

### Export/Import

```javascript
// Export
const blob = await OPFSSnapshot.exportSnapshot('mot-de-passe');
// Télécharger le blob

// Import
const result = await OPFSSnapshot.restoreSnapshot(data, 'mot-de-passe');
```

---

## 🔒 Sécurité

### Activer 2FA

1. Ouvrir **Préférences** dans la barre supérieure
2. Section "Sécurité"
3. Ajouter numéro de téléphone
4. Vérifier code SMS
5. Activer 2FA

### Chiffrement

**Snapshots**: Chiffrés avec AES-GCM (256-bit)

**Messages**: En clair (chiffrement E2E prévu v2.1)

**Mots de passe**: Gérés par Supabase (bcrypt)

---

## 🐛 Dépannage

### IA ne fonctionne pas

**Vérifier WebGPU**:
```javascript
console.log('WebGPU supporté:', !!navigator.gpu);
```

**Solution**: Utiliser Chrome/Edge récent

### Problèmes de connexion

**Vérifier session**:
```javascript
const { data } = await supabaseClient.auth.getSession();
console.log('Session:', data.session);
```

**Solution**: Se reconnecter

### Stockage plein

**Vérifier quota**:
```javascript
const estimate = await navigator.storage.estimate();
console.log('Utilisé:', estimate.usage / 1e6, 'MB');
console.log('Total:', estimate.quota / 1e6, 'MB');
```

**Solution**: Effacer snapshots anciens

### Performance lente

**Désactiver monitoring**:
```javascript
PerformanceMonitor.setEnabled(false);
```

**Effacer logs**:
```javascript
Logger.clearLogs();
```

---

## 📝 Notes Importantes

### Limitations

- **IA locale**: Nécessite WebGPU (Chrome/Edge)
- **OPFS**: Nécessite navigateur récent
- **Stockage**: Limité par quota navigateur (~500 MB - 2 GB)
- **Hors ligne**: Fonctionne mais pas de sync cloud

### Recommandations

- ✅ Utiliser Chrome ou Edge pour meilleures performances
- ✅ Créer des snapshots régulièrement
- ✅ Activer 2FA pour sécurité supplémentaire
- ✅ Vider logs régulièrement

### Bugs Connus

- Terminal: Commandes réseau non implémentées (`curl`, `wget`)
- Messages: Chiffrement E2E pas encore disponible
- OSINT: Certaines sources peuvent être lentes

---

## 🤝 Support

**Questions? Problèmes?**

- 📧 Email: support@quebec.gouv.qc.ca
- 📞 Téléphone: 1-800-XXX-XXXX
- 💬 Chat: Via l'application Messages du système
- 📚 Documentation: WEBOS-QC-FINAL-DOCUMENTATION.md

---

## 📜 Licence

© 2025 Gouvernement du Québec. Tous droits réservés.

Système propriétaire et confidentiel.

---

## 🎯 Version

**v2.0.0-final** - 2025-11-05

Monolithe HTML5 ultra-sophistiqué avec 8 applications natives, IA locale, dual-mode cloud/local, et sécurité avancée.

---

## 🚀 Prochaines Étapes

1. **Tester le système**: Ouvrir webos-qc-final.html
2. **Créer un compte**: S'inscrire avec email/mot de passe
3. **Explorer les apps**: Cliquer sur les icônes du dock
4. **Lire la doc complète**: WEBOS-QC-FINAL-DOCUMENTATION.md
5. **Configurer 2FA**: Dans Préférences > Sécurité

---

**Bienvenue dans WebOS Québec! ⚜️**

Un système d'exploitation web souverain de classe mondiale, entièrement québécois, 100% autonome, et d'une sophistication technique exceptionnelle.

*Fier de notre souveraineté numérique.*
