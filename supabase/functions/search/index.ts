import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SearchRequest {
  query: string;
  filters?: {
    category?: string;
    source?: string;
    dateFrom?: string;
    dateTo?: string;
    language?: string;
  };
  limit?: number;
  offset?: number;
}

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { query, filters, limit = 20, offset = 0 }: SearchRequest = await req.json();

    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: queryRecord, error: queryError } = await supabase
      .from("search_queries")
      .insert({
        query_text: query,
        filters: filters || null,
        synthesis_requested: false,
      })
      .select()
      .single();

    if (queryError) {
      console.error("Query logging error:", queryError);
    }

    let searchQuery = supabase
      .from("indexed_pages")
      .select(`
        id,
        url,
        title,
        content,
        author,
        published_at,
        source:trusted_sources!inner(
          name,
          domain,
          category,
          reliability_score
        )
      `)
      .eq("status", "active")
      .textSearch("content", query, { type: "websearch" });

    if (filters?.category) {
      searchQuery = searchQuery.eq("source.category", filters.category);
    }

    if (filters?.dateFrom) {
      searchQuery = searchQuery.gte("published_at", filters.dateFrom);
    }

    if (filters?.dateTo) {
      searchQuery = searchQuery.lte("published_at", filters.dateTo);
    }

    if (filters?.language) {
      searchQuery = searchQuery.eq("language", filters.language);
    }

    const { data: results, error: searchError } = await searchQuery
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (searchError) {
      throw searchError;
    }

    const formattedResults: SearchResult[] = (results || []).map((result: any, index: number) => ({
      id: result.id,
      url: result.url,
      title: result.title,
      content: result.content.substring(0, 500) + "...",
      author: result.author,
      published_at: result.published_at,
      source: result.source,
      relevance_score: 100 - (index * 2),
    }));

    if (queryRecord) {
      await supabase
        .from("search_queries")
        .update({ result_count: formattedResults.length })
        .eq("id", queryRecord.id);
    }

    return new Response(
      JSON.stringify({
        query,
        total: formattedResults.length,
        results: formattedResults,
        queryId: queryRecord?.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Search error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
