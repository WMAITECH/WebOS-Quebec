import { useState, useEffect } from 'react';
import { SearchBar } from './components/SearchBar';
import { SearchResults } from './components/SearchResults';
import { AISynthesis } from './components/AISynthesis';
import { FilterPanel, SearchFilters } from './components/FilterPanel';
import { SourcesManager } from './components/SourcesManager';
import { LandingPage } from './components/LandingPage';
import { AuthPanel } from './components/AuthPanel';
import { MessagingApp } from './components/MessagingApp';
import { PhoneVerification } from './components/PhoneVerification';
import { Search, Database, LogOut, Shield, MessageCircle, Phone } from 'lucide-react';
import { supabase } from './lib/supabase';

interface SearchResult {
  id: string;
  url: string;
  title: string;
  content: string;
  author: string | null;
  published_at: string | null;
  source: {
    name: string;
    domain: string;
    category: string;
    reliability_score: number;
  };
  relevance_score: number;
}

type AppView = 'landing' | 'login' | 'register' | 'app';
type AppSection = 'search' | 'sources' | 'messages' | 'phone';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [appSection, setAppSection] = useState<AppSection>('search');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [queryId, setQueryId] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section') as AppSection | null;
    if (section && ['search', 'sources', 'messages', 'phone'].includes(section)) {
      setAppSection(section);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || null);
        setUserId(session.user.id);
        setCurrentView('app');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || null);
        setUserId(session.user.id);
        setCurrentView('app');
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
        setUserId(null);
        setCurrentView('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserEmail(null);
    setUserId(null);
    setCurrentView('landing');
  };

  const handleSearch = async (searchQuery: string) => {
    setIsLoading(true);
    setQuery(searchQuery);
    setHasSearched(true);
    setResults([]);
    setQueryId('');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          filters,
          limit: 20,
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results || []);
      setQueryId(data.queryId || '');
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (currentView === 'landing') {
    return (
      <LandingPage
        onLogin={() => setCurrentView('login')}
        onRegister={() => setCurrentView('register')}
      />
    );
  }

  if (currentView === 'login') {
    return (
      <AuthPanel
        mode="login"
        onSuccess={() => setCurrentView('app')}
        onSwitchMode={() => setCurrentView('register')}
        onBack={() => setCurrentView('landing')}
      />
    );
  }

  if (currentView === 'register') {
    return (
      <AuthPanel
        mode="register"
        onSuccess={() => setCurrentView('app')}
        onSwitchMode={() => setCurrentView('login')}
        onBack={() => setCurrentView('landing')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
                <Shield className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">OSINT Québec</h1>
                <p className="text-xs text-blue-600 font-medium">Intelligence Souveraine</p>
              </div>
            </div>
            <nav className="flex items-center gap-3">
              <button
                onClick={() => setAppSection('search')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  appSection === 'search'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                    : 'text-gray-700 hover:bg-slate-100'
                }`}
              >
                <Search size={18} className="inline mr-2" />
                Recherche
              </button>
              <button
                onClick={() => setAppSection('sources')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  appSection === 'sources'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                    : 'text-gray-700 hover:bg-slate-100'
                }`}
              >
                <Database size={18} className="inline mr-2" />
                Sources
              </button>
              <button
                onClick={() => setAppSection('messages')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  appSection === 'messages'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md'
                    : 'text-gray-700 hover:bg-slate-100'
                }`}
              >
                <MessageCircle size={18} className="inline mr-2" />
                Messages
              </button>
              <button
                onClick={() => setAppSection('phone')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  appSection === 'phone'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md'
                    : 'text-gray-700 hover:bg-slate-100'
                }`}
              >
                <Phone size={18} className="inline mr-2" />
                2FA
              </button>
              <div className="w-px h-8 bg-slate-300 mx-2"></div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{userEmail}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  <LogOut size={18} />
                  Déconnexion
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {appSection === 'search' && (
          <div className="space-y-8">
            <div className="flex flex-col items-center gap-6">
              {!hasSearched && (
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-bold text-gray-900 mb-3">
                    Recherche OSINT Multi-Sources
                  </h2>
                  <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Accédez aux informations vérifiées des agences gouvernementales, institutions académiques,
                    organisations internationales et médias de confiance
                  </p>
                </div>
              )}

              <SearchBar onSearch={handleSearch} isLoading={isLoading} />

              {hasSearched && <FilterPanel filters={filters} onFiltersChange={setFilters} />}
            </div>

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600 font-medium">Recherche dans les sources de confiance...</p>
              </div>
            )}

            {!isLoading && hasSearched && (
              <>
                <div className="flex flex-col items-center gap-8">
                  <SearchResults results={results} query={query} />

                  {results.length > 0 && queryId && (
                    <AISynthesis
                      queryId={queryId}
                      query={query}
                      results={results}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {appSection === 'sources' && <SourcesManager />}

        {appSection === 'messages' && (
          <div className="h-[calc(100vh-12rem)]">
            <MessagingApp />
          </div>
        )}

        {appSection === 'phone' && userId && (
          <div className="py-8">
            <PhoneVerification
              userId={userId}
              onVerified={() => {
                alert('Numéro de téléphone vérifié avec succès!');
              }}
            />
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-600 text-sm">
            <p className="mb-2 font-medium">
              OSINT Québec - Moteur de Synthèse Indépendant
            </p>
            <p className="text-slate-400">
              Souveraineté numérique • Sécurité maximale • Sources vérifiées
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
