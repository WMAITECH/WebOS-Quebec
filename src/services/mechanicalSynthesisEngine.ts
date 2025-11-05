interface SynthesisTemplate {
  id: string;
  template_name: string;
  template_category: string;
  style: string;
  structure: {
    intro: string;
    body_structure: string[];
    conclusion: string;
  };
  conditions: Record<string, any>;
}

interface KnowledgeNode {
  id: string;
  entity_type: string;
  entity_name: string;
  attributes: Record<string, any>;
  confidence_score: number;
}

interface SourcePage {
  id: string;
  title: string;
  content: string;
  url: string;
  source: {
    name: string;
    reliability_score: number;
  };
}

interface SynthesisResult {
  text: string;
  templateId: string;
  styleUsed: string;
  sourceNodes: string[];
  sourcePages: string[];
  confidenceScore: number;
  coherenceScore: number;
  citationCount: number;
  generationTimeMs: number;
  metadata: Record<string, any>;
}

interface SentenceFragment {
  text: string;
  sourceId: string;
  score: number;
  citationNumber?: number;
}

class MechanicalSynthesisEngine {
  private templates: Map<string, SynthesisTemplate> = new Map();
  private styleTransformers: Map<string, (text: string) => string> = new Map();
  private narrativeConnectors: string[][] = [];

  constructor() {
    this.initializeStyleTransformers();
    this.initializeNarrativeConnectors();
  }

  private initializeStyleTransformers() {
    this.styleTransformers.set('journalistic', (text: string) => {
      return text
        .replace(/^/, 'According to multiple sources, ')
        .replace(/\. /g, '. Recent analysis shows ')
        .trim();
    });

    this.styleTransformers.set('academic', (text: string) => {
      return text
        .replace(/^/, 'Research indicates that ')
        .replace(/\. /g, '. Furthermore, empirical evidence suggests ')
        .trim();
    });

    this.styleTransformers.set('conversational', (text: string) => {
      return text
        .replace(/^/, 'Here\'s what I found: ')
        .replace(/\. /g, '. Interestingly, ')
        .trim();
    });

    this.styleTransformers.set('technical', (text: string) => {
      return text
        .replace(/^/, 'Technical analysis reveals ')
        .replace(/\. /g, '. The data indicates ')
        .trim();
    });

    this.styleTransformers.set('formal', (text: string) => {
      return text
        .replace(/^/, 'It has been established that ')
        .replace(/\. /g, '. Additionally, ')
        .trim();
    });
  }

  private initializeNarrativeConnectors() {
    this.narrativeConnectors = [
      ['Moreover', 'Furthermore', 'Additionally', 'In addition'],
      ['However', 'Nevertheless', 'Nonetheless', 'On the other hand'],
      ['Therefore', 'Thus', 'Consequently', 'As a result'],
      ['For example', 'For instance', 'Specifically', 'In particular'],
      ['In contrast', 'Conversely', 'Alternatively', 'On the contrary'],
      ['Similarly', 'Likewise', 'In the same vein', 'Comparably']
    ];
  }

  private selectConnector(index: number, sentimentShift: 'positive' | 'negative' | 'neutral'): string {
    let connectorGroup: string[];

    if (sentimentShift === 'negative') {
      connectorGroup = this.narrativeConnectors[1];
    } else if (sentimentShift === 'positive') {
      connectorGroup = this.narrativeConnectors[0];
    } else {
      connectorGroup = this.narrativeConnectors[index % this.narrativeConnectors.length];
    }

    return connectorGroup[Math.floor(Math.random() * connectorGroup.length)];
  }

  loadTemplate(template: SynthesisTemplate) {
    this.templates.set(template.template_name, template);
  }

  selectTemplate(
    query: string,
    sourceCount: number,
    hasTemporalData: boolean,
    entityCount: number,
    desiredStyle?: string
  ): SynthesisTemplate | null {
    const candidates: Array<{ template: SynthesisTemplate; score: number }> = [];

    this.templates.forEach(template => {
      let score = 100;

      if (template.conditions.min_sources && sourceCount < template.conditions.min_sources) {
        score -= 30;
      }

      if (template.conditions.requires_temporal_data && !hasTemporalData) {
        score -= 40;
      }

      if (template.conditions.requires_entities && entityCount < template.conditions.requires_entities) {
        score -= 35;
      }

      if (desiredStyle && template.style !== desiredStyle) {
        score -= 20;
      }

      if (query.includes('compare') || query.includes('versus') || query.includes('vs')) {
        if (template.template_category === 'comparative') score += 30;
      }

      if (query.includes('history') || query.includes('evolution') || query.includes('timeline')) {
        if (template.template_category === 'temporal') score += 30;
      }

      if (query.includes('why') || query.includes('how') || query.includes('explain')) {
        if (template.template_category === 'explanatory') score += 25;
      }

      candidates.push({ template, score });
    });

    candidates.sort((a, b) => b.score - a.score);

    return candidates.length > 0 && candidates[0].score >= 50 ? candidates[0].template : null;
  }

