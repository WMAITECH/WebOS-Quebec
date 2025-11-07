# WOSQ v4 - Architecture Cellulaire Multi-Processus

## 🎯 Vision

WOSQ v4 représente une révolution architecturale: transformer un **monolithe HTML unique** en un **système d'exploitation cellulaire** capable de générer des **micro-services isolés** (Web Workers) à la volée, tout en respectant la contrainte fondamentale d'un seul fichier.

---

## 🏗️ Architecture Globale

### Schéma Conceptuel

```
┌─────────────────────────────────────────────────────────────┐
│                    WOSQv4.html (Monolithe)                   │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              WorkerDefinitions (ADN)                    │  │
│  │  • database-module    • sync-provider                  │  │
│  │  • ai-orchestrator    • mail-service                   │  │
│  │  • messages-service   • osint-service                  │  │
│  │  • file-service       • [extensible...]                │  │
│  └────────────────────────────────────────────────────────┘  │
│                             ↓                                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    Kernel (Noyau)                       │  │
│  │  • createProcess(name) → génère un Worker dynamique   │  │
│  │  • sendRequest(pid, action, data) → IPC async         │  │
│  │  • handleToolCall() → orchestration entre workers     │  │
│  │  • EventBus → pub/sub pour événements système         │  │
│  └────────────────────────────────────────────────────────┘  │
│                             ↓                                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Processus (Web Workers)                    │  │
│  │                                                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │  │
│  │  │ Database │  │   Sync   │  │    AI    │   ...      │  │
│  │  │  Module  │  │ Provider │  │Orchestr. │            │  │
│  │  └──────────┘  └──────────┘  └──────────┘            │  │
│  │                                                          │  │
│  │  Thread 1      Thread 2      Thread 3       Thread N   │  │
│  └────────────────────────────────────────────────────────┘  │
│                             ↑                                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Applications (UI Layer)                    │  │
│  │  • TaskManager  • Mail       • Messages                │  │
│  │  • OSINT        • Files      • AI Chat                 │  │
│  │  • Portal       • Admin                                │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  Thread Principal (UI, WindowManager, EventDelegation)       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧬 Composants Fondamentaux

### 1. WorkerDefinitions - L'ADN du Système

**Concept**: Le fichier HTML contient le code source de chaque "micro-service" sous forme de **template literals** (chaînes de caractères JavaScript).

```javascript
const WorkerDefinitions = {
  'database-module': `
    // Code complet du worker Database
    console.log('[DatabaseModule] Worker démarré');

    self.onmessage = async (e) => {
      const { id, action, data } = e.data;
      // Logique du worker...
    };
  `,

  'ai-orchestrator': `
    // Code complet du worker AI
    let aiReady = false;

    self.onmessage = async (e) => {
      // Logique avec tool-use...
    };
  `
};
```

**Avantages**:
- ✅ Respecte la contrainte du monolithe (tout dans un fichier)
- ✅ Permet de générer des workers à la demande
- ✅ Facilite la maintenance (chaque worker est clairement défini)
- ✅ Extensible (ajouter un nouveau service = ajouter une entrée)

---

### 2. Kernel - Le Noyau Orchestrateur

**Rôle**: Le Kernel est le cœur du système. Il gère la création, la communication et la destruction des processus.

#### 2.1 Création de Processus Dynamiques

```javascript
createProcess(workerName, metadata = {}) {
  const pid = `proc_${++processId}`;
  const workerCode = WorkerDefinitions[workerName];

  // 1. Créer un fichier virtuel en mémoire
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);

  // 2. Démarrer un VRAI Web Worker
  const worker = new Worker(workerUrl);

  // 3. Gérer la communication
  worker.onmessage = (e) => this.handleProcessMessage(pid, e.data);

  // 4. Stocker l'instance
  processes.set(pid, {
    name: workerName,
    pid,
    status: 'running',
    startTime: Date.now(),
    instance: worker
  });

  return pid;
}
```

**Technique Clé**: Utilisation de `Blob` + `URL.createObjectURL` pour transformer une string en Worker exécutable.

#### 2.2 Communication Inter-Processus (IPC)

Le Kernel implémente un système de **requêtes/réponses asynchrone** entre l'UI et les workers:

```javascript
async sendRequest(pid, action, data = {}) {
  const process = processes.get(pid);
  const id = ++requestId;

  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });

    // Timeout après 30 secondes
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error('Timeout'));
      }
    }, 30000);

    process.instance.postMessage({ id, action, data });
  });
}
```

**Flux de Communication**:
1. L'UI appelle `Kernel.sendRequest(pid, 'list', { limit: 10 })`
2. Le Kernel envoie un message au worker avec un ID unique
3. Le worker traite la requête et répond avec le même ID
4. Le Kernel résout la Promise avec le résultat

#### 2.3 EventBus - Pub/Sub pour Événements Système

```javascript
emit(event, data) {
  eventBus.dispatchEvent(new CustomEvent(event, { detail: data }));
}

