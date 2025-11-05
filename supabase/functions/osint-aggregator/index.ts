import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SearchRequest {
  query: string;
  sources?: {
    wikipedia?: boolean;
    wikidata?: boolean;
    duckduckgo?: boolean;
    hackernews?: boolean;
    reddit?: boolean;
    arxiv?: boolean;
    newsapi?: boolean;
  };
  lang?: string;
  limit?: number;
  newsMode?: boolean;
}

interface SearchResult {
  source: string;
  title: string;
  snippet: string;
  url: string;
  score?: number;
  timestamp?: string;
  metadata?: Record<string, any>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { query, sources = {}, lang = 'fr', limit = 50, newsMode = false }: SearchRequest = await req.json();

    if (!query?.trim()) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const tasks: Promise<SearchResult[]>[] = [];

    if (newsMode) {
      tasks.push(searchHackerNews(query, controller.signal));
      tasks.push(searchReddit(query, controller.signal));
      tasks.push(searchGoogleNews(query, lang, controller.signal));
      tasks.push(searchBingNews(query, lang, controller.signal));
    } else {
      if (sources.wikipedia !== false) {
        tasks.push(searchWikipedia(query, lang, controller.signal));
      }

      if (sources.duckduckgo !== false) {
        tasks.push(searchDuckDuckGo(query, controller.signal));
      }

      if (sources.hackernews !== false) {
        tasks.push(searchHackerNews(query, controller.signal));
      }

      if (sources.wikidata !== false) {
        tasks.push(searchWikidata(query, lang, controller.signal));
      }

      if (sources.arxiv) {
        tasks.push(searchArxiv(query, controller.signal));
      }

      if (sources.reddit) {
        tasks.push(searchReddit(query, controller.signal));
      }
    }

    const results = await Promise.allSettled(tasks);
    clearTimeout(timeout);