  async generateSynthesis(
    query: string,
    knowledgeNodes: KnowledgeNode[],
    sourcePages: SourcePage[],
    desiredStyle?: string
  ): Promise<SynthesisResult> {
    const startTime = performance.now();

    const hasTemporalData = sourcePages.some(s => s.content.match(/\d{4}|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b/i));

    const template = this.selectTemplate(
      query,
      sourcePages.length,
      hasTemporalData,
      knowledgeNodes.length,
      desiredStyle
    );

    if (!template) {
      return this.generateFallbackSynthesis(query, knowledgeNodes, sourcePages);
    }

    const style = desiredStyle || template.style;

    const fragments = this.extractRelevantFragments(query, sourcePages);

    const synthesisText = this.assembleSynthesis(
      query,
      template,
      fragments,
      knowledgeNodes,
      sourcePages,
      style
    );

    const coherenceScore = this.calculateCoherenceScore(synthesisText);
    const confidenceScore = this.calculateConfidenceScore(sourcePages, fragments);

    const endTime = performance.now();

    return {
      text: synthesisText,
      templateId: template.id,
      styleUsed: style,
      sourceNodes: knowledgeNodes.map(n => n.id),
      sourcePages: sourcePages.map(p => p.id),
      confidenceScore,
      coherenceScore,
      citationCount: fragments.length,
      generationTimeMs: Math.round(endTime - startTime),
      metadata: {
        templateName: template.template_name,
        category: template.template_category,
        fragmentsUsed: fragments.length,
        avgSourceReliability: sourcePages.reduce((sum, p) => sum + p.source.reliability_score, 0) / sourcePages.length
      }
    };
  }

  private extractRelevantFragments(query: string, sources: SourcePage[]): SentenceFragment[] {
    const fragments: SentenceFragment[] = [];
    const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 3);

