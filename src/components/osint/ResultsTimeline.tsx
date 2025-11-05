import { ExternalLink, Shield, Calendar, Clock } from 'lucide-react';

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

interface ResultsTimelineProps {
  results: SearchResult[];
  query: string;
}

export function ResultsTimeline({ results, query }: ResultsTimelineProps) {
  const sortedResults = [...results].sort((a, b) => {
    const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
    const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
    return dateB - dateA;
  });

  const groupByDate = (resultsToGroup: SearchResult[]) => {
    const groups: Record<string, SearchResult[]> = {};

    resultsToGroup.forEach(result => {
      if (!result.published_at) {
        if (!groups['unknown']) groups['unknown'] = [];
        groups['unknown'].push(result);
        return;
      }

      const date = new Date(result.published_at);
      const key = date.toISOString().split('T')[0];
      if (!groups[key]) groups[key] = [];
      groups[key].push(result);
    });

    return groups;
  };

  const groupedResults = groupByDate(sortedResults);

  const formatDateGroup = (dateString: string) => {
    if (dateString === 'unknown') return 'Date inconnue';

    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateStr = date.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStr === todayStr) return "Aujourd'hui";
    if (dateStr === yesterdayStr) return 'Hier';

    return new Intl.DateTimeFormat('fr-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-CA', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      government: 'blue',
      academic: 'purple',
      news: 'green',
      international: 'orange',
      technical: 'cyan',
    };
    return colors[category] || 'slate';
  };

  const getReliabilityColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div className="space-y-8">
      {Object.entries(groupedResults).map(([dateKey, dateResults]) => (
        <div key={dateKey} className="relative">
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-50 to-slate-50 backdrop-blur-sm rounded-lg px-4 py-3 mb-4 border border-blue-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Calendar className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{formatDateGroup(dateKey)}</h3>
                <p className="text-sm text-slate-600">{dateResults.length} résultat(s)</p>
              </div>
            </div>
          </div>

          <div className="relative pl-8 space-y-6">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-blue-200"></div>

            {dateResults.map((result, index) => {
              const categoryColor = getCategoryColor(result.source.category);
              const reliabilityColor = getReliabilityColor(result.source.reliability_score);

              return (
                <div key={result.id} className="relative">
                  <div className="absolute -left-5 top-6 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg"></div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 overflow-hidden ml-4">
                    <div className="p-5">
                      {result.published_at && (
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                          <Clock size={14} />
                          <span className="font-medium">{formatTime(result.published_at)}</span>
                        </div>
                      )}

                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-start gap-2 hover:gap-3 transition-all mb-2"
                      >
                        <h4 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">
                          {result.title}
                        </h4>
                        <ExternalLink
                          size={14}
                          className="flex-shrink-0 mt-1 text-slate-400 group-hover:text-blue-600"
                        />
                      </a>

                      <div className="flex items-center gap-2 mb-3 text-sm">
                        <span className="font-medium text-blue-600">{result.source.name}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">{result.source.domain}</span>
                      </div>

                      <p className="text-slate-600 leading-relaxed mb-4 line-clamp-2 text-sm">
                        {result.content}
                      </p>

                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 bg-${categoryColor}-100 text-${categoryColor}-700 text-xs font-semibold rounded`}
                          >
                            {result.source.category}
                          </span>

                          <div className="flex items-center gap-1">
                            <Shield size={12} className={reliabilityColor} />
                            <span className={`text-xs font-bold ${reliabilityColor}`}>
                              {result.source.reliability_score}%
                            </span>
                          </div>
                        </div>

                        <div className="px-2 py-1 bg-blue-50 rounded">
                          <span className="text-xs font-bold text-blue-600">
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
        </div>
      ))}
    </div>
  );
}
