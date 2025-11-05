import { useState, useRef, useEffect } from 'react';
import { Search, X, History, Sparkles } from 'lucide-react';

interface AdvancedSearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export function AdvancedSearchBar({ onSearch, isLoading }: AdvancedSearchBarProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const history = localStorage.getItem('osint_search_history');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  const saveToHistory = (searchQuery: string) => {
    const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('osint_search_history', JSON.stringify(newHistory));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveToHistory(query.trim());
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    onSearch(historyQuery);
    setShowSuggestions(false);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('osint_search_history');
  };

  const suggestions = [
    'cybersécurité québec',
    'intelligence artificielle canada',
    'souveraineté numérique',
    'données personnelles loi',
    'protection infrastructure critique',
  ];

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder='Recherche avancée... Ex: "cyber attack" +canada -usa'
            className="w-full pl-12 pr-24 py-3 bg-white/95 backdrop-blur-sm text-slate-800 placeholder-slate-400 rounded-xl border-2 border-white/50 focus:border-white focus:outline-none shadow-lg text-base"
            disabled={isLoading}
          />
          <Search className="absolute left-4 text-blue-600" size={20} />

          <div className="absolute right-2 flex items-center gap-2">
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                title="Effacer"
              >
                <X size={18} className="text-slate-400" />
              </button>
            )}
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
            >
              {isLoading ? 'Recherche...' : 'Rechercher'}
            </button>
          </div>
        </div>
      </form>

      {showSuggestions && !isLoading && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowSuggestions(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-20 max-h-96 overflow-y-auto">
            {searchHistory.length > 0 && (
              <div className="border-b border-slate-100">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-50">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <History size={16} />
                    <span>Historique récent</span>
                  </div>
                  <button
                    onClick={clearHistory}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Effacer tout
                  </button>
                </div>
                {searchHistory.map((historyQuery, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistoryClick(historyQuery)}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center gap-3 group"
                  >
                    <History size={16} className="text-slate-400 group-hover:text-blue-600" />
                    <span className="text-slate-700 group-hover:text-blue-700">{historyQuery}</span>
                  </button>
                ))}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-sm font-semibold text-slate-600">
                <Sparkles size={16} />
                <span>Suggestions populaires</span>
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setQuery(suggestion);
                    onSearch(suggestion);
                    setShowSuggestions(false);
                    saveToHistory(suggestion);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center gap-3 group"
                >
                  <Search size={16} className="text-slate-400 group-hover:text-blue-600" />
                  <span className="text-slate-700 group-hover:text-blue-700">{suggestion}</span>
                </button>
              ))}
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500 leading-relaxed">
                <strong className="text-slate-600">Astuce:</strong> Utilisez les guillemets pour les phrases exactes,
                + pour les termes obligatoires, - pour exclure, OR pour les alternatives.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
