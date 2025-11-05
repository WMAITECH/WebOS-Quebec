interface KnowledgeNode {
  id: string;
  entity_type: string;
  entity_name: string;
  aliases: string[];
  confidence_score: number;
  importance_score: number;
  attributes: Record<string, any>;
}

interface KnowledgeEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: string;
  confidence_score: number;
  strength: number;
}

interface Pattern {
  pattern_type: string;
  pattern_description: string;
  pattern_data: Record<string, any>;
  confidence_score: number;
}

interface LearningResult {
  newNodes: KnowledgeNode[];
  newEdges: KnowledgeEdge[];
  patterns: Pattern[];
  insights: string[];
}

interface TemporalPattern {
  trend: 'increasing' | 'decreasing' | 'stable' | 'cyclical';
  confidence: number;
  timeframe: string;
  dataPoints: Array<{ timestamp: Date; value: number }>;
}

interface ConceptCluster {
  centroid: string;
  members: string[];
  cohesion: number;
  size: number;
}

class AdvancedNLPEngine {
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

  private entityPatterns = {
    person: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g,
    organization: /\b([A-Z][a-z]+(?:\s+(?:of|for|and)\s+)?(?:[A-Z][a-z]+\s*){1,4}(?:Inc|Corp|Ltd|LLC|Organization|Association|Foundation|Institute))\b/g,
    location: /\b(?:in|at|from|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g,
    date: /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/gi,
    technology: /\b([A-Z][a-z]*(?:[A-Z][a-z]*)+|[A-Z]{2,})\b/g
  };

  private relationshipIndicators = {
    'caused_by': ['because', 'due to', 'resulted from', 'caused by', 'triggered by'],
    'leads_to': ['leads to', 'results in', 'causes', 'produces', 'generates'],
    'related_to': ['related to', 'associated with', 'connected to', 'linked to'],
    'part_of': ['part of', 'component of', 'member of', 'belongs to', 'within'],
    'located_in': ['in', 'at', 'located in', 'based in', 'from'],
    'works_for': ['works for', 'employed by', 'CEO of', 'director of', 'founder of']
  };

  private knowledgeMemory = new Map<string, KnowledgeNode>();
  private conceptVectors = new Map<string, number[]>();

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
      'ing', 'tion', 'sion', 'able', 'ible', 'ness', 'less', 'ful', 'ly', 'ize', 'ise'
    ];