on(event, handler) {
  eventBus.addEventListener(event, (e) => handler(e.detail));
}
```

**Utilisation**:
```javascript
// Écouter les événements
Kernel.on('process:created', (data) => {
  console.log(`Processus créé: ${data.name}`);
});

// Émettre des événements
Kernel.emit('ai:ready', { model: 'Llama-3.2-3B' });
```

---

### 3. Architecture Multi-Thread Réelle

**Avant WOSQ v4** (Monolithe classique):
```
[Thread Principal]
├── UI (rendu, interactions)
├── Logique métier (emails, messages, OSINT)
├── Calculs IA
└── Opérations fichiers

❌ Problème: Si l'IA calcule pendant 5 secondes, l'UI gèle
```

**Après WOSQ v4** (Cellulaire):
```
[Thread Principal]     [Thread 1]        [Thread 2]          [Thread 3]
├── UI                 ├── Database      ├── AI              ├── Mail
├── WindowManager      │   Module        │   Orchestrator    │   Service
└── EventDelegation    └── (OPFS)        └── (WebLLM)        └── (API)

✅ L'IA peut calculer sans bloquer l'UI
✅ Chaque service est isolé dans son propre thread
✅ Communication via messages asynchrones
```

---

## 🤖 Agent AI Orchestrateur avec Tool-Use

### Concept Révolutionnaire

L'IA n'est plus une application isolée. Elle devient un **agent orchestrateur** capable d'utiliser les autres services du système comme des **outils**.

### Flux d'Exécution

```
1. Utilisateur: "Résume-moi les emails non lus"

2. Apps.AI.send()
   ↓
3. Kernel.sendRequest(aiPid, 'generate', { prompt: "..." })
   ↓
4. [ai-orchestrator worker]
   - Analyse le prompt
   - Détecte qu'il a besoin de mail-service
   - Envoie un message: { type: 'tool_call', tool: 'mail-service', action: 'list' }
   ↓
5. Kernel.handleToolCall()
   - Crée ou trouve le worker 'mail-service'
   - Envoie la requête: sendRequest(mailPid, 'list', { filter: 'unread' })
   ↓
6. [mail-service worker]
   - Récupère les emails
   - Retourne les résultats
   ↓
7. Kernel renvoie les résultats à [ai-orchestrator]
   ↓
8. [ai-orchestrator worker]
   - Reçoit les emails bruts
   - Génère le résumé avec WebLLM
   - Retourne la réponse finale
   ↓
9. Apps.AI affiche le résumé dans l'UI
```

### Implémentation

**Dans le worker AI**:
```javascript
case 'generate':
  const prompt = data.prompt;

  // Détecter si on a besoin d'un tool
  const needsTool = detectToolNeed(prompt);

  if (needsTool) {
    // Demander au Kernel d'exécuter un tool
    self.postMessage({
      type: 'tool_call',
      tool: 'mail-service',
      action: 'list',
      params: { filter: 'unread' }
    });

    // Attendre la réponse (via un système de promesses)
    const toolResults = await waitForToolResult();

    // Injecter les résultats dans le contexte de l'IA
    const response = await generateWithContext(prompt, toolResults);

    return response;
  }
```

**Dans le Kernel**:
```javascript
async handleToolCall(fromPid, message) {
  // Trouver ou créer le worker pour le tool
  let targetPid = findOrCreateWorker(message.tool);

  // Envoyer la requête au worker cible
  const result = await this.sendRequest(targetPid, message.action, message.params);

  // Renvoyer le résultat au worker appelant
  const process = processes.get(fromPid);
  process.instance.postMessage({
    type: 'tool_result',
    tool: message.tool,
    result
  });
}
```

---

## 📊 Task Manager - Monitoring des Processus

Le Task Manager est une application qui permet de visualiser tous les processus actifs en temps réel.

**Informations affichées**:
- Nom du processus
- PID (Process ID)
- Statut (running, suspended, terminated)
- Uptime (temps depuis le démarrage)
- Nombre de messages traités
- Actions (terminer le processus)

**Capture d'écran (simulée)**:
```
┌─────────────────────────────────────────────────────────┐
│ 📊 Gestionnaire de Tâches                               │
├─────────────────────────────────────────────────────────┤
│ Nom              │ PID        │ Statut   │ Uptime │ Msgs│
├─────────────────────────────────────────────────────────┤
│ database-module  │ proc_1     │ running  │ 45s    │ 12  │
│ sync-provider    │ proc_2     │ running  │ 44s    │ 8   │
│ ai-orchestrator  │ proc_3     │ running  │ 20s    │ 3   │
│ mail-service     │ proc_4     │ running  │ 15s    │ 5   │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Système Local-First avec CRDT (Prochaine Phase)

