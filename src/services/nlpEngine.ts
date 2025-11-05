interface DocumentAnalysis {
  keywords: string[];
  concepts: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  entities: string[];
  summary: string[];
}

interface SynthesisResult {
  text: string;
  citations: Array<{
    id: string;
    number: string;
    title: string;
    url: string;
    source: string;
    reliability: number;
  }>;
  confidence: number;
  consensus: string[];
  contradictions: string[];
}

class NLPEngine {
  private stopWords = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'mais',
    'donc', 'car', 'ce', 'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes',
    'son', 'sa', 'ses', 'notre', 'nos', 'votre', 'vos', 'leur', 'leurs',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
    'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their'
  ]);

  private positiveWords = new Set([
    'bon', 'bien', 'excellent', 'positif', 'réussi', 'efficace', 'succès',
    'amélioration', 'progrès', 'favorable', 'bénéfique', 'optimal',
    'good', 'great', 'excellent', 'positive', 'successful', 'effective',
    'improvement', 'progress', 'favorable', 'beneficial', 'optimal'
  ]);

  private negativeWords = new Set([
    'mauvais', 'mal', 'négatif', 'échec', 'problème', 'difficile', 'crise',
    'risque', 'danger', 'préoccupant', 'inquiétant', 'critique',
    'bad', 'poor', 'negative', 'failure', 'problem', 'difficult', 'crisis',
    'risk', 'danger', 'concerning', 'worrying', 'critical'
  ]);

  tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2 && !this.stopWords.has(token));
  }

  stem(word: string): string {
    const suffixes = [
      'ment', 'ation', 'ateur', 'atrice', 'able', 'ible', 'eux', 'euse',
      'tion', 'sion', 'ique', 'isme', 'iste', 'ité', 'age', 'ant', 'ent',
      'ing', 'tion', 'sion', 'able', 'ible', 'ness', 'less', 'ful', 'ly'
    ];

    for (const suffix of suffixes) {
      if (word.endsWith(suffix) && word.length > suffix.length + 3) {
        return word.slice(0, -suffix.length);
      }
    }
    return word;
  }

  calculateTFIDF(documents: string[]): Map<string, Map<string, number>> {
    const tfidfMatrix = new Map<string, Map<string, number>>();
    const documentCount = documents.length;
    const documentFrequency = new Map<string, number>();

    documents.forEach((doc, docIndex) => {
      const tokens = this.tokenize(doc);
      const termFrequency = new Map<string, number>();
      const uniqueTerms = new Set<string>();

      tokens.forEach(token => {
        const stemmed = this.stem(token);
        termFrequency.set(stemmed, (termFrequency.get(stemmed) || 0) + 1);
        uniqueTerms.add(stemmed);
      });

      uniqueTerms.forEach(term => {
        documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
      });

      tfidfMatrix.set(`doc_${docIndex}`, termFrequency);
    });

    const scores = new Map<string, Map<string, number>>();

    tfidfMatrix.forEach((termFreq, docId) => {
      const docScores = new Map<string, number>();
      const totalTerms = Array.from(termFreq.values()).reduce((a, b) => a + b, 0);

      termFreq.forEach((freq, term) => {
        const tf = freq / totalTerms;
        const idf = Math.log(documentCount / (documentFrequency.get(term) || 1));
        docScores.set(term, tf * idf);
      });

      scores.set(docId, docScores);
    });

    return scores;
  }

  extractKeywords(text: string, limit: number = 10): string[] {
    const tokens = this.tokenize(text);
    const frequency = new Map<string, number>();

    tokens.forEach(token => {
      const stemmed = this.stem(token);
      frequency.set(stemmed, (frequency.get(stemmed) || 0) + 1);
    });

    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);
  }

  detectSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const tokens = this.tokenize(text);
    let positiveCount = 0;
    let negativeCount = 0;

    tokens.forEach(token => {
      if (this.positiveWords.has(token)) positiveCount++;
      if (this.negativeWords.has(token)) negativeCount++;
    });

    const threshold = tokens.length * 0.02;

    if (positiveCount > negativeCount + threshold) return 'positive';
    if (negativeCount > positiveCount + threshold) return 'negative';
    return 'neutral';
  }

  extractSentences(text: string): string[] {
    return text
      .replace(/([.!?])\s+/g, '$1|')
      .split('|')
      .map(s => s.trim())
      .filter(s => s.length > 20);
  }

  calculateSentenceScore(sentence: string, keywords: Set<string>): number {
    const tokens = this.tokenize(sentence);
    const stemmedTokens = tokens.map(t => this.stem(t));

    let score = 0;
    stemmedTokens.forEach(token => {
      if (keywords.has(token)) {
        score += 1;
      }
    });

    const positionBonus = sentence.length > 100 ? 0.5 : 0.2;
    return score + positionBonus;
  }

  generateExtractiveSummary(text: string, sentenceCount: number = 5): string[] {
    const sentences = this.extractSentences(text);
    if (sentences.length <= sentenceCount) return sentences;

    const keywords = new Set(this.extractKeywords(text, 20));
    const scoredSentences = sentences.map(sentence => ({
      sentence,
      score: this.calculateSentenceScore(sentence, keywords)
    }));

    return scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, sentenceCount)
      .map(item => item.sentence);
  }

  cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }

    const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  findConsensusAndContradictions(
    documents: Array<{ content: string; source: string }>
  ): { consensus: string[]; contradictions: string[] } {
    const allConcepts = new Map<string, string[]>();

    documents.forEach(doc => {
      const keywords = this.extractKeywords(doc.content, 15);
      keywords.forEach(keyword => {
        if (!allConcepts.has(keyword)) {
          allConcepts.set(keyword, []);
        }
        allConcepts.get(keyword)!.push(doc.source);
      });
    });

    const consensus: string[] = [];
    const contradictions: string[] = [];

    allConcepts.forEach((sources, concept) => {
      const coverage = sources.length / documents.length;
      if (coverage >= 0.6) {
        consensus.push(`Consensus sur "${concept}" (${sources.length}/${documents.length} sources)`);
      }
    });

    const sentiments = documents.map(doc => ({
      source: doc.source,
      sentiment: this.detectSentiment(doc.content)
    }));

    const posCount = sentiments.filter(s => s.sentiment === 'positive').length;
    const negCount = sentiments.filter(s => s.sentiment === 'negative').length;

    if (posCount > 0 && negCount > 0 && Math.abs(posCount - negCount) <= 1) {
      contradictions.push(`Divergence de tonalité détectée (${posCount} positives, ${negCount} négatives)`);
    }

    return { consensus, contradictions };
  }

  analyzeDocument(text: string): DocumentAnalysis {
    return {
      keywords: this.extractKeywords(text, 10),
      concepts: this.extractKeywords(text, 5),
      sentiment: this.detectSentiment(text),
      entities: this.extractKeywords(text, 8),
      summary: this.generateExtractiveSummary(text, 3)
    };
  }

  async generateSynthesis(
    query: string,
    results: Array<{
      id: string;
      title: string;
      content: string;
      url: string;
      source: { name: string; reliability_score: number };
    }>
  ): Promise<SynthesisResult> {
    const topResults = results
      .sort((a, b) => b.source.reliability_score - a.source.reliability_score)
      .slice(0, 5);

    const documents = topResults.map(r => ({
      content: r.content,
      source: r.source.name
    }));

    const { consensus, contradictions } = this.findConsensusAndContradictions(documents);

    const allContent = topResults.map(r => r.content).join('\n\n');
    const queryKeywords = new Set(this.extractKeywords(query, 10));
    const documentAnalyses = topResults.map(r => this.analyzeDocument(r.content));

    const importantSentences: Array<{ sentence: string; sourceIndex: number; score: number }> = [];

    topResults.forEach((result, index) => {
      const sentences = this.extractSentences(result.content);
      sentences.forEach(sentence => {
        const score = this.calculateSentenceScore(sentence, queryKeywords);
        if (score > 0.5) {
          importantSentences.push({ sentence, sourceIndex: index, score });
        }
      });
    });

    importantSentences.sort((a, b) => b.score - a.score);

    const synthesisText = this.buildSynthesisText(
      query,
      importantSentences.slice(0, 10),
      topResults,
      consensus,
      contradictions
    );

    const citations = topResults.map((result, index) => ({
      id: result.id,
      number: String(index + 1),
      title: result.title,
      url: result.url,
      source: result.source.name,
      reliability: result.source.reliability_score
    }));

    const avgReliability = topResults.reduce((sum, r) => sum + r.source.reliability_score, 0) / topResults.length;
    const confidence = Math.min(95, avgReliability * (consensus.length > 0 ? 1.05 : 0.95));

    return {
      text: synthesisText,
      citations,
      confidence: Math.round(confidence),
      consensus,
      contradictions
    };
  }

  private buildSynthesisText(
    query: string,
    sentences: Array<{ sentence: string; sourceIndex: number; score: number }>,
    sources: any[],
    consensus: string[],
    contradictions: string[]
  ): string {
    let synthesis = `## Synthèse OSINT : ${query}\n\n`;

    synthesis += `### Réponse factuelle\n\n`;

    const groupedBySentiment: { [key: string]: typeof sentences } = {
      high: [],
      medium: [],
      low: []
    };

    sentences.forEach(item => {
      if (item.score > 2) groupedBySentiment.high.push(item);
      else if (item.score > 1) groupedBySentiment.medium.push(item);
      else groupedBySentiment.low.push(item);
    });

    const selectedSentences = [
      ...groupedBySentiment.high.slice(0, 4),
      ...groupedBySentiment.medium.slice(0, 3),
      ...groupedBySentiment.low.slice(0, 2)
    ];

    selectedSentences.forEach((item, idx) => {
      const citation = item.sourceIndex + 1;
      synthesis += `${item.sentence} [${citation}]\n\n`;
    });

    if (consensus.length > 0) {
      synthesis += `### Points de consensus\n\n`;
      consensus.slice(0, 3).forEach(point => {
        synthesis += `- ${point}\n`;
      });
      synthesis += `\n`;
    }

    if (contradictions.length > 0) {
      synthesis += `### Divergences identifiées\n\n`;
      contradictions.forEach(contradiction => {
        synthesis += `- ${contradiction}\n`;
      });
      synthesis += `\n`;
    }

    synthesis += `### Évaluation des sources\n\n`;
    sources.slice(0, 3).forEach((source, idx) => {
      synthesis += `[${idx + 1}] **${source.source.name}** - Fiabilité: ${source.source.reliability_score}%\n`;
      synthesis += `   ${source.title}\n\n`;
    });

    return synthesis;
  }
}

export const nlpEngine = new NLPEngine();
