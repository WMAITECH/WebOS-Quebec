import { useState } from 'react';
import { Calendar, Shield, TrendingUp, Tag, ChevronDown, ChevronUp, X } from 'lucide-react';

interface SearchFilters {
  categories?: string[];
  sources?: string[];
  dateFrom?: string;
  dateTo?: string;
  minReliability?: number;
  minRelevance?: number;
}

interface AdvancedFilterPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

export function AdvancedFilterPanel({ filters, onFiltersChange }: AdvancedFilterPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['categories']));

  const categories = [
    { id: 'government', label: 'Gouvernemental', color: 'blue' },
    { id: 'academic', label: 'Académique', color: 'purple' },
    { id: 'news', label: 'Actualités', color: 'green' },
    { id: 'international', label: 'International', color: 'orange' },
    { id: 'technical', label: 'Technique', color: 'cyan' },
  ];

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const toggleCategory = (categoryId: string) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(c => c !== categoryId)
      : [...currentCategories, categoryId];

    onFiltersChange({ ...filters, categories: newCategories.length > 0 ? newCategories : undefined });
  };

  const updateDateRange = (dateFrom?: string, dateTo?: string) => {
    onFiltersChange({
      ...filters,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  };

  const updateReliability = (value: number) => {
    onFiltersChange({
      ...filters,
      minReliability: value > 0 ? value : undefined,
    });
  };

  const updateRelevance = (value: number) => {
    onFiltersChange({
      ...filters,
      minRelevance: value > 0 ? value : undefined,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof SearchFilters];
    return value !== undefined && (Array.isArray(value) ? value.length > 0 : true);
  }).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800">Filtres avancés</h3>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <X size={16} />
            Effacer tout ({activeFilterCount})
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('categories')}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <Tag size={18} />
              <span>Catégories</span>
              {filters.categories && filters.categories.length > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">
                  {filters.categories.length}
                </span>
              )}
            </div>
            {expandedSections.has('categories') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {expandedSections.has('categories') && (
            <div className="p-4 space-y-2">
              {categories.map(category => (
                <label
                  key={category.id}
                  className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={filters.categories?.includes(category.id) || false}
                    onChange={() => toggleCategory(category.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className={`w-3 h-3 rounded-full bg-${category.color}-500`}></div>
                  <span className="text-slate-700 group-hover:text-slate-900 font-medium">
                    {category.label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('dates')}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <Calendar size={18} />
              <span>Période</span>
              {(filters.dateFrom || filters.dateTo) && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">
                  ✓
                </span>
              )}
            </div>
            {expandedSections.has('dates') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {expandedSections.has('dates') && (
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Date de début
                </label>
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => updateDateRange(e.target.value, filters.dateTo)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => updateDateRange(filters.dateFrom, e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const last7Days = new Date();
                    last7Days.setDate(last7Days.getDate() - 7);
                    updateDateRange(last7Days.toISOString().split('T')[0], new Date().toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium transition-colors"
                >
                  7 derniers jours
                </button>
                <button
                  onClick={() => {
                    const last30Days = new Date();
                    last30Days.setDate(last30Days.getDate() - 30);
                    updateDateRange(last30Days.toISOString().split('T')[0], new Date().toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium transition-colors"
                >
                  30 derniers jours
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('reliability')}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <Shield size={18} />
              <span>Fiabilité minimale</span>
              {filters.minReliability && filters.minReliability > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">
                  {filters.minReliability}%
                </span>
              )}
            </div>
            {expandedSections.has('reliability') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {expandedSections.has('reliability') && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Score minimum</span>
                <span className="font-bold text-slate-800">{filters.minReliability || 0}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={filters.minReliability || 0}
                onChange={(e) => updateReliability(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>Toutes</span>
                <span>Haute fiabilité</span>
              </div>
            </div>
          )}
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('relevance')}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <TrendingUp size={18} />
              <span>Pertinence minimale</span>
              {filters.minRelevance && filters.minRelevance > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">
                  {filters.minRelevance}%
                </span>
              )}
            </div>
            {expandedSections.has('relevance') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {expandedSections.has('relevance') && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Score minimum</span>
                <span className="font-bold text-slate-800">{filters.minRelevance || 0}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={filters.minRelevance || 0}
                onChange={(e) => updateRelevance(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>Toutes</span>
                <span>Très pertinent</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
