import { useState, useEffect } from 'react';
import { Shield, Plus, CheckCircle, XCircle, Globe, Loader2 } from 'lucide-react';
import { sourcesService } from '../services/sourcesService';
import type { Database } from '../lib/database.types';

type TrustedSource = Database['public']['Tables']['trusted_sources']['Row'];

export function SourcesManager() {
  const [sources, setSources] = useState<TrustedSource[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadSources();
    loadStats();
  }, []);

  const loadSources = async () => {
    try {
      setIsLoading(true);
      const data = await sourcesService.getAllSources();
      setSources(data);
    } catch (error) {
      console.error('Failed to load sources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await sourcesService.getSourceStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      await sourcesService.toggleSourceActive(id, !currentState);
      await loadSources();
      await loadStats();
    } catch (error) {
      console.error('Failed to toggle source:', error);
    }
  };

  const filteredSources = selectedCategory === 'all'
    ? sources
    : sources.filter(s => s.category === selectedCategory);

  const categories = [
    { value: 'all', label: 'All Sources', count: sources.length },
    { value: 'government', label: 'Government', count: sources.filter(s => s.category === 'government').length },
    { value: 'academic', label: 'Academic', count: sources.filter(s => s.category === 'academic').length },
    { value: 'media', label: 'Media', count: sources.filter(s => s.category === 'media').length },
    { value: 'international_org', label: 'International', count: sources.filter(s => s.category === 'international_org').length },
  ];

  const reliabilityColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 75) return 'text-blue-600 bg-blue-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="text-blue-600" size={32} />
              Trusted Sources
            </h1>
            <p className="text-gray-600 mt-2">Manage and monitor OSINT source reliability</p>
          </div>
          {stats && (
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Active Sources</div>
            </div>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSources.map((source) => (
            <div
              key={source.id}
              className={`p-5 rounded-xl border-2 transition-all ${
                source.is_active
                  ? 'bg-white border-gray-200 hover:shadow-lg'
                  : 'bg-gray-50 border-gray-300 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Globe size={20} className="text-gray-400" />
                  <h3 className="font-semibold text-gray-900 line-clamp-1">
                    {source.name}
                  </h3>
                </div>
                <button
                  onClick={() => toggleActive(source.id, source.is_active)}
                  className="flex-shrink-0"
                  title={source.is_active ? 'Deactivate' : 'Activate'}
                >
                  {source.is_active ? (
                    <CheckCircle size={20} className="text-green-600" />
                  ) : (
                    <XCircle size={20} className="text-gray-400" />
                  )}
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Domain:</span>
                  <span className="font-mono text-gray-900">{source.domain}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {source.category.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Reliability:</span>
                  <span className={`px-3 py-1 rounded-full font-bold ${reliabilityColor(source.reliability_score)}`}>
                    {source.reliability_score}/100
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Language:</span>
                  <span className="font-medium text-gray-900 uppercase">
                    {source.language}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Crawl Frequency:</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {source.crawl_frequency}
                  </span>
                </div>

                {source.last_crawled_at && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-gray-500 text-xs">
                      Last crawled: {new Date(source.last_crawled_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
