import { ExternalLink, Shield, Calendar, TrendingUp } from 'lucide-react';

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

interface ResultsGridProps {
  results: SearchResult[];
  query: string;
}

export function ResultsGrid({ results, query }: ResultsGridProps) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      government: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      academic: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
      news: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
      international: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
      technical: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    };
    return colors[category] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
  };

  const getReliabilityColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map((result) => {
        const categoryColors = getCategoryColor(result.source.category);
        const reliabilityColor = getReliabilityColor(result.source.reliability_score);

        return (
          <div
            key={result.id}
            className={`group bg-white rounded-xl shadow-sm border-2 ${categoryColors.border} hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col h-full`}
          >
            <div className={`${categoryColors.bg} px-4 py-3 border-b ${categoryColors.border}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold uppercase tracking-wide ${categoryColors.text}`}>
                  {result.source.category}
                </span>
                <div className={`px-2 py-1 rounded border ${reliabilityColor}`}>
                  <div className="flex items-center gap-1">
                    <Shield size={12} />
                    <span className="text-xs font-bold">{result.source.reliability_score}%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`font-semibold ${categoryColors.text}`}>{result.source.name}</span>
              </div>
            </div>

            <div className="p-5 flex flex-col flex-1">
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link mb-3 block"
              >
                <h3 className="text-lg font-bold text-slate-800 group-hover/link:text-blue-600 transition-colors leading-tight mb-2 line-clamp-2">
                  {result.title}
                </h3>
                <div className="flex items-center gap-1.5 text-blue-600 opacity-0 group-hover/link:opacity-100 transition-opacity">
                  <span className="text-xs font-medium">Ouvrir l'article</span>
                  <ExternalLink size={12} />
                </div>
              </a>

              <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-4 flex-1">
                {result.content}
              </p>

              <div className="space-y-3 mt-auto">
                {result.published_at && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar size={14} />
                    <span>{formatDate(result.published_at)}</span>
                  </div>
                )}

                {result.author && (
                  <div className="text-xs text-slate-500 border-t border-slate-100 pt-3">
                    Par <span className="font-medium text-slate-700">{result.author}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500">Pertinence</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full w-16">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${result.relevance_score}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-blue-600 min-w-[35px] text-right">
                      {result.relevance_score}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