    const allResults: SearchResult[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        allResults.push(...result.value);
      }
    }

    const deduplicated = deduplicateResults(allResults);

    let sorted: SearchResult[];
    if (newsMode) {
      sorted = deduplicated.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      });
    } else {
      sorted = deduplicated.sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    const limited = sorted.slice(0, limit);

    const schema = buildSchema(limited);
    const signals = detectSignals(limited);

    return new Response(
      JSON.stringify({
        query,
        total: limited.length,
        results: limited,
        schema,
        signals,
        search_timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("OSINT aggregator error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function searchWikipedia(query: string, lang: string, signal: AbortSignal): Promise<SearchResult[]> {
  try {
    const wikiLang = lang === 'fr' ? 'fr' : 'en';
    const url = `https://${wikiLang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=8&format=json&origin=*`;
    const response = await fetch(url, { signal });
    const data = await response.json();

    const results: SearchResult[] = [];
    if (Array.isArray(data[1])) {
      for (let i = 0; i < data[1].length; i++) {
        results.push({
          source: "Wikipedia",
          title: data[1][i],
          snippet: data[2][i] || "",
          url: data[3][i],
          score: 95 - i * 2,
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}

async function searchDuckDuckGo(query: string, signal: AbortSignal): Promise<SearchResult[]> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&no_redirect=1`;
    const response = await fetch(url, { signal });
    const data = await response.json();

    const results: SearchResult[] = [];

    if (data.AbstractURL && data.AbstractText) {
      results.push({
        source: "DuckDuckGo",
        title: data.Heading || query,
        snippet: data.AbstractText,
        url: data.AbstractURL,
        score: 90,
      });
    }

    if (Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            source: "DuckDuckGo",
            title: topic.Text,
            snippet: topic.Text,
            url: topic.FirstURL,
            score: 85,
          });
        }
        if (Array.isArray(topic.Topics)) {
          for (const sub of topic.Topics) {
            if (sub.Text && sub.FirstURL) {
              results.push({
                source: "DuckDuckGo",
                title: sub.Text,
                snippet: sub.Text,
                url: sub.FirstURL,
                score: 80,
              });
            }
          }
        }
      }
    }

    return results.slice(0, 12);
  } catch {
    return [];
  }
}

async function searchHackerNews(query: string, signal: AbortSignal): Promise<SearchResult[]> {
  try {
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&hitsPerPage=10`;
    const response = await fetch(url, { signal });
    const data = await response.json();

    const results: SearchResult[] = [];
    if (Array.isArray(data.hits)) {
      for (const hit of data.hits) {
        results.push({
          source: "Hacker News",
          title: hit.title || hit.story_title || "(no title)",
          snippet: hit.url || hit.story_url || "",
          url: hit.url || hit.story_url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
          score: 85,
          timestamp: hit.created_at || new Date().toISOString(),
          metadata: {
            points: hit.points || 0,
            comments: hit.num_comments || 0,
          },
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}

async function searchWikidata(query: string, lang: string, signal: AbortSignal): Promise<SearchResult[]> {
  try {
    const safe = query.replace(/"/g, '\\"');
    const wdLang = lang === 'fr' ? 'fr' : 'en';
    const sparql = `SELECT ?item ?itemLabel WHERE { ?item ?label "${safe}"@${wdLang} . SERVICE wikibase:label { bd:serviceParam wikibase:language "${wdLang},en". } } LIMIT 8`;
    const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`;
    const response = await fetch(url, {
      signal,
      headers: { Accept: "application/sparql-results+json" },
    });
    const data = await response.json();

    const results: SearchResult[] = [];
    const bindings = data.results?.bindings || [];
    for (const row of bindings) {
      const id = row.item?.value;
      const label = row.itemLabel?.value;
      if (id && label) {
        results.push({
          source: "Wikidata",
          title: label,
          snippet: label,
          url: id,
          score: 88,
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}

async function searchArxiv(query: string, signal: AbortSignal): Promise<SearchResult[]> {
  try {
    const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=10&sortBy=submittedDate&sortOrder=descending`;
    const response = await fetch(url, { signal });
    const text = await response.text();

    const results: SearchResult[] = [];
    const entries = [...text.matchAll(/<entry>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<id>([\s\S]*?)<\/id>[\s\S]*?<published>([\s\S]*?)<\/published>[\s\S]*?<summary>([\s\S]*?)<\/summary>/g)];

    for (const match of entries) {
      results.push({
        source: "arXiv",
        title: match[1].trim(),
        snippet: match[4].trim().replace(/\s+/g, " ").substring(0, 300),
        url: match[2].trim(),
        score: 92,
        timestamp: match[3].trim(),
      });
    }
    return results;
  } catch {
    return [];
  }
}

async function searchReddit(query: string, signal: AbortSignal): Promise<SearchResult[]> {
  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=10&sort=new&t=day`;
    const response = await fetch(url, { signal });
    const data = await response.json();

    const results: SearchResult[] = [];
    const hits = data.data?.children || [];
    for (const hit of hits) {
      const post = hit.data;
      if (post?.title && post?.permalink) {
        results.push({
          source: "Reddit",
          title: post.title,
          snippet: post.subreddit_name_prefixed || "",
          url: `https://www.reddit.com${post.permalink}`,
          score: 75,
          timestamp: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : new Date().toISOString(),
          metadata: {
            upvotes: post.ups || 0,
            comments: post.num_comments || 0,
          },
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}

async function searchGoogleNews(query: string, lang: string, signal: AbortSignal): Promise<SearchResult[]> {
  try {
    const newsLang = lang === 'fr' ? 'fr-FR' : 'en-US';
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${newsLang}&gl=${lang.toUpperCase()}&ceid=${newsLang}`;
    const response = await fetch(url, { signal });
    const text = await response.text();

    const results: SearchResult[] = [];
    const items = [...text.matchAll(/<item>[\s\S]*?<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<pubDate>([\s\S]*?)<\/pubDate>[\s\S]*?<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/g)];

    for (const match of items) {
      results.push({
        source: "Google News",
        title: match[1].trim(),
        snippet: match[4].trim().replace(/<[^>]*>/g, '').substring(0, 200),
        url: match[2].trim(),
        score: 95,
        timestamp: new Date(match[3].trim()).toISOString(),
      });
    }

    return results.slice(0, 15);
  } catch {
    return [];
  }
}

async function searchBingNews(query: string, lang: string, signal: AbortSignal): Promise<SearchResult[]> {
  try {
    const newsLang = lang === 'fr' ? 'fr-FR' : 'en-US';
    const url = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=RSS&setlang=${newsLang}`;
    const response = await fetch(url, { signal });
    const text = await response.text();

    const results: SearchResult[] = [];
    const items = [...text.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<pubDate>([\s\S]*?)<\/pubDate>[\s\S]*?<description>([\s\S]*?)<\/description>/g)];

    for (const match of items) {
      results.push({
        source: "Bing News",
        title: match[1].trim().replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1'),
        snippet: match[4].trim().replace(/<[^>]*>/g, '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').substring(0, 200),
        url: match[2].trim(),
        score: 93,
        timestamp: new Date(match[3].trim()).toISOString(),
      });
    }

    return results.slice(0, 15);
  } catch {
    return [];
  }
}

function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  const deduped: SearchResult[] = [];

  for (const result of results) {
    const key = `${result.title}|${result.url}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(result);
    }
  }

  return deduped;
}

function buildSchema(results: SearchResult[]): Record<string, any> {
  const sources = new Set(results.map((r) => r.source));
  const entities = extractEntities(results);

  return {
    sources: Array.from(sources),
    total_results: results.length,
    entities: entities.slice(0, 10),
  };
}

function extractEntities(results: SearchResult[]): Array<{ entity: string; count: number }> {
  const entityCounts = new Map<string, number>();

  for (const result of results) {
    const text = `${result.title} ${result.snippet}`;
    const matches = text.match(/\b[A-Z][a-zA-Z0-9\-\s]{2,30}\b/g) || [];

    for (const match of matches) {
      const entity = match.trim();
      if (entity.length >= 3 && entity.length <= 30) {
        entityCounts.set(entity, (entityCounts.get(entity) || 0) + 1);
      }
    }
  }

  return Array.from(entityCounts.entries())
    .map(([entity, count]) => ({ entity, count }))
    .sort((a, b) => b.count - a.count);
}

function detectSignals(results: SearchResult[]): Array<{ signal: string; strength: number }> {
  const titleWords = new Map<string, number>();

  for (const result of results) {
    const words = result.title.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (word.length > 4) {
        titleWords.set(word, (titleWords.get(word) || 0) + 1);
      }
    }
  }

  return Array.from(titleWords.entries())
    .filter(([_, count]) => count >= 2)
    .map(([signal, count]) => ({ signal, strength: count }))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 15);
}