    sources.forEach((source, sourceIndex) => {
      const sentences = source.content
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 30 && s.length < 300);

      sentences.forEach(sentence => {
        let relevanceScore = 0;

        queryTokens.forEach(token => {
          if (sentence.toLowerCase().includes(token)) {
            relevanceScore += 1;
          }
        });

        const wordCount = sentence.split(/\s+/).length;
        if (wordCount > 10 && wordCount < 40) {
          relevanceScore += 0.5;
        }

        relevanceScore *= (source.source.reliability_score / 100);

        if (relevanceScore > 0.8) {
          fragments.push({
            text: sentence,
            sourceId: source.id,
            score: relevanceScore,
            citationNumber: sourceIndex + 1
          });
        }
      });
    });

    return fragments.sort((a, b) => b.score - a.score);
  }

  private assembleSynthesis(
    query: string,
    template: SynthesisTemplate,
    fragments: SentenceFragment[],
    nodes: KnowledgeNode[],
    sources: SourcePage[],
    style: string
  ): string {
    const sections: string[] = [];

    const intro = this.generateIntro(template, query, sources, style);
    sections.push(intro);

    const bodyFragments = fragments.slice(0, Math.min(8, fragments.length));

    const body = this.generateBody(template, bodyFragments, nodes, style);
    sections.push(body);

    const conclusion = this.generateConclusion(template, query, sources, nodes, style);
    sections.push(conclusion);

    const fullSynthesis = sections.join('\n\n');

    return this.applyStyleTransformation(fullSynthesis, style);
  }

  private generateIntro(
    template: SynthesisTemplate,
    query: string,
    sources: SourcePage[],
    style: string
  ): string {
    let intro = template.structure.intro;

    intro = intro.replace('{query}', query);
    intro = intro.replace('{source_count}', sources.length.toString());

    const sourceNames = Array.from(new Set(sources.map(s => s.source.name))).slice(0, 3);
    intro = intro.replace('{source_list}', sourceNames.join(', '));

    if (style === 'conversational') {
      intro = `Let me break down what I found about ${query}. ` + intro;
    } else if (style === 'academic') {
      intro = `This synthesis examines ${query} through ${sources.length} scholarly sources. ` + intro;
    }

    return intro;
  }

  private generateBody(
    template: SynthesisTemplate,
    fragments: SentenceFragment[],
    nodes: KnowledgeNode[],
    style: string
  ): string {
    const paragraphs: string[] = [];
    const fragmentsPerParagraph = 2;

    for (let i = 0; i < fragments.length; i += fragmentsPerParagraph) {
      const paragraphFragments = fragments.slice(i, i + fragmentsPerParagraph);

      let paragraph = '';

      paragraphFragments.forEach((fragment, idx) => {
        if (idx === 0) {
          paragraph += fragment.text;
        } else {
          const connector = this.selectConnector(i, 'neutral');
          paragraph += ` ${connector}, ${fragment.text.charAt(0).toLowerCase()}${fragment.text.slice(1)}`;
        }

        if (fragment.citationNumber) {
          paragraph += ` [${fragment.citationNumber}]`;
        }
      });

      paragraphs.push(paragraph);
    }

    if (nodes.length > 0 && template.structure.body_structure.includes('entities')) {
      const topEntities = nodes
        .sort((a, b) => b.confidence_score - a.confidence_score)
        .slice(0, 3);

      const entityMention = `Key entities identified include: ${topEntities.map(n => n.entity_name).join(', ')}.`;
      paragraphs.push(entityMention);
    }

    return paragraphs.join('\n\n');
  }

  private generateConclusion(
    template: SynthesisTemplate,
    query: string,
    sources: SourcePage[],
    nodes: KnowledgeNode[],
    style: string
  ): string {
    let conclusion = template.structure.conclusion;

    conclusion = conclusion.replace('{date}', new Date().toLocaleDateString());

    const sourceList = Array.from(new Set(sources.map(s => s.source.name))).join(', ');
    conclusion = conclusion.replace('{source_list}', sourceList);

    const avgConfidence = nodes.reduce((sum, n) => sum + n.confidence_score, 0) / (nodes.length || 1);
    const conclusionStatement = avgConfidence > 75
      ? 'strong evidence supports the findings'
      : 'moderate evidence suggests these conclusions';

    conclusion = conclusion.replace('{conclusion_statement}', conclusionStatement);

    if (style === 'conversational') {
      conclusion = `So, to wrap things up: ${conclusion}`;
    } else if (style === 'academic') {
      conclusion = `In summation, ${conclusion}`;
    }

    return conclusion;
  }

  private applyStyleTransformation(text: string, style: string): string {
    const transformer = this.styleTransformers.get(style);

    if (!transformer) return text;

    const sentences = text.split(/\.\s+/);
    const transformed = sentences.slice(0, 2).map(s => transformer(s)).join('. ');

    return transformed + text.slice(transformed.length);
  }

  private calculateCoherenceScore(text: string): number {
    let score = 70;

    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);

    if (sentences.length < 3) {
      score -= 20;
    } else if (sentences.length > 15) {
      score -= 10;
    }

    const hasConnectors = this.narrativeConnectors.flat().some(connector =>
      text.toLowerCase().includes(connector.toLowerCase())
    );

    if (hasConnectors) score += 15;

    const avgSentenceLength = text.length / sentences.length;
    if (avgSentenceLength > 50 && avgSentenceLength < 150) {
      score += 10;
    }

    const hasCitations = /\[\d+\]/.test(text);
    if (hasCitations) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  private calculateConfidenceScore(sources: SourcePage[], fragments: SentenceFragment[]): number {
    if (sources.length === 0) return 30;

    const avgReliability = sources.reduce((sum, s) => sum + s.source.reliability_score, 0) / sources.length;

    const sourceBonus = Math.min(20, sources.length * 3);

    const fragmentBonus = Math.min(15, fragments.length * 2);

    return Math.min(100, avgReliability * 0.65 + sourceBonus + fragmentBonus);
  }

  private generateFallbackSynthesis(
    query: string,
    nodes: KnowledgeNode[],
    sources: SourcePage[]
  ): SynthesisResult {
    const startTime = performance.now();

    const fragments = this.extractRelevantFragments(query, sources);
    const topFragments = fragments.slice(0, 5);

    let text = `Based on analysis of ${sources.length} sources regarding ${query}:\n\n`;

    topFragments.forEach((fragment, idx) => {
      text += `${fragment.text}`;
      if (fragment.citationNumber) {
        text += ` [${fragment.citationNumber}]`;
      }
      text += '\n\n';
    });

    if (nodes.length > 0) {
      const topEntities = nodes.slice(0, 3).map(n => n.entity_name);
      text += `Key entities: ${topEntities.join(', ')}.\n\n`;
    }

    text += `This synthesis is based on ${sources.length} sources with an average reliability score of ${(sources.reduce((sum, s) => sum + s.source.reliability_score, 0) / sources.length).toFixed(1)}%.`;

    const endTime = performance.now();

    return {
      text,
      templateId: 'fallback',
      styleUsed: 'neutral',
      sourceNodes: nodes.map(n => n.id),
      sourcePages: sources.map(p => p.id),
      confidenceScore: this.calculateConfidenceScore(sources, fragments),
      coherenceScore: 65,
      citationCount: topFragments.length,
      generationTimeMs: Math.round(endTime - startTime),
      metadata: { template: 'fallback' }
    };
  }
}

export const mechanicalSynthesisEngine = new MechanicalSynthesisEngine();
