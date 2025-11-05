import { Shield, Search, Lock, Database, Globe, Zap } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

export function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxZTQwYWYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>

      <nav className="relative z-10 bg-slate-900/50 backdrop-blur-lg border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg">
                <Shield className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">OSINT Québec</h1>
                <p className="text-xs text-blue-300 font-medium">Intelligence Souveraine</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onLogin}
                className="px-6 py-2.5 text-white font-semibold rounded-lg hover:bg-white/10 transition-all duration-200"
              >
                Connexion
              </button>
              <button
                onClick={onRegister}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-500/30"
              >
                S'inscrire
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-semibold mb-8">
              <Lock size={16} />
              <span>Plateforme 100% Souveraine et Sécurisée</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Moteur OSINT de<br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Renseignement Avancé
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Plateforme d'analyse de sources ouvertes (OSINT) avec synthèse intelligente indépendante.
              Conçue pour les professionnels exigeant sécurité maximale et souveraineté des données.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                <Search className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Recherche Multi-Sources</h3>
              <p className="text-slate-300 leading-relaxed">
                Crawling intelligent de sources gouvernementales, académiques et médias vérifiés.
                Indexation automatique avec scoring de fiabilité.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/30">
                <Zap className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Synthèse Indépendante</h3>
              <p className="text-slate-300 leading-relaxed">
                Moteur NLP propriétaire sans dépendance aux APIs externes. Analyse contextuelle,
                détection de consensus et extraction de concepts clés.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-green-500/50 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
                <Shield className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Sécurité Maximale</h3>
              <p className="text-slate-300 leading-relaxed">
                Chiffrement de bout en bout, authentification multi-facteurs, RLS strict.
                Données hébergées au Québec avec souveraineté complète.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold text-white mb-6">Capacités OSINT Avancées</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-400 text-sm">✓</span>
                    </div>
                    <span className="text-slate-300">
                      <strong className="text-white">Crawling Respectueux:</strong> Respect strict des robots.txt et délais politeness configurables
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-400 text-sm">✓</span>
                    </div>
                    <span className="text-slate-300">
                      <strong className="text-white">Déduplication Avancée:</strong> Détection de contenu dupliqué par hashing et similarité sémantique
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-400 text-sm">✓</span>
                    </div>
                    <span className="text-slate-300">
                      <strong className="text-white">Scoring de Fiabilité:</strong> Évaluation composite basée sur réputation, fraîcheur et cohérence
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-400 text-sm">✓</span>
                    </div>
                    <span className="text-slate-300">
                      <strong className="text-white">Corrélation Croisée:</strong> Identification automatique des consensus et contradictions entre sources
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-400 text-sm">✓</span>
                    </div>
                    <span className="text-slate-300">
                      <strong className="text-white">Mode Hors-Ligne:</strong> PWA complète avec synchronisation intelligente en arrière-plan
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-8 border border-slate-700/50">
                <div className="flex items-center gap-3 mb-6">
                  <Database className="text-blue-400" size={24} />
                  <h4 className="text-xl font-bold text-white">Sources Vérifiées</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="text-blue-400" size={18} />
                      <span className="text-slate-200 text-sm font-medium">Gouvernementales</span>
                    </div>
                    <span className="text-xs font-bold text-blue-400 bg-blue-500/20 px-2 py-1 rounded">95%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="text-cyan-400" size={18} />
                      <span className="text-slate-200 text-sm font-medium">Académiques</span>
                    </div>
                    <span className="text-xs font-bold text-cyan-400 bg-cyan-500/20 px-2 py-1 rounded">95%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="text-green-400" size={18} />
                      <span className="text-slate-200 text-sm font-medium">Organisations Intl.</span>
                    </div>
                    <span className="text-xs font-bold text-green-400 bg-green-500/20 px-2 py-1 rounded">95%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="text-yellow-400" size={18} />
                      <span className="text-slate-200 text-sm font-medium">Médias Réputés</span>
                    </div>
                    <span className="text-xs font-bold text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded">90%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-b from-slate-900/0 to-slate-900 py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-4xl font-bold text-white mb-6">
              Prêt à accéder au renseignement souverain?
            </h3>
            <p className="text-xl text-slate-300 mb-10">
              Rejoignez la plateforme OSINT la plus sécurisée et souveraine du Québec
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={onRegister}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-2xl shadow-blue-500/30"
              >
                Créer un compte
              </button>
              <button
                onClick={onLogin}
                className="px-8 py-4 bg-slate-800/80 border border-slate-700 text-white text-lg font-semibold rounded-xl hover:bg-slate-700/80 transition-all duration-200"
              >
                Se connecter
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-slate-400 mb-2">
              OSINT Québec - Plateforme de Renseignement en Sources Ouvertes
            </p>
            <p className="text-slate-500 text-sm">
              Souveraineté numérique • Sécurité maximale • Données hébergées au Québec
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
