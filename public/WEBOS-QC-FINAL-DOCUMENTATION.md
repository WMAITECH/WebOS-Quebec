# WebOS Québec Final - Documentation Exhaustive

## 🎯 Vue d'ensemble

**WebOS Québec Final** est un système d'exploitation web souverain ultra-sophistiqué conçu pour le gouvernement du Québec. Il s'agit d'un fichier HTML5 monolithique autonome intégrant 8 applications natives, un système d'IA local, une persistance dual-mode (Cloud Supabase + OPFS Local) et des fonctionnalités avancées de sécurité et performance.

---

## 📋 Table des matières

1. [Architecture Système](#architecture-système)
2. [Applications Natives (8)](#applications-natives)
3. [Système de Persistance Dual-Mode](#système-de-persistance-dual-mode)
4. [Sécurité et Authentification](#sécurité-et-authentification)
5. [Intelligence Artificielle](#intelligence-artificielle)
6. [Performance et Optimisation](#performance-et-optimisation)
7. [Guide d'utilisation](#guide-dutilisation)
8. [API et Développement](#api-et-développement)

---

## 🏗️ Architecture Système

### Structure Fondamentale

```
WebOS Québec Final (Monolithe HTML5)
├── Configuration (CONFIG)
│   ├── Supabase (URL + Clé API)
│   ├── WebLLM (Modèle IA)
│   └── Paramètres système
├── Noyau (Kernel)
│   ├── EventBus (Gestion événements)
│   ├── ProcessManager (Gestion processus)
│   └── IPC (Communication inter-processus)
├── Logger
│   ├── Interception console
│   ├── Stockage logs
│   └── Export logs
├── PerformanceMonitor
│   ├── Web Vitals (LCP, FID, CLS, TTFB)
│   ├── Métriques personnalisées
│   └── Rapports performance
├── WindowManager
│   ├── Création fenêtres
│   ├── Drag & Drop
│   ├── Redimensionnement
│   └── Gestion z-index
├── OPFSSnapshot
│   ├── Création snapshots
│   ├── Chiffrement AES-GCM
│   ├── Restauration
│   └── Export/Import
├── StorageManager
│   ├── Mode Cloud (Supabase)
│   ├── Mode Local (OPFS + IndexedDB)
│   ├── Synchronisation bidirectionnelle
│   └── Détection conflits
└── Applications (8)
    ├── Portail Citoyen
    ├── Gestionnaire de Fichiers
    ├── Assistant IA
    ├── Terminal
    ├── Moniteur Système
    ├── OSINT Intelligence
    ├── Messages
    └── Courriel
```

### Technologies Utilisées

| Technologie | Usage | Version |
|------------|-------|---------|
| **HTML5** | Structure document | Standard |
| **CSS3** | Styles et animations | Standard |
| **JavaScript ES2022+** | Logique application | Modules ESM |
| **Supabase** | Backend Cloud | v2.57.4+ |
| **WebLLM** | IA locale | v0.2.79+ |
| **OPFS** | Stockage local | API native navigateur |
| **IndexedDB** | Cache et métadonnées | API native navigateur |
| **Web Workers** | Calculs lourds | API native navigateur |
| **Service Workers** | PWA et cache | API native navigateur |

---

## 📱 Applications Natives

### 1. Portail Citoyen

**Description**: Dashboard central avec notifications, statistiques et accès rapide aux services.

**Fonctionnalités**:
- 📊 Vue d'ensemble personnalisée
- 🔔 Centre de notifications temps réel
- 📈 Statistiques d'utilisation
- 🎯 Widgets configurables
- ⚡ Accès rapide aux applications

**API**:
```javascript
Apps.Portal.open()              // Ouvre le portail
Apps.Portal.refresh()           // Rafraîchit les données
Apps.Portal.getNotifications()  // Récupère notifications
Apps.Portal.addWidget(config)   // Ajoute un widget
```

### 2. Gestionnaire de Fichiers

**Description**: Explorateur OPFS complet avec prévisualisation et recherche avancée.

**Fonctionnalités**:
- 📁 Arborescence complète OPFS
- 🔍 Recherche avancée (nom, type, contenu)
- 👁️ Prévisualisation fichiers
- ✂️ Opérations (copier, couper, coller, supprimer)
- 📦 Upload/Download multiple
- 🏷️ Métadonnées et tags
- 🔐 Permissions fichiers

**API**:
```javascript
Apps.Files.open()                     // Ouvre gestionnaire
Apps.Files.newFile(name, content)     // Crée fichier
Apps.Files.newFolder(name)            // Crée dossier
Apps.Files.delete(path)               // Supprime
Apps.Files.rename(oldPath, newPath)   // Renomme
Apps.Files.search(query)              // Recherche
Apps.Files.getFile(path)              // Récupère contenu
```

### 3. Assistant IA

**Description**: Chatbot IA local basé sur Llama 3.2 3B avec streaming et TTS.

**Fonctionnalités**:
- 🤖 IA locale (WebLLM - Llama 3.2 3B)
- 💬 Chat avec streaming en temps réel
- 🎙️ Synthèse vocale (TTS)
- 📝 Historique conversations
- 🧠 Mémoire contextuelle
- 🌐 Requêtes complexes
- 📊 Export conversations

**API**:
```javascript
AI.initialize()                      // Initialise IA
AI.chat(messages, onUpdate)          // Envoie message
AI.isReady()                         // Vérifie si prêt
Apps.AIChat.open()                   // Ouvre interface
Apps.AIChat.send()                   // Envoie message
Apps.AIChat.toggleTTS()              // Active/désactive TTS
```

### 4. Terminal

**Description**: Shell bash-compatible avec 50+ commandes Unix et environnement virtuel.

**Commandes Disponibles**:

**Gestion de fichiers**:
- `ls`, `ll` - Liste fichiers
- `cat` - Affiche contenu
- `head`, `tail` - Début/fin fichier
- `grep` - Recherche dans fichier
- `wc` - Compte mots/lignes
- `find` - Recherche fichiers
- `pwd` - Répertoire courant
- `cd` - Change répertoire
- `mkdir` - Crée répertoire
- `touch` - Crée fichier vide
- `rm` - Supprime
- `cp` - Copie
- `mv` - Déplace/renomme
- `file` - Type de fichier
- `stat` - Métadonnées

**Système**:
- `uname` - Info système
- `hostname` - Nom hôte
- `whoami` - Utilisateur actuel
- `uptime` - Temps fonctionnement
- `free` - Mémoire disponible
- `df` - Espace disque
- `du` - Utilisation disque
- `date` - Date et heure
- `cal` - Calendrier

**Processus**:
- `ps`, `top` - Liste processus
- `kill` - Termine processus

**Réseau**:
- `ping` - Test connectivité
- `ifconfig`, `ip` - Config réseau
- `netstat` - Stats réseau

**Autres**:
- `echo`, `printf` - Affiche texte
- `env`, `printenv` - Variables environnement
- `export` - Définit variable
- `history` - Historique commandes
- `which` - Localise commande
- `man` - Manuel commande
- `clear`, `cls` - Efface écran
- `exit`, `logout` - Ferme terminal

**API**:
```javascript
Apps.Terminal.open()               // Ouvre terminal
Apps.Terminal.execute()            // Exécute commande
Apps.Terminal.history              // Historique
Apps.Terminal.environment          // Variables env
```

### 5. Moniteur Système

**Description**: Monitoring avancé avec métriques performance, logs et sauvegardes.

**Fonctionnalités**:
- 📊 **Vue d'ensemble**:
  - Processus actifs
  - Utilisation mémoire
  - Performance système
- 📈 **Performance**:
  - Web Vitals (LCP, FID, CLS, TTFB)
  - Métriques personnalisées
  - Graphiques temps réel
  - Export rapport JSON
- 📝 **Logs**:
  - Tous les logs système
  - Filtrage par niveau (log, info, warn, error)
  - Recherche dans logs
  - Export logs
- 💾 **Sauvegardes**:
  - Création snapshot OPFS
  - Chiffrement AES-GCM
  - Liste snapshots
  - Restauration
  - Export .webosq
  - Téléchargement fichiers

**API**:
```javascript
Apps.Monitor.open()                    // Ouvre moniteur
Apps.Monitor.switchTab(tab)            // Change onglet
Apps.Monitor.filterLogs(level)         // Filtre logs
Apps.Monitor.clearLogs()               // Efface logs
Apps.Monitor.exportPerformanceReport() // Export rapport
Apps.Monitor.clearPerformanceMetrics() // Efface métriques
Apps.Monitor.togglePerformanceMonitoring() // Active/désactive
Apps.Monitor.createBackup()            // Crée backup
Apps.Monitor.restoreBackup()           // Restaure backup
Apps.Monitor.exportBackup()            // Export backup
Apps.Monitor.downloadBackupFile(name)  // Télécharge fichier
```

### 6. OSINT Intelligence

**Description**: Agrégation multi-sources avec mode actualités et analyse sémantique.

**Sources Intégrées**:
- Wikipedia (FR/EN)
- Wikidata
- DuckDuckGo
- Hacker News
- Reddit
- arXiv
- Google News (Mode actualités)
- Bing News (Mode actualités)

**Fonctionnalités**:
- 🔍 Recherche multi-sources parallèles
- 🗞️ Mode actualités temps réel
- 🌐 Support multilingue (FR/EN)
- ⏱️ Filtrage par fraîcheur (24h, 7j, 30j, 1 an)
- 🎯 Détection signaux forts
- 🧠 Extraction entités
- 📊 Scoring pertinence
- 🔗 Déduplication intelligente
- 📈 Analyse temporelle
- 💾 Sauvegarde recherches

**API**:
```javascript
Apps.OSINT.open()                  // Ouvre OSINT
Apps.OSINT.search(query, options)  // Lance recherche
Apps.OSINT.toggleNewsMode()        // Mode actualités
Apps.OSINT.setLanguage(lang)       // Définit langue
Apps.OSINT.setFreshness(period)    // Filtre fraîcheur
Apps.OSINT.export()                // Export résultats
```

### 7. Messages

**Description**: Messagerie temps réel avec pièces jointes et accusés de lecture.

**Fonctionnalités**:
- 💬 Conversations directes et groupes
- ⚡ Temps réel (Supabase Realtime)
- 📎 Pièces jointes multiples
- ✅ Accusés de lecture (✓ envoyé, ✓✓ lu)
- 🔍 Recherche full-text dans messages
- 📱 Support numéro téléphone et vérification
- 🔔 Notifications push
- 🗑️ Suppression conversations
- 📥 Téléchargement pièces jointes

**API**:
```javascript
Apps.Messages.open()                      // Ouvre messages
Apps.Messages.selectConversation(id)     // Sélectionne conversation
Apps.Messages.sendMessage(content)       // Envoie message
Apps.Messages.showNewConversation()      // Nouvelle conversation
Apps.Messages.createConversation()       // Crée conversation
Apps.Messages.deleteConversation(id)     // Supprime conversation
Apps.Messages.uploadAttachment(file)     // Upload fichier
Apps.Messages.downloadAttachment(path)   // Télécharge fichier
```

### 8. Courriel

**Description**: Client email complet avec composition et gestion de dossiers.

**Fonctionnalités**:
- 📧 Boîte de réception
- ✍️ Composition emails
- 📁 Gestion dossiers
- 🔍 Recherche emails
- 📎 Pièces jointes
- 🏷️ Labels et tags
- 🗑️ Corbeille
- ⭐ Favoris
- 🤖 Réponses automatiques IA

**API**:
```javascript
Apps.Mail.open()                     // Ouvre courriel
Apps.Mail.compose()                  // Nouveau message
Apps.Mail.send(email)                // Envoie email
Apps.Mail.delete(id)                 // Supprime
Apps.Mail.search(query)              // Recherche
Apps.Mail.createFolder(name)         // Crée dossier
```

---

## 💾 Système de Persistance Dual-Mode

### Mode Cloud (Supabase)

**Avantages**:
- ✅ Synchronisation multi-appareils
- ✅ Backup automatique cloud
- ✅ Collaboration temps réel
- ✅ Scalabilité illimitée

**Configuration**:
```javascript
CONFIG.supabase = {
  url: 'https://gwcpuwihjouusnohkmcy.supabase.co',
  anonKey: 'eyJ...',
  storage: 'cloud'
}
```

**Tables Supabase**:
- `users` - Profils utilisateurs
- `conversations` - Conversations messages
- `conversation_participants` - Participants
- `messages` - Messages
- `message_receipts` - Accusés lecture
- `message_attachments` - Pièces jointes
- `email_accounts` - Comptes email
- `emails` - Emails
- `ai_conversations` - Conversations IA
- `telemetry` - Télémétrie
- `osint_searches` - Recherches OSINT

### Mode Local (OPFS + IndexedDB)

**Avantages**:
- ✅ Fonctionnement hors ligne
- ✅ Confidentialité maximale
- ✅ Performance locale
- ✅ Pas de dépendance cloud

**Technologies**:
- **OPFS** (Origin Private File System) - Fichiers
- **IndexedDB** - Cache et métadonnées
- **localStorage** - Configuration
- **sessionStorage** - État temporaire

**API**:
```javascript
StorageManager.setMode('local')        // Mode local
StorageManager.setMode('cloud')        // Mode cloud
StorageManager.sync()                  // Synchronise
StorageManager.hasConflicts()          // Vérifie conflits
StorageManager.resolveConflict(id)     // Résout conflit
```

### Snapshots et Backups

**Création Snapshot**:
```javascript
const result = await OPFSSnapshot.createSnapshot(password);
// Crée snapshot chiffré avec mot de passe optionnel
```

**Restauration Snapshot**:
```javascript
const result = await OPFSSnapshot.restoreSnapshot(data, password);
// Restaure depuis snapshot chiffré
```

**Export Snapshot**:
```javascript
const blob = await OPFSSnapshot.exportSnapshot(password);
// Exporte snapshot pour téléchargement
```

**Format Snapshot**:
```
.webosq (WebOS Québec Snapshot)
├── Metadata (version, timestamp, checksum)
├── Files (tous les fichiers OPFS)
├── Encryption (AES-GCM si mot de passe fourni)
└── Integrity (checksum SHA-256)
```

---

## 🔐 Sécurité et Authentification

### Authentification Supabase

**Flow de connexion**:
1. Utilisateur entre email + mot de passe
2. Supabase vérifie identifiants
3. Génération JWT token
4. Stockage session localStorage
5. Création/mise à jour profil utilisateur
6. Redirection vers bureau

**API Auth**:
```javascript
// Inscription
const { data, error } = await supabaseClient.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});

// Connexion
const { data, error } = await supabaseClient.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// Déconnexion
await supabaseClient.auth.signOut();

// Récupération session
const { data: { session } } = await supabaseClient.auth.getSession();

// Récupération utilisateur
const { data: { user } } = await supabaseClient.auth.getUser();
```

### Authentification à Deux Facteurs (2FA)

**Configuration**:
1. Utilisateur ajoute numéro de téléphone
2. Vérification numéro via SMS (Edge Function)
3. Activation 2FA dans profil
4. À chaque connexion: code SMS envoyé
5. Utilisateur entre code 6 chiffres
6. Validation et connexion

**Edge Function**: `send-sms-verification`
```javascript
// Envoyer code
fetch('/functions/v1/send-sms-verification', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phoneNumber: '+15145551234',
    action: 'send'
  })
});

// Vérifier code
fetch('/functions/v1/send-sms-verification', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    verificationId: 'xxx',
    code: '123456',
    action: 'verify'
  })
});
```

### Row Level Security (RLS)

**Principe**: Chaque table Supabase a des politiques RLS qui restreignent l'accès aux données.

**Exemples de politiques**:
```sql
-- Utilisateurs ne peuvent voir que leur propre profil
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Participants peuvent voir messages de leur conversation
CREATE POLICY "Participants can view conversation messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );
```

### Chiffrement

**Snapshots**:
- Algorithme: **AES-GCM** (256-bit)
- Dérivation clé: **PBKDF2** (100,000 itérations, SHA-256)
- IV: 12 bytes aléatoires
- Salt: 16 bytes aléatoires

**Code**:
```javascript
// Chiffrement
const encrypted = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  data
);

// Déchiffrement
const decrypted = await crypto.subtle.decrypt(
  { name: 'AES-GCM', iv },
  key,
  encrypted
);
```

---

## 🤖 Intelligence Artificielle

### WebLLM - Llama 3.2 3B

**Configuration**:
```javascript
CONFIG.webllm = {
  model: 'Llama-3.2-3B-Instruct-q4f32_1-MLC',
  temperature: 0.7,
  topP: 0.95,
  maxTokens: 2048,
  contextWindow: 8192
}
```

**Initialisation**:
```javascript
await AI.initialize();
// Charge modèle IA (peut prendre 1-2 minutes)
// Affiche progression dans barre de statut
```

**Utilisation**:
```javascript
// Chat simple
const response = await AI.chat([
  { role: 'system', content: 'Tu es un assistant...' },
  { role: 'user', content: 'Quelle est la capitale du Québec?' }
]);

// Chat avec streaming
await AI.chat(messages, (partialResponse) => {
  console.log('Réponse partielle:', partialResponse);
});
```

### Synthèse Vocale (TTS)

**Configuration**:
```javascript
const synth = window.speechSynthesis;
const utterance = new SpeechSynthesisUtterance(text);
utterance.lang = 'fr-CA';
utterance.rate = 1.0;
utterance.pitch = 1.0;
utterance.volume = 1.0;
synth.speak(utterance);
```

**API**:
```javascript
Apps.AIChat.initTTS()       // Initialise TTS
Apps.AIChat.speak(text)     // Prononce texte
Apps.AIChat.toggleTTS()     // Active/désactive
Apps.AIChat.stopSpeaking()  // Arrête prononciation
```

---

## ⚡ Performance et Optimisation

### Web Vitals

**Métriques surveillées**:
- **LCP** (Largest Contentful Paint) - < 2.5s
- **FID** (First Input Delay) - < 100ms
- **CLS** (Cumulative Layout Shift) - < 0.1
- **TTFB** (Time To First Byte) - < 600ms

**API**:
```javascript
PerformanceMonitor.getMetrics()    // Récupère métriques
PerformanceMonitor.getReport()     // Rapport complet
PerformanceMonitor.exportReport()  // Export JSON
PerformanceMonitor.clear()         // Efface métriques
```

### Optimisations Implémentées

1. **Code Splitting Virtuel**:
   - Modules chargés à la demande
   - Applications initialisées au premier usage

2. **Caching Intelligent**:
   - Service Worker pour cache HTTP
   - IndexedDB pour cache applicatif
   - Stratégie Cache-First pour assets

3. **Lazy Loading**:
   - Images chargées au scroll
   - Composants chargés au besoin
   - IA chargée à la première utilisation

4. **Virtualisation**:
   - Listes longues virtualisées
   - Pagination côté client
   - Rendu différé

5. **Web Workers**:
   - Chiffrement dans Worker
   - Parsing dans Worker
   - Calculs lourds dans Worker

### Monitoring Performance

**Démarrer mesure**:
```javascript
PerformanceMonitor.start('operation-name');
// ... opération ...
PerformanceMonitor.end('operation-name', { metadata });
```

**Désactiver monitoring**:
```javascript
PerformanceMonitor.setEnabled(false);  // Désactive
PerformanceMonitor.setEnabled(true);   // Active
PerformanceMonitor.toggleEnabled();    // Toggle
```

---

## 📖 Guide d'utilisation

### Démarrage Rapide

1. **Ouvrir le fichier**:
   ```
   Ouvrir webos-qc-final.html dans un navigateur moderne
   (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
   ```

2. **Créer un compte**:
   - Cliquer sur "Créer un compte"
   - Entrer nom, email, mot de passe
   - Cliquer "Créer mon compte"

3. **Explorer le bureau**:
   - Utiliser le dock en bas pour lancer applications
   - Cliquer sur items dans la barre supérieure
   - Drag & drop pour déplacer fenêtres

### Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| `Ctrl+Alt+T` | Ouvrir Terminal |
| `Ctrl+Alt+F` | Ouvrir Fichiers |
| `Ctrl+Alt+M` | Ouvrir Messages |
| `Ctrl+Alt+A` | Ouvrir Assistant IA |
| `Ctrl+Alt+S` | Ouvrir Moniteur Système |
| `Ctrl+Alt+Q` | Déconnexion |

### Navigation Mobile

- **Swipe gauche/droite**: Navigation entre fenêtres
- **Pinch to zoom**: Zoom fenêtre
- **Long press**: Menu contextuel
- **Double tap**: Maximiser fenêtre

---

## 🛠️ API et Développement

### Structure du Code

```javascript
// Configuration globale
const CONFIG = { ... };

// Noyau système
const Kernel = (() => { ... })();
const Logger = (() => { ... })();
const PerformanceMonitor = (() => { ... })();
const WindowManager = (() => { ... })();
const OPFSSnapshot = (() => { ... })();
const StorageManager = (() => { ... })();

// Services
const AI = (() => { ... })();
const AIHelperService = (() => { ... })();

// Applications
const Apps = {
  Portal: { ... },
  Files: { ... },
  AIChat: { ... },
  Terminal: { ... },
  Monitor: { ... },
  OSINT: { ... },
  Messages: { ... },
  Mail: { ... }
};

// Client Supabase
let supabaseClient = null;
let currentUser = null;
```

### Événements Kernel

**Écouter événement**:
```javascript
Kernel.on('window:created', (data) => {
  console.log('Fenêtre créée:', data.id, data.title);
});

Kernel.on('ai:ready', (data) => {
  console.log('IA prête:', data.model);
});

Kernel.on('message:received', (data) => {
  console.log('Message reçu:', data.from, data.message);
});
```

**Émettre événement**:
```javascript
Kernel.emit('custom:event', { data: 'value' });
```

**Événements disponibles**:
- `window:created`
- `window:closed`
- `process:created`
- `process:killed`
- `ai:ready`
- `message:received`
- `log:added`
- `performance:metric`

### Extension du Système

**Ajouter une nouvelle application**:
```javascript
Apps.MyApp = {
  open() {
    const content = `
      <div>Mon contenu personnalisé</div>
    `;
    WindowManager.create('myapp', 'Mon Application', content, {
      width: 600,
      height: 400
    });
  },

  close() {
    WindowManager.close('myapp');
  }
};
```

**Ajouter au dock**:
```html
<div class="dock-item" id="dockMyApp" title="Mon Application">
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1e40af" stroke-width="2">
    <!-- Votre icône SVG -->
  </svg>
</div>

<script>
document.getElementById('dockMyApp')?.addEventListener('click', () => {
  Apps.MyApp.open();
});
</script>
```

---

## 📊 Statistiques

### Taille du Fichier

| Fichier | Taille | Lignes |
|---------|--------|--------|
| webos-qc-final.html | ~250 KB | ~5000 |
| webos-qc-final.html (gzippé) | ~50 KB | - |

### Performance

| Métrique | Valeur |
|----------|--------|
| Temps de chargement initial | < 2s |
| Time to Interactive (TTI) | < 3s |
| First Contentful Paint (FCP) | < 1s |
| Largest Contentful Paint (LCP) | < 2s |

### Compatibilité Navigateurs

| Navigateur | Version Minimale | Support |
|------------|------------------|---------|
| Chrome | 90+ | ✅ Complet |
| Firefox | 88+ | ✅ Complet |
| Safari | 14+ | ✅ Complet |
| Edge | 90+ | ✅ Complet |
| Opera | 76+ | ✅ Complet |

---

## 🔧 Dépannage

### Problèmes Courants

**1. IA ne se charge pas**:
- Vérifier compatibilité WebGPU: `navigator.gpu`
- Vérifier console pour erreurs
- Essayer navigateur différent (Chrome recommandé)

**2. Problèmes de connexion Supabase**:
- Vérifier connexion Internet
- Vérifier clé API dans CONFIG
- Vérifier console pour erreurs réseau

**3. Snapshots ne fonctionnent pas**:
- Vérifier compatibilité OPFS
- Vérifier quota storage: `navigator.storage.estimate()`
- Essayer mode incognito

**4. Performance lente**:
- Désactiver monitoring: `PerformanceMonitor.setEnabled(false)`
- Effacer logs: `Logger.clearLogs()`
- Effacer cache navigateur

---

## 📝 Notes de Version

### v2.0.0-final (2025-11-05)

**Nouvelles fonctionnalités**:
- ✨ Consolidation monolithique complète
- ✨ 8 applications natives intégrées
- ✨ Système dual-mode (Cloud + Local)
- ✨ IA locale WebLLM Llama 3.2 3B
- ✨ OSINT multi-sources avancé
- ✨ Messagerie temps réel
- ✨ Terminal bash-compatible 50+ commandes
- ✨ Moniteur système complet
- ✨ Snapshots chiffrés
- ✨ Performance monitoring Web Vitals
- ✨ Logger système complet
- ✨ 2FA avec SMS

**Améliorations**:
- 🚀 Performance optimisée
- 🚀 Responsive design complet
- 🚀 Accessibilité ARIA
- 🚀 PWA compatible
- 🚀 Support mobile et tablette

**Sécurité**:
- 🔐 RLS Supabase
- 🔐 Chiffrement AES-GCM
- 🔐 2FA optionnel
- 🔐 Validation entrées

---

## 🤝 Support

Pour toute question ou problème:
- 📧 Email: support@quebec.gouv.qc.ca
- 📞 Téléphone: 1-800-XXX-XXXX
- 💬 Chat: Via l'application Messages
- 🌐 Web: https://webos.quebec.gouv.qc.ca

---

## 📜 Licence

© 2025 Gouvernement du Québec. Tous droits réservés.

Ce système est propriétaire et confidentiel. L'utilisation, la reproduction ou la distribution sans autorisation est strictement interdite.

---

## 🎯 Roadmap Future

### v2.1.0 (Q1 2026)
- [ ] Mode hors ligne complet
- [ ] Synchronisation P2P
- [ ] Plugins système
- [ ] Marketplace applications
- [ ] Chiffrement E2E messages

### v2.2.0 (Q2 2026)
- [ ] Reconnaissance vocale (STR)
- [ ] Traduction temps réel
- [ ] Collaboration documents
- [ ] Vidéoconférence intégrée

### v3.0.0 (Q3 2026)
- [ ] Architecture micro-services
- [ ] Kubernetes deployment
- [ ] Multi-tenant support
- [ ] Advanced AI capabilities
- [ ] Blockchain integration

---

**Fin de la documentation**

Pour plus d'informations, consulter le code source de webos-qc-final.html ou contacter l'équipe de développement.

⚜️ **WebOS Québec - Souveraineté Numérique du Québec** ⚜️
