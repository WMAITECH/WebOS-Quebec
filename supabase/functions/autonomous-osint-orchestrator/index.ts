import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface LearningTask {
  id: string;
  task_type: string;
  parameters: Record<string, any>;
}

interface OSINTSearchResult {
  source: string;
  title: string;
  snippet: string;
  url: string;
  timestamp?: string;
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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action = "execute_pending_tasks" } = await req.json().catch(() => ({}));

    if (action === "execute_pending_tasks") {
      const result = await executePendingTasks(supabase);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "schedule_adaptive_tasks") {
      const result = await scheduleAdaptiveTasks(supabase);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Orchestrator error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function executePendingTasks(supabase: any): Promise<Record<string, any>> {
  const now = new Date().toISOString();

  const { data: tasks, error: fetchError } = await supabase
    .from("learning_tasks_queue")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", now)
    .order("priority", { ascending: false })
    .limit(10);

  if (fetchError) {
    console.error("Failed to fetch tasks:", fetchError);
    return { success: false, error: fetchError.message };
  }

  if (!tasks || tasks.length === 0) {
    return { success: true, message: "No pending tasks", tasksExecuted: 0 };
  }

  const results = [];

  for (const task of tasks) {
    await supabase
      .from("learning_tasks_queue")
      .update({ status: "processing", started_at: new Date().toISOString() })
      .eq("id", task.id);

    try {
      let taskResult: any;

      switch (task.task_type) {
        case "osint_scan":
          taskResult = await executeOSINTScan(supabase, task);
          break;
        case "knowledge_update":
          taskResult = await executeKnowledgeUpdate(supabase, task);
          break;
        case "pattern_detection":
          taskResult = await executePatternDetection(supabase, task);
          break;
        case "graph_consolidation":
          taskResult = await executeGraphConsolidation(supabase, task);
          break;
        case "cache_refresh":
          taskResult = await executeCacheRefresh(supabase, task);
          break;
        default:
          taskResult = { success: false, error: "Unknown task type" };
      }

      await supabase
        .from("learning_tasks_queue")
        .update({
          status: taskResult.success ? "completed" : "failed",
          completed_at: new Date().toISOString(),
          result: taskResult,
          error_message: taskResult.error || null,
        })
        .eq("id", task.id);

      results.push({ taskId: task.id, taskType: task.task_type, result: taskResult });
    } catch (error) {
      console.error(`Task ${task.id} failed:`, error);

      await supabase
        .from("learning_tasks_queue")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: error.message,
          retry_count: (task.retry_count || 0) + 1,
        })
        .eq("id", task.id);

      results.push({ taskId: task.id, taskType: task.task_type, error: error.message });
    }
  }

  return { success: true, tasksExecuted: results.length, results };
}

async function executeOSINTScan(supabase: any, task: LearningTask): Promise<Record<string, any>> {
  const { topics = [], depth = "standard" } = task.parameters;

  if (topics.length === 0) {
    topics.push("emerging technology", "global events", "scientific discoveries");
  }

  const allResults: OSINTSearchResult[] = [];
  const newKnowledgeCount = 0;

  for (const topic of topics) {
    const osintResults = await searchOSINTSources(topic);
    allResults.push(...osintResults);

    await storeOSINTResults(supabase, topic, osintResults);
  }

  const knowledgeExtracted = await extractKnowledgeFromResults(supabase, allResults);

  await supabase.from("osint_learning_sessions").insert({
    session_start: new Date().toISOString(),
    session_end: new Date().toISOString(),
    topics_analyzed: topics,
    sources_consulted: allResults.length,
    new_knowledge_count: knowledgeExtracted.nodeCount,
    model_version: "1.0.0",
    metadata: { depth, resultsCount: allResults.length },
  });

  return {
    success: true,
    topicsScanned: topics.length,
    resultsFound: allResults.length,
    knowledgeNodesCreated: knowledgeExtracted.nodeCount,
    edgesCreated: knowledgeExtracted.edgeCount,
  };
}

