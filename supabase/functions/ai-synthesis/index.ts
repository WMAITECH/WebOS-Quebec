import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SynthesisRequest {
  queryId: string;
  query: string;
  results: Array<{
    id: string;
    title: string;
    content: string;
    url: string;
    source: { name: string; reliability_score: number };
  }>;
  aiProvider?: "anthropic" | "openai";
  model?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { queryId, query, results, aiProvider = "anthropic", model }: SynthesisRequest = await req.json();

    if (!query || !results || results.length === 0) {
      return new Response(
        JSON.stringify({ error: "Query and results are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const startTime = Date.now();

        try {
          const synthesis = await generateSynthesis(query, results, aiProvider, model);
          
          const words = synthesis.text.split(' ');
          
          for (let i = 0; i < words.length; i++) {
            const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`));
            await new Promise(resolve => setTimeout(resolve, 30));
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'citations', 
            citations: synthesis.citations 
          })}\n\n`));

          const generationTime = Date.now() - startTime;

          if (queryId) {
            const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
            const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            const supabase = createClient(supabaseUrl, supabaseKey);

            await supabase.from("ai_syntheses").insert({
              query_id: queryId,
              synthesis_text: synthesis.text,
              source_page_ids: results.map(r => r.id),
              model: model || (aiProvider === "anthropic" ? "claude-3-5-sonnet" : "gpt-4"),
              tokens_used: synthesis.tokensUsed,
              generation_time_ms: generationTime,
            });

            await supabase
              .from("search_queries")
              .update({ synthesis_requested: true })
              .eq("id", queryId);
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        } catch (error) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'error', 
            error: error.message 
          })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Synthesis error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function generateSynthesis(
  query: string,
  results: any[],
  provider: string,
  model?: string
) {
  const sourcesContext = results
    .slice(0, 5)
    .map((r, idx) => 
      `[${idx + 1}] ${r.source.name} (Reliability: ${r.source.reliability_score}/100)\n` +
      `Title: ${r.title}\n` +
      `URL: ${r.url}\n` +
      `Content: ${r.content.substring(0, 1000)}...\n`
    )
    .join("\n---\n\n");

  const prompt = `You are an OSINT research assistant. Synthesize information from the following trusted sources to answer the query.

Query: "${query}"

Sources:
${sourcesContext}

Provide a comprehensive, factual synthesis that:
1. Directly answers the query
2. Cites sources using [number] notation
3. Highlights consensus or conflicts between sources
4. Notes the reliability of sources when relevant
5. Stays objective and factual
6. Is concise but thorough (200-400 words)

Synthesis:`;

  if (provider === "anthropic") {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.content[0].text;

    return {
      text,
      tokensUsed: data.usage.input_tokens + data.usage.output_tokens,
      citations: extractCitations(text, results),
    };
  } else {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured. Please provide an AI API key.");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

    return {
      text,
      tokensUsed: data.usage.total_tokens,
      citations: extractCitations(text, results),
    };
  }
}

function extractCitations(text: string, results: any[]) {
  const citations: any[] = [];
  const citationRegex = /\[(\d+)\]/g;
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    const index = parseInt(match[1]) - 1;
    if (index >= 0 && index < results.length) {
      const result = results[index];
      if (!citations.find(c => c.id === result.id)) {
        citations.push({
          id: result.id,
          number: match[1],
          title: result.title,
          url: result.url,
          source: result.source.name,
          reliability: result.source.reliability_score,
        });
      }
    }
  }

  return citations;
}
