import { ExternalLink, Shield, Calendar, BookmarkPlus, Bookmark } from 'lucide-react';
import { useState, useEffect } from 'react';

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

interface ResultsListProps {
  results: SearchResult[];
  query: string;
}

export function ResultsList({ results, query }: ResultsListProps) {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const bookmarks = localStorage.getItem('osint_bookmarks');
    if (bookmarks) {
      setBookmarkedIds(new Set(JSON.parse(bookmarks)));
    }
  }, []);

  const toggleBookmark = (resultId: string) => {
    const newBookmarks = new Set(bookmarkedIds);
    if (newBookmarks.has(resultId)) {
      newBookmarks.delete(resultId);
    } else {
      newBookmarks.add(resultId);
    }
    setBookmarkedIds(newBookmarks);
    localStorage.setItem('osint_bookmarks', JSON.stringify(Array.from(newBookmarks)));
  };

  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery) return text;

    const terms = searchQuery
      .toLowerCase()
      .split(' ')
      .filter(term => !['and', 'or', 'not', '+', '-', '"'].includes(term));

    let highlightedText = text;
    terms.forEach(term => {
      const cleanTerm = term.replace(/[+\-"]/g, '');
      if (cleanTerm.length > 2) {
        const regex = new RegExp(`(${cleanTerm})`, 'gi');
        highlightedText = highlightedText.replace(
          regex,
          '<mark class="bg-yellow-200 text-yellow-900 px-1 rounded">$1</mark>'
        );
      }
    });

    return highlightedText;
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const getReliabilityColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 75) return 'text-blue-600 bg-blue-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  return (
    <div className="space-y-4">
      {results.map((result) => {
        const categoryColor = getCategoryColor(result.source.category);
        const reliabilityColor = getReliabilityColor(result.source.reliability_score);
        const isBookmarked = bookmarkedIds.has(result.id);

        return (
          <div
            key={result.id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-start gap-2 hover:gap-3 transition-all"
                  >
                    <h3
                      className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight"
                      dangerouslySetInnerHTML={{ __html: highlightText(result.title, query) }}
                    />
                    <ExternalLink
                      size={16}
                      className="flex-shrink-0 mt-1 text-slate-400 group-hover:text-blue-600"
                    />
                  </a>
                  <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                    <span className="font-medium text-blue-600">{result.source.name}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">{result.source.domain}</span>
                  </div>
                </div>

                <button
                  onClick={() => toggleBookmark(result.id)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                  title={isBookmarked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                  {isBookmarked ? (
                    <Bookmark size={20} className="text-yellow-500 fill-yellow-500" />
                  ) : (
                    <BookmarkPlus size={20} className="text-slate-400" />
                  )}
                </button>
              </div>

              <p
                className="text-slate-600 leading-relaxed mb-4 line-clamp-3"
                dangerouslySetInnerHTML={{ __html: highlightText(result.content, query) }}
              />

              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 bg-${categoryColor}-100 text-${categoryColor}-700 text-xs font-semibold rounded-full`}
                  >
                    {result.source.category}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Shield size={14} className={reliabilityColor.split(' ')[0]} />
                    <span className={`text-xs font-bold ${reliabilityColor}`}>
                      Fiabilité: {result.source.reliability_score}%
                    </span>
                  </div>

                  {result.published_at && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar size={14} />
                      <span className="text-xs">{formatDate(result.published_at)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-blue-50 rounded-full">
                    <span className="text-xs font-bold text-blue-600">
                      Pertinence: {result.relevance_score}%
                    </span>
                  </div>
                </div>
              </div>

              {result.author && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    Par <span className="font-medium text-slate-700">{result.author}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