### Vision

Dans la version complète, le `database-module` intégrera **Yjs** pour implémenter un système **CRDT** (Conflict-free Replicated Data Type).

### Architecture Visée

```javascript
const WorkerDefinitions = {
  'database-module': `
    // Importer Yjs depuis un CDN
    importScripts('https://cdn.jsdelivr.net/npm/yjs@13/dist/yjs.mjs');

    // Créer un document Yjs
    const yDoc = new Y.Doc();
    const messagesMap = yDoc.getMap('messages');
    const emailsMap = yDoc.getMap('emails');

    // Toutes les opérations deviennent des mutations CRDT
    self.onmessage = async (e) => {
      const { action, data } = e.data;

      if (action === 'set') {
        // Écriture locale (sans conflit)
        messagesMap.set(data.key, data.value);

        // Persister dans l'OPFS
        await saveToOPFS(yDoc.encodeStateAsUpdate());
      }
    };
  `
};
```

### Avantages

- ✅ **100% hors ligne**: L'application fonctionne sans jamais toucher au réseau
- ✅ **Synchronisation automatique**: Quand le réseau revient, les changements se syncronisent
- ✅ **Pas de conflits**: Les CRDT garantissent la convergence des données
- ✅ **P2P possible**: Synchronisation directe entre instances via WebRTC

---

## 🚀 Optimisations de Performance

### 1. GPU Acceleration

```css
.topbar, .dock {
  transform: translateZ(0);
  backface-visibility: hidden;
  will-change: transform;
}
```

### 2. Élimination du Backdrop-Blur

**Avant**:
```css
.dock {
  backdrop-filter: blur(20px); /* ❌ Lourd en performance */
}
```

**Après**:
```css
.dock {
  background: rgba(255, 255, 255, 0.25); /* ✅ Opacité simple */
  transform: translateZ(0); /* ✅ GPU acceleration */
}
```

### 3. Event Delegation

**Avant** (102 event handlers inline):
```html
<button onclick="Apps.Mail.open()">Mail</button>
<button onclick="Apps.Messages.open()">Messages</button>
<!-- ... 100 autres boutons -->
```

**Après** (1 seul listener):
```javascript
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (target) {
    const action = target.dataset.action;
    actions[action]?.();
  }
});
```

```html
<button data-action="open-mail">Mail</button>
<button data-action="open-messages">Messages</button>
```

---

## 🔐 Sécurité

### Content Security Policy

WOSQ v4 supporte une CSP stricte:

```javascript
"worker-src 'self' blob:"
```

Permet uniquement les workers depuis:
- Le même domaine (`'self'`)
- Des Blobs générés dynamiquement (`blob:`)

### Isolation des Processus

Chaque worker est **totalement isolé**:
- Pas d'accès au DOM
- Pas d'accès aux variables globales
- Communication uniquement via messages
- Impossible de corrompre d'autres processus

---

## 📈 Métriques et Monitoring

### Métriques Collectées par le Kernel

Pour chaque processus:
- **PID**: Identifiant unique
- **Uptime**: Temps depuis le démarrage
- **Message Count**: Nombre de messages traités
- **Error Count**: Nombre d'erreurs rencontrées
- **Status**: État actuel (running, suspended, terminated)

### Affichage dans le Task Manager

```javascript
const processes = Kernel.getProcesses();
// [
//   {
//     pid: 'proc_1',
//     name: 'database-module',
//     status: 'running',
//     uptime: 45000,
//     messageCount: 12,
//     errorCount: 0
//   },
//   ...
// ]
```

---

## 🎯 Comparaison Architecturale

| Aspect | WOSQ v3 (Monolithe) | WOSQ v4 (Cellulaire) |
|--------|---------------------|----------------------|
| **Architecture** | Single-threaded | Multi-threaded (Web Workers) |
| **Blocage UI** | ❌ Calculs lourds gèlent l'UI | ✅ UI toujours réactive |
| **Isolation** | ❌ Tout dans le même scope | ✅ Chaque service isolé |
| **Scalabilité** | ❌ Difficile d'ajouter des services | ✅ Ajout trivial (nouvelle entrée dans WorkerDefinitions) |
| **Debugging** | ❌ Difficile de tracer les bugs | ✅ Chaque worker a ses propres logs |
| **IA Capacités** | ❌ Application isolée | ✅ Agent orchestrateur avec tool-use |
| **Performance** | 🟡 Bonne pour UI simple | 🟢 Excellente pour tâches lourdes |
| **Complexité** | 🟢 Simple à comprendre | 🟡 Plus sophistiqué |

---

## 🔮 Évolution Future

### Phase 2: CRDT & Local-First