async function searchOSINTSources(query: string): Promise<OSINTSearchResult[]> {
  const results: OSINTSearchResult[] = [];

  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&format=json&origin=*`;
    const wikiResponse = await fetch(wikiUrl);
    const wikiData = await wikiResponse.json();

    if (Array.isArray(wikiData[1])) {
      for (let i = 0; i < wikiData[1].length; i++) {
        results.push({
          source: "Wikipedia",
          title: wikiData[1][i],
          snippet: wikiData[2][i] || "",
          url: wikiData[3][i],
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error("Wikipedia search failed:", error);
  }

  try {
    const hnUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&hitsPerPage=5`;
    const hnResponse = await fetch(hnUrl);
    const hnData = await hnResponse.json();

    if (Array.isArray(hnData.hits)) {
      for (const hit of hnData.hits) {
        results.push({
          source: "Hacker News",
          title: hit.title || "(no title)",
          snippet: hit.url || "",
          url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
          timestamp: hit.created_at || new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error("HackerNews search failed:", error);
  }

  return results;
}

async function storeOSINTResults(
  supabase: any,
  topic: string,
  results: OSINTSearchResult[]
): Promise<void> {
  const cacheKey = `osint_scan:${topic}:${new Date().toISOString().split("T")[0]}`;

  await supabase
    .from("osint_data_cache")
    .upsert({
      cache_key: cacheKey,
      cache_type: "query_result",
      data: { topic, results, count: results.length },
      freshness_score: 100,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
}

async function extractKnowledgeFromResults(
  supabase: any,
  results: OSINTSearchResult[]
): Promise<{ nodeCount: number; edgeCount: number }> {
  const entityPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/g;
  const entities = new Map<string, { count: number; sources: string[] }>();

  results.forEach((result) => {
    const text = `${result.title} ${result.snippet}`;
    const matches = [...text.matchAll(entityPattern)];

    matches.forEach((match) => {
      const entity = match[1].trim();
      if (entity.length < 3) return;

      const existing = entities.get(entity);
      if (existing) {
        existing.count++;
        existing.sources.push(result.source);
      } else {
        entities.set(entity, { count: 1, sources: [result.source] });
      }
    });
  });

  let nodeCount = 0;

  for (const [entityName, data] of entities.entries()) {
    if (data.count < 2) continue;

    const { error } = await supabase
      .from("knowledge_graph_nodes")
      .upsert({
        entity_type: "concept",
        entity_name: entityName,
        confidence_score: Math.min(95, 50 + data.count * 10),
        importance_score: Math.min(90, 40 + data.count * 5),
        mention_count: data.count,
        last_updated: new Date().toISOString(),
        attributes: { sources: data.sources },
      }, { onConflict: "entity_name" });

    if (!error) nodeCount++;
  }

  return { nodeCount, edgeCount: 0 };
}

async function executeKnowledgeUpdate(supabase: any, task: LearningTask): Promise<Record<string, any>> {
  const { consolidate_duplicates = true } = task.parameters;

  const { data: nodes } = await supabase
    .from("knowledge_graph_nodes")
    .select("*")
    .order("last_updated", { ascending: true })
    .limit(100);

  if (!nodes || nodes.length === 0) {
    return { success: true, message: "No nodes to update", nodesUpdated: 0 };
  }

  let updated = 0;

  for (const node of nodes) {
    const timeSinceUpdate = Date.now() - new Date(node.last_updated).getTime();
    const daysSinceUpdate = timeSinceUpdate / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate > 7) {
      const newImportance = Math.max(20, node.importance_score - 5);

      await supabase
        .from("knowledge_graph_nodes")
        .update({ importance_score: newImportance })
        .eq("id", node.id);

      updated++;
    }
  }

  return { success: true, nodesUpdated: updated };
}

async function executePatternDetection(supabase: any, task: LearningTask): Promise<Record<string, any>> {
  const { pattern_types = ["temporal", "statistical"] } = task.parameters;

  const { data: nodes } = await supabase
    .from("knowledge_graph_nodes")
    .select("*")
    .order("mention_count", { ascending: false })
    .limit(50);

  if (!nodes || nodes.length === 0) {
    return { success: true, message: "No nodes for pattern detection", patternsFound: 0 };
  }

  const entityFrequency = new Map<string, number>();
  nodes.forEach((node: any) => {
    const type = node.entity_type;
    entityFrequency.set(type, (entityFrequency.get(type) || 0) + 1);
  });

  let patternsCreated = 0;

  for (const [entityType, count] of entityFrequency.entries()) {
    if (count >= 5) {
      await supabase.from("learned_patterns").insert({
        pattern_type: "statistical",
        pattern_description: `High frequency of ${entityType} entities detected`,
        pattern_data: { entity_type: entityType, count, threshold: 5 },
        confidence_score: Math.min(95, 60 + count * 5),
        occurrence_count: count,
        last_observed: new Date().toISOString(),
      });

      patternsCreated++;
    }
  }

  return { success: true, patternsFound: patternsCreated };
}

async function executeGraphConsolidation(supabase: any, task: LearningTask): Promise<Record<string, any>> {
  const { data: nodes } = await supabase
    .from("knowledge_graph_nodes")
    .select("*");

  if (!nodes || nodes.length < 2) {
    return { success: true, message: "Not enough nodes for consolidation", consolidations: 0 };
  }

  const similarGroups: string[][] = [];

  for (let i = 0; i < nodes.length - 1; i++) {
    const group: string[] = [nodes[i].id];

    for (let j = i + 1; j < nodes.length; j++) {
      const similarity = calculateStringSimilarity(
        nodes[i].entity_name.toLowerCase(),
        nodes[j].entity_name.toLowerCase()
      );

      if (similarity > 0.8) {
        group.push(nodes[j].id);
      }
    }

    if (group.length > 1) {
      similarGroups.push(group);
    }
  }

  return { success: true, consolidations: similarGroups.length };
}

async function executeCacheRefresh(supabase: any, task: LearningTask): Promise<Record<string, any>> {
  const now = new Date().toISOString();

  const { error, count } = await supabase
    .from("osint_data_cache")
    .delete()
    .lt("expires_at", now);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, entriesRemoved: count || 0 };
}

async function scheduleAdaptiveTasks(supabase: any): Promise<Record<string, any>> {
  const { data: recentSessions } = await supabase
    .from("osint_learning_sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const avgQuality = recentSessions && recentSessions.length > 0
    ? recentSessions.reduce((sum: number, s: any) => sum + (s.synthesis_quality_score || 0), 0) / recentSessions.length
    : 70;

  const scanPriority = avgQuality < 60 ? 9 : avgQuality < 80 ? 7 : 5;

  const tasksToSchedule = [
    {
      task_type: "osint_scan",
      priority: scanPriority,
      scheduled_for: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      parameters: { topics: ["trending technology", "recent discoveries"], depth: "exploratory" },
    },
    {
      task_type: "knowledge_update",
      priority: 6,
      scheduled_for: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      parameters: { consolidate_duplicates: true },
    },
    {
      task_type: "pattern_detection",
      priority: 5,
      scheduled_for: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      parameters: { pattern_types: ["temporal", "statistical", "causal"] },
    },
  ];

  const { error } = await supabase
    .from("learning_tasks_queue")
    .insert(tasksToSchedule);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, tasksScheduled: tasksToSchedule.length };
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
