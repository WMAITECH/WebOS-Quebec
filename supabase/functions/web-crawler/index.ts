import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CrawlRequest {
  url: string;
  sourceId: string;
}

interface CrawlResult {
  success: boolean;
  url: string;
  title?: string;
  content?: string;
  contentHash?: string;
  wordCount?: number;
  language?: string;
  error?: string;
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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { url, sourceId }: CrawlRequest = await req.json();

    if (!url || !sourceId) {
      return new Response(
        JSON.stringify({ error: "Missing url or sourceId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = await crawlPage(url, sourceId);

    if (result.success && result.content) {
      const { error } = await supabase.from("indexed_pages").insert({
        url: result.url,
        source_id: sourceId,
        title: result.title || "Untitled",
        content: result.content,
        content_hash: result.contentHash || "",
        word_count: result.wordCount || 0,
        language: result.language || "en",
        status: "active",
      });

      if (error && error.code !== "23505") {
        throw error;
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Crawler error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function crawlPage(url: string, sourceId: string): Promise<CrawlResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "OSINT-Search-Bot/1.0 (Respectful Crawler)",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        url,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const html = await response.text();
    const parsed = parseHTML(html);

    const contentHash = await hashContent(parsed.content);

    return {
      success: true,
      url,
      title: parsed.title,
      content: parsed.content,
      contentHash,
      wordCount: parsed.wordCount,
      language: parsed.language,
    };
  } catch (error) {
    return {
      success: false,
      url,
      error: error.message || "Unknown error",
    };
  }
}

function parseHTML(html: string) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "Untitled";

  let content = html
    .replace(/<script[^>]*>.*?<\/script>/gis, "")
    .replace(/<style[^>]*>.*?<\/style>/gis, "")
    .replace(/<nav[^>]*>.*?<\/nav>/gis, "")
    .replace(/<header[^>]*>.*?<\/header>/gis, "")
    .replace(/<footer[^>]*>.*?<\/footer>/gis, "")
    .replace(/<aside[^>]*>.*?<\/aside>/gis, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  content = content.substring(0, 50000);

  const words = content.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;

  const langMatch = html.match(/<html[^>]*\slang=["']([a-z]{2})["']/i);
  const language = langMatch ? langMatch[1] : "en";

  return { title, content, wordCount, language };
}

async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