- Intégrer Yjs dans le `database-module`
- Implémenter la persistance OPFS
- Créer le `sync-provider` avec y-supabase et y-webrtc

### Phase 3: WebLLM Réel

- Remplacer les simulations par un vrai chargement de modèle
- Implémenter le streaming de réponses
- Optimiser avec WebGPU

### Phase 4: Outils Avancés

Permettre à l'IA d'utiliser des outils sophistiqués:
- **EmailTool**: Lire, envoyer, chercher dans les emails
- **MessageTool**: Envoyer des messages, créer des conversations
- **OSINTTool**: Lancer des recherches, synthétiser des résultats
- **FileTool**: Lire, écrire, chercher dans les fichiers
- **SystemTool**: Gérer les processus, monitorer les performances

### Phase 5: Extensions Dynamiques

Permettre le chargement de nouveaux workers à l'exécution:

```javascript
// Charger un nouveau worker depuis une URL
await Kernel.loadWorkerDefinition('custom-service', 'https://...');

// Créer une instance
const pid = Kernel.createProcess('custom-service');
```

---

## 📚 Guide d'Utilisation

### Démarrage

1. Ouvrir `WOSQv4.html` dans un navigateur moderne
2. Le système boot automatiquement:
   - Initialisation du Kernel
   - Création des processus de base (database, sync)
   - Affichage de l'interface

### Créer un Nouveau Worker

1. Ajouter une définition dans `WorkerDefinitions`:

```javascript
const WorkerDefinitions = {
  // ... workers existants

  'mon-service': `
    console.log('[MonService] Worker démarré');

    self.onmessage = async (e) => {
      const { id, action, data } = e.data;

      let result = null;

      switch(action) {
        case 'hello':
          result = { message: 'Hello from MonService!' };
          break;
      }

      self.postMessage({ id, success: true, result });
    };
  `
};
```

2. Créer une application pour l'utiliser:

```javascript
const Apps = {
  // ... apps existantes

  MonApp: {
    pid: null,

    async open() {
      if (!this.pid) {
        this.pid = Kernel.createProcess('mon-service');
      }

      const result = await Kernel.sendRequest(this.pid, 'hello');
      alert(result.message);
    }
  }
};
```

3. Ajouter un bouton dans le dock:

```html
<div class="dock-item" data-action="open-monapp" title="Mon App">🚀</div>
```

4. Ajouter l'action:

```javascript
document.addEventListener('click', (e) => {
  const actions = {
    // ... actions existantes
    'open-monapp': () => Apps.MonApp.open()
  };
});
```

---

## 🎓 Principes Architecturaux

### 1. Single Responsibility

Chaque worker a une responsabilité unique:
- `database-module`: Gestion des données
- `sync-provider`: Synchronisation
- `ai-orchestrator`: Intelligence artificielle
- `mail-service`: Gestion des emails

### 2. Separation of Concerns

Séparation claire entre:
- **Kernel**: Gestion des processus
- **WindowManager**: Gestion des fenêtres
- **Apps**: Logique métier UI
- **Workers**: Logique métier backend

### 3. Event-Driven Architecture

Communication via événements:
```javascript
Kernel.emit('process:created', data);
Kernel.on('process:created', handler);
```

### 4. Dependency Injection

Les workers ne connaissent pas le Kernel:
```javascript
// Le worker envoie juste un message
self.postMessage({ type: 'tool_call', tool: 'mail-service' });

// Le Kernel route le message
Kernel.handleToolCall(fromPid, message);
```

---

## 🏆 Conclusion

WOSQ v4 Cellular représente une **révolution architecturale** qui transforme un monolithe HTML en un **système d'exploitation multi-processus moderne**, tout en respectant la contrainte d'un fichier unique.

### Points Forts

✅ **Architecture cellulaire**: Génération dynamique de Web Workers
✅ **Multi-threading réel**: Performance maximale sans bloquer l'UI
✅ **IA Orchestrateur**: Agent capable d'utiliser les services comme outils
✅ **IPC sophistiqué**: Communication async entre processus
✅ **Monitoring avancé**: Task Manager pour visualiser tous les processus
✅ **Extensibilité**: Ajout trivial de nouveaux services
✅ **Monolithe respecté**: Tout dans un seul fichier HTML

### Prochaines Étapes

1. Intégrer Yjs pour le système CRDT local-first
2. Implémenter WebLLM pour l'IA réelle
3. Créer plus de workers (crypto, notifications, analytics)
4. Optimiser les performances avec SharedArrayBuffer
5. Ajouter des tests automatisés

---

**Auteur**: Architecture conçue pour WOSQ - WebOS Québec
**Version**: 4.0.0-cellular
**Date**: 2025-11-07
**Statut**: Prototype fonctionnel, prêt pour évolution