    for (const suffix of suffixes) {
      if (word.endsWith(suffix) && word.length > suffix.length + 3) {
        return word.slice(0, -suffix.length);
      }
    }
    return word;
  }

  extractEntities(text: string, existingNodes: KnowledgeNode[] = []): KnowledgeNode[] {
    const entities: KnowledgeNode[] = [];
    const seenEntities = new Set<string>();

    Object.entries(this.entityPatterns).forEach(([entityType, pattern]) => {
      const matches = [...text.matchAll(pattern)];

      matches.forEach(match => {
        const entityName = match[1].trim();
        if (entityName.length < 3 || seenEntities.has(entityName.toLowerCase())) return;

        seenEntities.add(entityName.toLowerCase());

        const existingNode = existingNodes.find(
          n => n.entity_name.toLowerCase() === entityName.toLowerCase()
        );

        if (existingNode) {
          existingNode.confidence_score = Math.min(100, existingNode.confidence_score + 5);
          entities.push(existingNode);
        } else {
          const newNode: KnowledgeNode = {
            id: crypto.randomUUID(),
            entity_type: entityType,
            entity_name: entityName,
            aliases: [],
            confidence_score: 60,
            importance_score: 50,
            attributes: { first_mention: new Date().toISOString() }
          };

          entities.push(newNode);
          this.knowledgeMemory.set(entityName.toLowerCase(), newNode);
        }
      });
    });

    return entities;
  }

  detectRelationships(
    text: string,
    entities: KnowledgeNode[]
  ): KnowledgeEdge[] {
    const edges: KnowledgeEdge[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);

    sentences.forEach(sentence => {
      const entitiesInSentence = entities.filter(entity =>
        sentence.toLowerCase().includes(entity.entity_name.toLowerCase())
      );

      if (entitiesInSentence.length < 2) return;

      Object.entries(this.relationshipIndicators).forEach(([relType, indicators]) => {
        indicators.forEach(indicator => {
          if (sentence.toLowerCase().includes(indicator)) {
            for (let i = 0; i < entitiesInSentence.length - 1; i++) {
              for (let j = i + 1; j < entitiesInSentence.length; j++) {
                const source = entitiesInSentence[i];
                const target = entitiesInSentence[j];

                edges.push({
                  id: crypto.randomUUID(),
                  source_node_id: source.id,
                  target_node_id: target.id,
                  relationship_type: relType,
                  confidence_score: 70,
                  strength: 60
                });
              }
            }
          }
        });
      });
    });

    return edges;
  }

  detectTemporalPatterns(
    data: Array<{ timestamp: string; value: any }>
  ): TemporalPattern | null {
    if (data.length < 3) return null;

    const sortedData = data
      .map(d => ({ timestamp: new Date(d.timestamp), value: Number(d.value) || 0 }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const values = sortedData.map(d => d.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    let trendDirection: 'increasing' | 'decreasing' | 'stable' | 'cyclical' = 'stable';
    let confidence = 0;

    const linearRegression = this.calculateLinearRegression(
      sortedData.map((d, i) => i),
      values
    );

    if (Math.abs(linearRegression.slope) > stdDev * 0.1) {
      trendDirection = linearRegression.slope > 0 ? 'increasing' : 'decreasing';
      confidence = Math.min(95, Math.abs(linearRegression.r2) * 100);
    } else {
      confidence = 70;
    }

    const cyclicalPattern = this.detectCyclicalPattern(values);
    if (cyclicalPattern.isCyclical) {
      trendDirection = 'cyclical';
      confidence = cyclicalPattern.confidence;
    }

    return {
      trend: trendDirection,
      confidence,
      timeframe: this.calculateTimeframe(sortedData[0].timestamp, sortedData[sortedData.length - 1].timestamp),
      dataPoints: sortedData
    };
  }

  private calculateLinearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const yMean = sumY / n;
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssResidual = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
    const r2 = 1 - (ssResidual / ssTotal);

    return { slope, intercept, r2 };
  }

  private detectCyclicalPattern(values: number[]): { isCyclical: boolean; confidence: number } {
    if (values.length < 6) return { isCyclical: false, confidence: 0 };

    const autocorrelations: number[] = [];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;

    for (let lag = 1; lag <= Math.floor(values.length / 2); lag++) {
      let numerator = 0;
      let denominator = 0;

      for (let i = 0; i < values.length - lag; i++) {
        numerator += (values[i] - mean) * (values[i + lag] - mean);
      }

      for (let i = 0; i < values.length; i++) {
        denominator += Math.pow(values[i] - mean, 2);
      }

      autocorrelations.push(numerator / denominator);
    }

    const maxAutocorr = Math.max(...autocorrelations.slice(1));
    const isCyclical = maxAutocorr > 0.5;
    const confidence = isCyclical ? Math.min(95, maxAutocorr * 100) : 0;

    return { isCyclical, confidence };
  }

  private calculateTimeframe(start: Date, end: Date): string {
    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 7) return 'weekly';
    if (diffDays < 60) return 'monthly';
    if (diffDays < 365) return 'quarterly';
    return 'yearly';
  }

  clusterConcepts(concepts: string[], minClusterSize: number = 3): ConceptCluster[] {
    const clusters: ConceptCluster[] = [];
    const processed = new Set<string>();

    concepts.forEach(concept => {
      if (processed.has(concept)) return;

      const similarConcepts = concepts.filter(other => {
        if (concept === other || processed.has(other)) return false;
        return this.calculateStringSimilarity(concept, other) > 0.6;
      });

      if (similarConcepts.length >= minClusterSize - 1) {
        const clusterMembers = [concept, ...similarConcepts];
        clusterMembers.forEach(c => processed.add(c));

        const cohesion = this.calculateClusterCohesion(clusterMembers);

        clusters.push({
          centroid: concept,
          members: clusterMembers,
          cohesion,
          size: clusterMembers.length
        });
      }
    });

    return clusters.sort((a, b) => b.size - a.size);
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
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

  private calculateClusterCohesion(concepts: string[]): number {
    if (concepts.length < 2) return 100;

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < concepts.length - 1; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        totalSimilarity += this.calculateStringSimilarity(concepts[i], concepts[j]);
        comparisons++;
      }
    }

    return (totalSimilarity / comparisons) * 100;
  }

  async learnFromDocuments(
    documents: Array<{ content: string; source: string; timestamp?: string }>
  ): Promise<LearningResult> {
    const allNodes: KnowledgeNode[] = [];
    const allEdges: KnowledgeEdge[] = [];
    const patterns: Pattern[] = [];
    const insights: string[] = [];

    const allConcepts: string[] = [];

    documents.forEach(doc => {
      const entities = this.extractEntities(doc.content, allNodes);
      allNodes.push(...entities);

      const relationships = this.detectRelationships(doc.content, entities);
      allEdges.push(...relationships);

      const tokens = this.tokenize(doc.content);
      const stemmed = tokens.map(t => this.stem(t));
      allConcepts.push(...stemmed);
    });

    const conceptClusters = this.clusterConcepts(allConcepts, 3);
    conceptClusters.forEach(cluster => {
      patterns.push({
        pattern_type: 'statistical',
        pattern_description: `Concept cluster: ${cluster.centroid}`,
        pattern_data: { members: cluster.members, cohesion: cluster.cohesion },
        confidence_score: cluster.cohesion
      });
    });

    if (documents.some(d => d.timestamp)) {
      const temporalData = documents
        .filter(d => d.timestamp)
        .map(d => ({ timestamp: d.timestamp!, value: d.content.length }));

      const temporalPattern = this.detectTemporalPatterns(temporalData);
      if (temporalPattern) {
        patterns.push({
          pattern_type: 'temporal',
          pattern_description: `${temporalPattern.trend} trend detected`,
          pattern_data: temporalPattern,
          confidence_score: temporalPattern.confidence
        });

        insights.push(`Data shows a ${temporalPattern.trend} trend with ${temporalPattern.confidence.toFixed(1)}% confidence`);
      }
    }

    const entityFrequency = new Map<string, number>();
    allNodes.forEach(node => {
      entityFrequency.set(node.entity_name, (entityFrequency.get(node.entity_name) || 0) + 1);
    });

    const topEntities = Array.from(entityFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (topEntities.length > 0) {
      insights.push(`Most mentioned entities: ${topEntities.map(e => e[0]).join(', ')}`);
    }

    const uniqueRelationshipTypes = new Set(allEdges.map(e => e.relationship_type));
    if (uniqueRelationshipTypes.size > 0) {
      insights.push(`Detected ${uniqueRelationshipTypes.size} types of relationships between entities`);
    }

    return {
      newNodes: this.deduplicateNodes(allNodes),
      newEdges: this.deduplicateEdges(allEdges),
      patterns,
      insights
    };
  }

  private deduplicateNodes(nodes: KnowledgeNode[]): KnowledgeNode[] {
    const uniqueMap = new Map<string, KnowledgeNode>();

    nodes.forEach(node => {
      const key = node.entity_name.toLowerCase();
      const existing = uniqueMap.get(key);

      if (existing) {
        existing.confidence_score = Math.min(100, existing.confidence_score + 5);
        if (!existing.aliases.includes(node.entity_name)) {
          existing.aliases.push(node.entity_name);
        }
      } else {
        uniqueMap.set(key, node);
      }
    });

    return Array.from(uniqueMap.values());
  }

  private deduplicateEdges(edges: KnowledgeEdge[]): KnowledgeEdge[] {
    const uniqueMap = new Map<string, KnowledgeEdge>();

    edges.forEach(edge => {
      const key = `${edge.source_node_id}-${edge.relationship_type}-${edge.target_node_id}`;
      const existing = uniqueMap.get(key);

      if (existing) {
        existing.confidence_score = Math.min(100, existing.confidence_score + 5);
        existing.strength = Math.min(100, existing.strength + 5);
      } else {
        uniqueMap.set(key, edge);
      }
    });

    return Array.from(uniqueMap.values());
  }

  calculateImportanceScore(
    node: KnowledgeNode,
    edges: KnowledgeEdge[],
    allNodes: KnowledgeNode[]
  ): number {
    const connectionCount = edges.filter(
      e => e.source_node_id === node.id || e.target_node_id === node.id
    ).length;

    const maxConnections = Math.max(...allNodes.map(n =>
      edges.filter(e => e.source_node_id === n.id || e.target_node_id === n.id).length
    ));

    const normalizedConnections = maxConnections > 0 ? (connectionCount / maxConnections) * 100 : 0;

    const mentionWeight = Math.min(50, (node.confidence_score / 100) * 50);

    return Math.min(100, normalizedConnections * 0.7 + mentionWeight * 0.3);
  }
}

export const advancedNLPEngine = new AdvancedNLPEngine();
