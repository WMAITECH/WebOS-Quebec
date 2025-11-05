import { useState } from 'react';
import { Sparkles, ExternalLink, Shield, Loader2, Brain } from 'lucide-react';
import { nlpEngine } from '../services/nlpEngine';

interface Citation {
  id: string;
  number: string;
  title: string;
  url: string;
  source: string;
  reliability: number;
}

interface AISynthesisProps {
  queryId: string;
  query: string;
  results: any[];
}

export function AISynthesis({ queryId, query, results }: AISynthesisProps) {
  const [synthesisText, setSynthesisText] = useState('');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [consensus, setConsensus] = useState<string[]>([]);
  const [contradictions, setContradictions] = useState<string[]>([]);

  const startSynthesis = async () => {
    if (results.length === 0) {
      setError('Aucun résultat disponible pour la synthèse');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSynthesisText('');
    setCitations([]);
    setConsensus([]);
    setContradictions([]);
    setIsVisible(true);

    try {
      const result = await nlpEngine.generateSynthesis(query, results);

      const words = result.text.split(' ');
      let currentText = '';

      for (let i = 0; i < words.length; i++) {
        currentText += words[i] + ' ';
        setSynthesisText(currentText);
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      setCitations(result.citations);
      setConfidence(result.confidence);
      setConsensus(result.consensus);
      setContradictions(result.contradictions);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setIsLoading(false);
    }
  };

  if (!isVisible) {
    return (
      <div className="w-full max-w-4xl">
        <button
          onClick={startSynthesis}
          disabled={results.length === 0}
          className="w-full px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
        >
          <Brain size={24} />
          <span>Générer Synthèse Intelligente (Moteur NLP Indépendant)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-300 rounded-2xl p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg">
            <Brain size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Synthèse OSINT Intelligente</h2>
            <p className="text-sm text-gray-600">Moteur NLP Propriétaire - 100% Souverain</p>
          </div>
        </div>
        {confidence > 0 && (
          <div className="px-4 py-2 bg-green-100 border border-green-300 rounded-lg">
            <p className="text-sm font-semibold text-green-800">
              Confiance: {confidence}%
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg text-red-700 font-medium">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl p-6 mb-6 shadow-md border border-slate-200">
        {isLoading && synthesisText === '' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 size={40} className="animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600 font-medium">Analyse NLP en cours...</p>
            <p className="text-sm text-gray-500 mt-2">Extraction de concepts, corrélation de sources, génération de synthèse</p>
          </div>
        )}

        <div className="prose prose-lg max-w-none">
          <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {synthesisText}
            {isLoading && <span className="inline-block w-2 h-6 bg-cyan-500 ml-1 animate-pulse" />}
          </div>
        </div>
      </div>

      {(consensus.length > 0 || contradictions.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {consensus.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                <CheckCircle size={20} className="text-green-600" />
                Points de Consensus
              </h3>
              <ul className="space-y-2">
                {consensus.map((point, idx) => (
                  <li key={idx} className="text-sm text-green-800">{point}</li>
                ))}
              </ul>
            </div>
          )}
          {contradictions.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                <AlertCircle size={20} className="text-yellow-600" />
                Divergences Détectées
              </h3>
              <ul className="space-y-2">
                {contradictions.map((point, idx) => (
                  <li key={idx} className="text-sm text-yellow-800">{point}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {citations.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield size={20} className="text-blue-600" />
            Sources Citées
          </h3>
          <div className="space-y-3">
            {citations.map((citation) => (
              <div
                key={citation.id}
                className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all border border-slate-200"
              >
                <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                  {citation.number}
                </span>
                <div className="flex-1 min-w-0">
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1 block"
                  >
                    {citation.title}
                  </a>
                  <div className="flex items-center gap-3 mt-2 text-sm">
                    <span className="text-gray-600 font-medium">{citation.source}</span>
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md font-semibold">
                      <Shield size={12} />
                      {citation.reliability}%
                    </span>
                  </div>
                </div>
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 text-gray-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                >
                  <ExternalLink size={18} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CheckCircle({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function AlertCircle({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
      <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="16" r="1" fill="currentColor"/>
    </svg>
  );
}
