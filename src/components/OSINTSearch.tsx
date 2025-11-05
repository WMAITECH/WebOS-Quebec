import { useState } from 'react';
import { Search, Filter, Clock, Grid, List, BookmarkPlus, TrendingUp, Calendar, Shield } from 'lucide-react';
import { AdvancedSearchBar } from './osint/AdvancedSearchBar';
import { AdvancedFilterPanel } from './osint/AdvancedFilterPanel';
import { ResultsList } from './osint/ResultsList';
import { ResultsTimeline } from './osint/ResultsTimeline';
import { ResultsGrid } from './osint/ResultsGrid';

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

interface SearchFilters {
  categories?: string[];
  sources?: string[];
  dateFrom?: string;
  dateTo?: string;
  minReliability?: number;
  minRelevance?: number;
}

type ViewMode = 'list' | 'timeline' | 'grid';

export function OSINTSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setQuery(searchQuery);
    setHasSearched(true);
    setResults([]);

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
          limit: 50,
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex-none bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">OSINT Search Engine</h2>
              <p className="text-sm text-blue-100">Recherche Multi-Sources Avancée</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                showFilters
                  ? 'bg-white text-blue-600'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <Filter size={18} />
              Filtres {Object.keys(filters).length > 0 && `(${Object.keys(filters).length})`}
            </button>
          </div>
        </div>

        <AdvancedSearchBar onSearch={handleSearch} isLoading={isLoading} />
      </div>

      {showFilters && (
        <div className="flex-none border-b border-slate-200 bg-white">
          <AdvancedFilterPanel filters={filters} onFiltersChange={setFilters} />
        </div>
      )}

      {hasSearched && (
        <div className="flex-none bg-white border-b border-slate-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                {isLoading ? 'Recherche en cours...' : `${results.length} résultats`}
              </span>
              {results.length > 0 && (
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-green-600" />
                  <span className="text-sm font-medium text-slate-700">
                    Score moyen: {(results.reduce((sum, r) => sum + r.relevance_score, 0) / results.length).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'list'
                    ? 'bg-white shadow text-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vue liste"
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-white shadow text-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vue chronologique"
              >
                <Clock size={18} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white shadow text-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vue grille"
              >
                <Grid size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {!hasSearched && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="p-6 bg-blue-100 rounded-full mb-6">
              <Search size={48} className="text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">
              Recherche OSINT Avancée
            </h3>
            <p className="text-slate-600 max-w-md mb-6">
              Utilisez des opérateurs avancés pour affiner vos recherches:
            </p>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-xl text-left">
              <div className="space-y-3 text-sm">
                <div>
                  <code className="bg-slate-100 px-2 py-1 rounded text-blue-600 font-mono">"phrase exacte"</code>
                  <span className="text-slate-600 ml-2">Recherche de phrase exacte</span>
                </div>
                <div>
                  <code className="bg-slate-100 px-2 py-1 rounded text-blue-600 font-mono">+terme</code>
                  <span className="text-slate-600 ml-2">Doit contenir ce terme</span>
                </div>
                <div>
                  <code className="bg-slate-100 px-2 py-1 rounded text-blue-600 font-mono">-terme</code>
                  <span className="text-slate-600 ml-2">Ne doit pas contenir ce terme</span>
                </div>
                <div>
                  <code className="bg-slate-100 px-2 py-1 rounded text-blue-600 font-mono">terme1 OR terme2</code>
                  <span className="text-slate-600 ml-2">L'un ou l'autre des termes</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
            </div>
            <p className="text-slate-600 font-medium mt-6">Analyse des sources de confiance...</p>
            <p className="text-slate-400 text-sm mt-2">Cela peut prendre quelques secondes</p>
          </div>
        )}

        {!isLoading && hasSearched && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="p-6 bg-slate-100 rounded-full mb-6">
              <Search size={48} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Aucun résultat trouvé</h3>
            <p className="text-slate-600 max-w-md">
              Essayez de modifier votre recherche ou d'ajuster les filtres
            </p>
          </div>
        )}

        {!isLoading && hasSearched && results.length > 0 && (
          <div className="px-6 py-6">
            {viewMode === 'list' && <ResultsList results={results} query={query} />}
            {viewMode === 'timeline' && <ResultsTimeline results={results} query={query} />}
            {viewMode === 'grid' && <ResultsGrid results={results} query={query} />}
          </div>
        )}
      </div>
    </div>
  );
}
