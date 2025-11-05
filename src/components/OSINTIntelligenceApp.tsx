import { useState, useEffect } from 'react';
import { Brain, Zap, Database, TrendingUp, Activity, Clock, Search, Sparkles, Network, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LearningSession {
  id: string;
  session_start: string;
  session_end: string;
  topics_analyzed: string[];
  sources_consulted: number;
  new_knowledge_count: number;
  synthesis_quality_score: number;
}

interface KnowledgeNode {
  id: string;
  entity_type: string;
  entity_name: string;
  confidence_score: number;
  importance_score: number;
  mention_count: number;
}

interface MechanicalSynthesis {
  id: string;
  query: string;
  synthesis_text: string;
  style_used: string;
  confidence_score: number;
  coherence_score: number;
  citation_count: number;
  created_at: string;
}

interface LearningMetric {
  metric_type: string;
  metric_value: number;
  recorded_at: string;
}

export function OSINTIntelligenceApp() {
  const [activeTab, setActiveTab] = useState<'query' | 'knowledge' | 'learning' | 'metrics'>('query');
  const [query, setQuery] = useState('');
  const [style, setStyle] = useState<string>('adaptive');
  const [isGenerating, setIsGenerating] = useState(false);
  const [synthesis, setSynthesis] = useState<string>('');
  const [synthesisMetadata, setSynthesisMetadata] = useState<any>(null);

  const [learningSessions, setLearningSessions] = useState<LearningSession[]>([]);
  const [knowledgeNodes, setKnowledgeNodes] = useState<KnowledgeNode[]>([]);
  const [recentSyntheses, setRecentSyntheses] = useState<MechanicalSynthesis[]>([]);
  const [learningMetrics, setLearningMetrics] = useState<LearningMetric[]>([]);
  const [isLearning, setIsLearning] = useState(false);

  useEffect(() => {
    loadDashboardData();

    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    const { data: sessions } = await supabase
      .from('osint_learning_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (sessions) setLearningSessions(sessions);

    const { data: nodes } = await supabase
      .from('knowledge_graph_nodes')
      .select('*')
      .order('importance_score', { ascending: false })
      .limit(20);

    if (nodes) setKnowledgeNodes(nodes);

    const { data: syntheses } = await supabase
      .from('mechanical_syntheses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (syntheses) setRecentSyntheses(syntheses);

    const { data: metrics } = await supabase
      .from('learning_metrics')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(50);

    if (metrics) setLearningMetrics(metrics);
  };

  const handleGenerateSynthesis = async () => {
    if (!query.trim()) return;

    setIsGenerating(true);
    setSynthesis('');
    setSynthesisMetadata(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/intelligent-synthesis-worker`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            query,
            style: style === 'adaptive' ? undefined : style,
            max_sources: 15,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Synthesis generation failed');
      }

      const data = await response.json();
      setSynthesis(data.synthesis);
      setSynthesisMetadata(data.metadata);
    } catch (error) {
      console.error('Synthesis error:', error);
      setSynthesis('Failed to generate synthesis. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTriggerLearning = async () => {
    setIsLearning(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/autonomous-osint-orchestrator`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ action: 'execute_pending_tasks' }),
        }
      );

      if (response.ok) {
        setTimeout(() => {
          loadDashboardData();
        }, 2000);
      }
    } catch (error) {
      console.error('Learning trigger error:', error);
    } finally {
      setIsLearning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="flex-none bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Brain size={28} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">OSINT Intelligence System</h2>
              <p className="text-sm text-blue-100">Continuous Learning AI with Mechanical Synthesis</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm flex items-center gap-2">
              <Activity size={18} className="animate-pulse text-green-300" />
              <span className="text-sm font-medium">System Active</span>
            </div>
            <button
              onClick={handleTriggerLearning}
              disabled={isLearning}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Zap size={18} />
              {isLearning ? 'Learning...' : 'Trigger Learning'}
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('query')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'query' ? 'bg-white text-blue-600' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <Search size={18} />
            Query & Synthesis
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'knowledge' ? 'bg-white text-blue-600' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <Network size={18} />
            Knowledge Graph
          </button>
          <button
            onClick={() => setActiveTab('learning')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'learning' ? 'bg-white text-blue-600' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <Brain size={18} />
            Learning Sessions
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'metrics' ? 'bg-white text-blue-600' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <BarChart3 size={18} />
            Metrics
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'query' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles size={24} className="text-yellow-400" />
                Intelligent Query System
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">Your Query</label>
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask anything... The system will analyze knowledge and generate an intelligent synthesis"
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400 min-h-[100px]"
                  />
                </div>

                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-blue-200 mb-2">Synthesis Style</label>
                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:border-blue-400"
                    >
                      <option value="adaptive">Adaptive (Auto-Select)</option>
                      <option value="journalistic">Journalistic</option>
                      <option value="academic">Academic</option>
                      <option value="conversational">Conversational</option>
                      <option value="technical">Technical</option>
                      <option value="formal">Formal</option>
                    </select>
                  </div>

                  <button
                    onClick={handleGenerateSynthesis}
                    disabled={isGenerating || !query.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Synthesis'}
                  </button>
                </div>
              </div>
            </div>

            {isGenerating && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mx-auto mb-4"></div>
                <p className="text-white font-medium">Analyzing knowledge graph and generating synthesis...</p>
              </div>
            )}

            {synthesis && !isGenerating && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles size={24} className="text-green-400" />
                    Generated Synthesis
                  </h3>
                  {synthesisMetadata && (
                    <div className="flex gap-4 text-sm text-blue-200">
                      <span>Confidence: {synthesisMetadata.confidenceScore}%</span>
                      <span>Coherence: {synthesisMetadata.coherenceScore}%</span>
                      <span>{synthesisMetadata.citationCount} citations</span>
                    </div>
                  )}
                </div>

                <div className="prose prose-invert max-w-none">
                  <div className="text-white whitespace-pre-wrap leading-relaxed">{synthesis}</div>
                </div>

                {synthesisMetadata && synthesisMetadata.sourcePages && (
                  <div className="mt-6 pt-6 border-t border-white/20">
                    <h4 className="text-lg font-bold text-white mb-3">Sources Referenced</h4>
                    <div className="space-y-2">
                      {synthesisMetadata.sourcePages.map((source: any, idx: number) => (
                        <div key={source.id} className="text-sm text-blue-200">
                          [{idx + 1}] <span className="font-medium">{source.source}</span> - {source.title} (Reliability: {source.reliability}%)
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {recentSyntheses.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">Recent Syntheses</h3>
                <div className="space-y-3">
                  {recentSyntheses.slice(0, 5).map((s) => (
                    <div key={s.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-white">{s.query}</p>
                        <span className="text-xs text-blue-200">{new Date(s.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex gap-4 text-xs text-blue-200">
                        <span>Style: {s.style_used}</span>
                        <span>Confidence: {s.confidence_score}%</span>
                        <span>{s.citation_count} citations</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Network size={24} className="text-purple-400" />
                Knowledge Graph ({knowledgeNodes.length} Nodes)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {knowledgeNodes.map((node) => (
                  <div key={node.id} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-blue-400 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-white">{node.entity_name}</p>
                        <p className="text-xs text-blue-300 capitalize">{node.entity_type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-green-400 font-medium">{node.importance_score.toFixed(0)}%</p>
                        <p className="text-xs text-blue-200">{node.mention_count} mentions</p>
                      </div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${node.confidence_score}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-blue-200 mt-1">Confidence: {node.confidence_score.toFixed(0)}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'learning' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Brain size={24} className="text-pink-400" />
                Learning Sessions History
              </h3>

              <div className="space-y-4">
                {learningSessions.map((session) => (
                  <div key={session.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-white">Session {session.id.slice(0, 8)}</p>
                        <p className="text-xs text-blue-200 mt-1">
                          {new Date(session.session_start).toLocaleString()} → {new Date(session.session_end).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-400">{session.synthesis_quality_score.toFixed(1)}%</p>
                        <p className="text-xs text-blue-200">Quality Score</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-blue-300">Topics</p>
                        <p className="font-medium text-white">{session.topics_analyzed.join(', ')}</p>
                      </div>
                      <div>
                        <p className="text-blue-300">Sources</p>
                        <p className="font-medium text-white">{session.sources_consulted}</p>
                      </div>
                      <div>
                        <p className="text-blue-300">New Knowledge</p>
                        <p className="font-medium text-white">{session.new_knowledge_count} nodes</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={24} className="text-green-400" />
                System Performance Metrics
              </h3>

              {learningMetrics.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['knowledge_growth', 'synthesis_quality', 'pattern_accuracy'].map((type) => {
                      const typeMetrics = learningMetrics.filter((m) => m.metric_type === type);
                      const avgValue = typeMetrics.length > 0
                        ? typeMetrics.reduce((sum, m) => sum + m.metric_value, 0) / typeMetrics.length
                        : 0;

                      return (
                        <div key={type} className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <p className="text-sm text-blue-300 capitalize mb-2">{type.replace('_', ' ')}</p>
                          <p className="text-3xl font-bold text-white">{avgValue.toFixed(1)}</p>
                          <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                            <div
                              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                              style={{ width: `${Math.min(100, avgValue)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h4 className="text-lg font-bold text-white mb-3">Recent Metrics Timeline</h4>
                    <div className="space-y-2">
                      {learningMetrics.slice(0, 10).map((metric, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-3">
                            <Clock size={14} className="text-blue-400" />
                            <span className="text-blue-200">{new Date(metric.recorded_at).toLocaleString()}</span>
                            <span className="text-white capitalize">{metric.metric_type.replace('_', ' ')}</span>
                          </div>
                          <span className="font-bold text-green-400">{metric.metric_value.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
