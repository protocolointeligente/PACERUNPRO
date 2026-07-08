/**
 * Query Performance Analysis Utility
 * Helps identify N+1 patterns, slow queries, and performance bottlenecks
 */

export interface QueryMetric {
  model: string;
  action: string;
  duration: number;
  timestamp: Date;
  count?: number;
}

export default class QueryAnalyzer {
  private metrics: QueryMetric[] = [];
  private modelQueryCounts: Map<string, number> = new Map();
  private slowQueryThreshold: number;

  constructor(slowQueryThresholdMs: number = 1000) {
    this.slowQueryThreshold = slowQueryThresholdMs;
  }

  /**
   * Record a query metric
   */
  recordQuery(metric: QueryMetric) {
    this.metrics.push(metric);

    // Track query counts per model
    const key = `${metric.model}:${metric.action}`;
    this.modelQueryCounts.set(key, (this.modelQueryCounts.get(key) || 0) + 1);
  }

  /**
   * Detect potential N+1 patterns
   * Returns queries made in quick succession on the same model (likely N+1)
   */
  detectN1Patterns(timeWindowMs: number = 100): QueryMetric[][] {
    const patterns: QueryMetric[][] = [];
    const modelsByTime: Map<string, QueryMetric[]> = new Map();

    for (const metric of this.metrics) {
      const key = metric.model;
      if (!modelsByTime.has(key)) {
        modelsByTime.set(key, []);
      }
      modelsByTime.get(key)!.push(metric);
    }

    // Check for sequences of same-model queries within time window
    for (const queries of modelsByTime.values()) {
      for (let i = 0; i < queries.length - 1; i++) {
        const timeDiff = queries[i + 1].timestamp.getTime() - queries[i].timestamp.getTime();
        
        if (timeDiff < timeWindowMs && (queries[i].action === 'findFirst' || queries[i].action === 'findMany')) {
          patterns.push([queries[i], queries[i + 1]]);
        }
      }
    }

    return patterns;
  }

  /**
   * Get slow queries (exceeding threshold)
   */
  getSlowQueries(): QueryMetric[] {
    return this.metrics.filter(m => m.duration > this.slowQueryThreshold);
  }

  /**
   * Get query statistics summary
   */
  getSummary(): {
    totalQueries: number;
    slowQueries: number;
    averageDuration: number;
    maxDuration: number;
    minDuration: number;
    queriesByModel: Record<string, number>;
  } {
    const totalQueries = this.metrics.length;
    const slowQueries = this.getSlowQueries().length;
    const durations = this.metrics.map(m => m.duration);
    
    const queriesByModel: Record<string, number> = {};
    for (const [key, count] of this.modelQueryCounts.entries()) {
      queriesByModel[key] = count;
    }

    return {
      totalQueries,
      slowQueries,
      averageDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      maxDuration: Math.max(...durations, 0),
      minDuration: durations.length > 0 ? Math.min(...durations) : 0,
      queriesByModel,
    };
  }

  /**
   * Clear all recorded metrics
   */
  clear() {
    this.metrics = [];
    this.modelQueryCounts.clear();
  }
}

// Global analyzer instance
let globalAnalyzer: QueryAnalyzer | null = null;

export function getQueryAnalyzer(): QueryAnalyzer {
  if (!globalAnalyzer) {
    globalAnalyzer = new QueryAnalyzer(
      parseInt(process.env.QUERY_SLOW_THRESHOLD || "1000")
    );
  }
  return globalAnalyzer;
}

export function resetQueryAnalyzer() {
  globalAnalyzer = null;
}
