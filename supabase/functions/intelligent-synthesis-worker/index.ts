import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { query, style, max_sources = 10 } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const startTime = performance.now();

    const knowledgeNodes = await fetchRelevantKnowledgeNodes(supabase, query);

    const sourcePages = await fetchRelevantSourcePages(supabase, query, max_sources);

    if (sourcePages.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No relevant sources found",
          suggestion: "Try a different query or wait for more data to be collected",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const templates = await fetchSynthesisTemplates(supabase);

    const selectedTemplate = selectBestTemplate(
      templates,
      query,
      sourcePages.length,
      knowledgeNodes.length,
      style
    );

    const synthesis = await generateMechanicalSynthesis(
      query,
      selectedTemplate,
      knowledgeNodes,
      sourcePages,
      style || selectedTemplate.style
    );

    const synthesisRecord = {
      query,
      synthesis_text: synthesis.text,
      template_id: selectedTemplate.id,
      style_used: synthesis.styleUsed,
      source_nodes: knowledgeNodes.map((n: any) => n.id),
      source_pages: sourcePages.map((p: any) => p.id),
      confidence_score: synthesis.confidenceScore,
      coherence_score: synthesis.coherenceScore,
      citation_count: synthesis.citationCount,
      generation_time_ms: Math.round(performance.now() - startTime),
      metadata: {
        templateName: selectedTemplate.template_name,
        nodeCount: knowledgeNodes.length,
        sourceCount: sourcePages.length,
      },
    };

    const { data: savedSynthesis, error: saveError } = await supabase
      .from("mechanical_syntheses")
      .insert(synthesisRecord)
      .select()
      .single();

    if (saveError) {
      console.error("Failed to save synthesis:", saveError);
    }

    await updateTemplateMetrics(supabase, selectedTemplate.id, synthesis.coherenceScore);

    await recordLearningMetric(supabase, "synthesis_quality", synthesis.coherenceScore);

    const endTime = performance.now();

    return new Response(
      JSON.stringify({
        synthesis: synthesis.text,
        metadata: {
          ...synthesis,
          sourcePages: sourcePages.map((p: any) => ({
            id: p.id,
            title: p.title,
            url: p.url,
            source: p.source.name,
            reliability: p.source.reliability_score,
          })),
          knowledgeNodes: knowledgeNodes.map((n: any) => ({
            id: n.id,
            name: n.entity_name,
            type: n.entity_type,
            importance: n.importance_score,
          })),
          template: selectedTemplate.template_name,
          totalTime: Math.round(endTime - startTime),
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Synthesis worker error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function fetchRelevantKnowledgeNodes(supabase: any, query: string): Promise<any[]> {
  const queryTokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 3);

  const { data: nodes } = await supabase
    .from("knowledge_graph_nodes")
    .select("*")
    .order("importance_score", { ascending: false })
    .limit(50);

  if (!nodes || nodes.length === 0) return [];

  const relevantNodes = nodes.filter((node: any) => {
    const nodeName = node.entity_name.toLowerCase();
    return queryTokens.some((token) => nodeName.includes(token));
  });

  return relevantNodes.slice(0, 10);
}

async function fetchRelevantSourcePages(supabase: any, query: string, maxSources: number): Promise<any[]> {
  const cacheKey = `synthesis_sources:${query.toLowerCase().replace(/\s+/g, "_")}`;

  const { data: cached } = await supabase
    .from("osint_data_cache")
    .select("data")
    .eq("cache_key", cacheKey)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (cached && cached.data.sources) {
    await supabase
      .from("osint_data_cache")
      .update({ hit_count: (cached.data.hitCount || 0) + 1 })
      .eq("cache_key", cacheKey);

    return cached.data.sources.slice(0, maxSources);
  }

  const { data: pages } = await supabase
    .from("indexed_pages")
    .select(`
      *,
      source:trusted_sources(name, reliability_score)
    `)
    .eq("status", "active")
    .order("indexed_at", { ascending: false })
    .limit(100);

  if (!pages || pages.length === 0) return [];

  const queryTokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 3);

  const scoredPages = pages
    .map((page: any) => {
      const content = `${page.title} ${page.content}`.toLowerCase();
      let relevanceScore = 0;

      queryTokens.forEach((token) => {
        const matches = (content.match(new RegExp(token, "g")) || []).length;
        relevanceScore += matches;
      });

      relevanceScore *= page.source.reliability_score / 100;

      return { ...page, relevanceScore };
    })
    .filter((p) => p.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxSources);

  await supabase.from("osint_data_cache").upsert({
    cache_key: cacheKey,
    cache_type: "query_result",
    data: { sources: scoredPages, query, hitCount: 1 },
    freshness_score: 100,
    expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  });

  return scoredPages;
}

async function fetchSynthesisTemplates(supabase: any): Promise<any[]> {
  const { data: templates } = await supabase
    .from("synthesis_templates")
    .select("*")
    .order("success_rate", { ascending: false });

  return templates || [];
}

function selectBestTemplate(
  templates: any[],
  query: string,
  sourceCount: number,
  nodeCount: number,
  desiredStyle?: string
): any {
  if (templates.length === 0) {
    return {
      id: "fallback",
      template_name: "fallback",
      template_category: "narrative",
      style: "conversational",
      structure: {
        intro: "Based on available information about {query}:",
        body_structure: ["fact_statements", "citations"],
        conclusion: "This synthesis was compiled from {source_count} sources.",
      },
      conditions: {},
    };
  }

  const scored = templates.map((template) => {
    let score = template.success_rate || 50;

    if (template.conditions.min_sources && sourceCount < template.conditions.min_sources) {
      score -= 30;
    }

    if (desiredStyle && template.style === desiredStyle) {
      score += 20;
    }

    if (query.toLowerCase().includes("compare") && template.template_category === "comparative") {
      score += 25;
    }

    if (
      (query.toLowerCase().includes("history") || query.toLowerCase().includes("evolution")) &&
      template.template_category === "temporal"
    ) {
      score += 25;
    }

    if (
      (query.toLowerCase().includes("why") || query.toLowerCase().includes("how")) &&
      template.template_category === "explanatory"
    ) {
      score += 20;
    }

    return { template, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored[0].template;
}

async function generateMechanicalSynthesis(
  query: string,
  template: any,
  nodes: any[],
  sources: any[],
  style: string
): Promise<any> {
  const fragments = extractRelevantFragments(query, sources);

  let intro = template.structure.intro;
  intro = intro.replace("{query}", query);
  intro = intro.replace("{source_count}", sources.length.toString());
  intro = intro.replace(
    "{source_list}",
    sources
      .slice(0, 3)
      .map((s) => s.source.name)
      .join(", ")
  );

  const bodyParagraphs: string[] = [];
  const fragmentsPerParagraph = 2;

  for (let i = 0; i < Math.min(8, fragments.length); i += fragmentsPerParagraph) {
    const paragraphFragments = fragments.slice(i, i + fragmentsPerParagraph);
    let paragraph = "";

    paragraphFragments.forEach((frag, idx) => {
      if (idx === 0) {
        paragraph += frag.text;
      } else {
        const connector = ["Moreover", "Additionally", "Furthermore", "In addition"][idx % 4];
        paragraph += ` ${connector}, ${frag.text.charAt(0).toLowerCase()}${frag.text.slice(1)}`;
      }

      if (frag.citationNumber) {
        paragraph += ` [${frag.citationNumber}]`;
      }
    });

    bodyParagraphs.push(paragraph);
  }

  if (nodes.length > 0) {
    const topEntities = nodes.slice(0, 3).map((n) => n.entity_name);
    bodyParagraphs.push(`Key entities identified: ${topEntities.join(", ")}.`);
  }

  let conclusion = template.structure.conclusion;
  conclusion = conclusion.replace("{date}", new Date().toLocaleDateString());
  conclusion = conclusion.replace("{source_count}", sources.length.toString());

  const fullText = `${intro}\n\n${bodyParagraphs.join("\n\n")}\n\n${conclusion}`;

  const confidenceScore = calculateConfidenceScore(sources, fragments);
  const coherenceScore = calculateCoherenceScore(fullText);

  return {
    text: fullText,
    styleUsed: style,
    confidenceScore,
    coherenceScore,
    citationCount: fragments.length,
  };
}

function extractRelevantFragments(query: string, sources: any[]): any[] {
  const fragments: any[] = [];
  const queryTokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 3);

  sources.forEach((source, sourceIndex) => {
    const sentences = source.content
      .split(/[.!?]+/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 30 && s.length < 300);

    sentences.forEach((sentence: string) => {
      let relevanceScore = 0;

      queryTokens.forEach((token) => {
        if (sentence.toLowerCase().includes(token)) {
          relevanceScore += 1;
        }
      });

      const wordCount = sentence.split(/\s+/).length;
      if (wordCount > 10 && wordCount < 40) {
        relevanceScore += 0.5;
      }

      relevanceScore *= source.source.reliability_score / 100;

      if (relevanceScore > 0.8) {
        fragments.push({
          text: sentence,
          sourceId: source.id,
          score: relevanceScore,
          citationNumber: sourceIndex + 1,
        });
      }
    });
  });

  return fragments.sort((a, b) => b.score - a.score);
}

function calculateConfidenceScore(sources: any[], fragments: any[]): number {
  if (sources.length === 0) return 30;

  const avgReliability =
    sources.reduce((sum, s) => sum + s.source.reliability_score, 0) / sources.length;

  const sourceBonus = Math.min(20, sources.length * 3);
  const fragmentBonus = Math.min(15, fragments.length * 2);

  return Math.min(100, avgReliability * 0.65 + sourceBonus + fragmentBonus);
}

function calculateCoherenceScore(text: string): number {
  let score = 70;

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);

  if (sentences.length < 3) {
    score -= 20;
  } else if (sentences.length > 15) {
    score -= 10;
  }

  const connectors = [
    "moreover",
    "furthermore",
    "additionally",
    "however",
    "therefore",
    "consequently",
  ];
  const hasConnectors = connectors.some((c) => text.toLowerCase().includes(c));

  if (hasConnectors) score += 15;

  const avgSentenceLength = text.length / sentences.length;
  if (avgSentenceLength > 50 && avgSentenceLength < 150) {
    score += 10;
  }

  const hasCitations = /\[\d+\]/.test(text);
  if (hasCitations) score += 5;

  return Math.min(100, Math.max(0, score));
}

async function updateTemplateMetrics(supabase: any, templateId: string, qualityScore: number): Promise<void> {
  const { data: template } = await supabase
    .from("synthesis_templates")
    .select("usage_count, success_rate")
    .eq("id", templateId)
    .single();

  if (!template) return;

  const newUsageCount = (template.usage_count || 0) + 1;
  const currentSuccessRate = template.success_rate || 50;

  const newSuccessRate = (currentSuccessRate * 0.9 + qualityScore * 0.1);

  await supabase
    .from("synthesis_templates")
    .update({
      usage_count: newUsageCount,
      success_rate: newSuccessRate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", templateId);
}

async function recordLearningMetric(supabase: any, metricType: string, value: number): Promise<void> {
  await supabase.from("learning_metrics").insert({
    metric_type: metricType,
    metric_value: value,
    time_window: "hourly",
    metadata: { timestamp: new Date().toISOString() },
    recorded_at: new Date().toISOString(),
  });
}
