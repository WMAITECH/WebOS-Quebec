import { ExternalLink, Calendar, User, Shield } from 'lucide-react';

interface Source {
  name: string;
  domain: string;
  category: string;
  reliability_score: number;
}

interface SearchResult {
  id: string;
  url: string;
  title: string;
  content: string;
  author: string | null;
  published_at: string | null;
  source: Source;
  relevance_score: number;
}

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
}

const categoryColors: Record<string, string> = {
  government: 'bg-blue-100 text-blue-800',
  academic: 'bg-purple-100 text-purple-800',
  media: 'bg-orange-100 text-orange-800',
  international_org: 'bg-green-100 text-green-800',
  ngo: 'bg-teal-100 text-teal-800',
  other: 'bg-gray-100 text-gray-800',
};

const reliabilityColor = (score: number) => {
  if (score >= 90) return 'text-green-600';
  if (score >= 75) return 'text-blue-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-orange-600';
};

export function SearchResults({ results, query }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">No results found for "{query}"</p>
        <p className="text-gray-400 text-sm mt-2">Try adjusting your search terms</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div className="text-sm text-gray-600">
        Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
      </div>

      {results.map((result) => (
        <article
          key={result.id}
          className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 group"
            >
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                {result.title}
              </h3>
            </a>
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
              title="Open in new tab"
            >
              <ExternalLink size={20} />
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
            <span className={`px-3 py-1 rounded-full font-medium ${categoryColors[result.source.category] || categoryColors.other}`}>
              {result.source.category.replace('_', ' ')}
            </span>

            <div className="flex items-center gap-1.5 text-gray-600">
              <Shield size={14} className={reliabilityColor(result.source.reliability_score)} />
              <span className={`font-medium ${reliabilityColor(result.source.reliability_score)}`}>
                {result.source.reliability_score}/100
              </span>
            </div>

            {result.published_at && (
              <div className="flex items-center gap-1.5 text-gray-500">
                <Calendar size={14} />
                <span>{new Date(result.published_at).toLocaleDateString()}</span>
              </div>
            )}

            {result.author && (
              <div className="flex items-center gap-1.5 text-gray-500">
                <User size={14} />
                <span>{result.author}</span>
              </div>
            )}
          </div>

          <p className="text-gray-700 leading-relaxed mb-3">
            {result.content}
          </p>

          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-500">
              <span className="font-medium text-gray-700">{result.source.name}</span>
              <span className="mx-2">•</span>
              <span className="text-gray-400">{result.source.domain}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
