import { QueryMetric } from './query-analyzer';

/**
 * Detector de padrões N+1
 * Analisa métricas de query para identificar:
 * - Múltiplas queries do mesmo modelo em rápida sucessão
 * - Mesma query executada N vezes (indicativo de N+1)
 * - Queries que deveriam usar include/select
 */

export interface N1Pattern {
  model: string;
  action: string;
  count: number;
  totalDuration: number;
  avgDuration: number;
  queries: QueryMetric[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

export interface N1Detection {
  detected: boolean;
  patterns: N1Pattern[];
  totalQueriesToFix: number;
  estimatedImprovement: string;
}

export class N1Detector {
  /**
   * Detecta padrões N+1 em um conjunto de métricas
   * @param metrics - Array de QueryMetric da execução
   * @param timeWindowMs - Janela de tempo para agrupar queries (padrão: 100ms)
   * @returns Análise de padrões N+1 detectados
   */
  static detect(
    metrics: QueryMetric[],
    timeWindowMs = 100
  ): N1Detection {
    const patterns: N1Pattern[] = [];

    // Agrupar queries por modelo+ação
    const grouped = new Map<string, QueryMetric[]>();
    for (const metric of metrics) {
      const key = `${metric.model}:${metric.action}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(metric);
    }

    // Analisar cada grupo
    for (const [key, queries] of grouped.entries()) {
      const [model, action] = key.split(':');
      
      if (queries.length < 2) continue; // Não é N+1 se houver apenas 1 query

      // Verificar se estão muito próximas (indicativo de N+1)
      let clustered = 0;
      for (let i = 1; i < queries.length; i++) {
        const timeDiff = Math.abs(
          queries[i].timestamp.getTime() - queries[i - 1].timestamp.getTime()
        );
        if (timeDiff <= timeWindowMs) clustered++;
      }

      // Se 50%+ das queries estão próximas, é provável N+1
      if (clustered >= queries.length * 0.5 || queries.length >= 10) {
        const totalDuration = queries.reduce((s, q) => s + q.duration, 0);
        const avgDuration = totalDuration / queries.length;
        
        const severity = this.calculateSeverity(queries.length, totalDuration);
        const recommendation = this.getRecommendation(model, action, queries.length);

        patterns.push({
          model,
          action,
          count: queries.length,
          totalDuration,
          avgDuration,
          queries,
          severity,
          recommendation,
        });
      }
    }

    // Ordenar por severidade
    patterns.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    return {
      detected: patterns.length > 0,
      patterns,
      totalQueriesToFix: patterns.reduce((s, p) => s + p.count, 0),
      estimatedImprovement: this.estimateImprovement(patterns),
    };
  }

  private static calculateSeverity(
    count: number,
    totalDuration: number
  ): N1Pattern['severity'] {
    if (count > 50 || totalDuration > 5000) return 'critical';
    if (count > 20 || totalDuration > 2000) return 'high';
    if (count > 10 || totalDuration > 500) return 'medium';
    return 'low';
  }

  private static getRecommendation(
    model: string,
    action: string,
    count: number
  ): string {
    if (action === 'findMany') {
      return `Use 'include' ou 'select' para carregar relacionamentos. Evite queries em loop. (${count} queries)`;
    }
    if (action === 'findUnique') {
      return `Combine múltiplas findUnique em um findMany com array de IDs. (${count} queries)`;
    }
    if (action === 'count') {
      return `Agregue counts em uma única query com 'groupBy' ou 'include'. (${count} queries)`;
    }
    return `Revisar padrão de query. Possível N+1 pattern com ${count} execuções.`;
  }

  private static estimateImprovement(patterns: N1Pattern[]): string {
    if (patterns.length === 0) return 'Sem padrões N+1 detectados';
    
    const criticalCount = patterns.filter(p => p.severity === 'critical').length;
    const highCount = patterns.filter(p => p.severity === 'high').length;
    
    const totalQueries = patterns.reduce((s, p) => s + p.count, 0);
    const totalDuration = patterns.reduce((s, p) => s + p.totalDuration, 0);
    
    const estimated = Math.round((totalDuration / totalQueries) * 0.8); // Estimativa conservadora
    
    let summary = `Detectados ${patterns.length} padrões N+1 (${totalQueries} queries, ${totalDuration.toFixed(0)}ms)`;
    if (criticalCount > 0) summary += ` [${criticalCount} crítico(s)]`;
    if (highCount > 0) summary += ` [${highCount} alto(s)]`;
    
    summary += `. Potencial de melhoria: ${estimated}ms por requisição (80% redução).`;
    
    return summary;
  }

  /**
   * Formata padrões N+1 para relatório legível
   */
  static formatReport(detection: N1Detection): string {
    if (!detection.detected) {
      return '✅ Nenhum padrão N+1 detectado!';
    }

    let report = `⚠️  ${detection.estimatedImprovement}\n\n`;

    for (const pattern of detection.patterns) {
      const icon =
        pattern.severity === 'critical' ? '🔴'
        : pattern.severity === 'high' ? '🟠'
        : pattern.severity === 'medium' ? '🟡'
        : '🟢';

      report += `${icon} ${pattern.model}.${pattern.action} (${pattern.severity})\n`;
      report += `   Execuções: ${pattern.count}\n`;
      report += `   Duração total: ${pattern.totalDuration.toFixed(2)}ms\n`;
      report += `   Média: ${pattern.avgDuration.toFixed(2)}ms\n`;
      report += `   Recomendação: ${pattern.recommendation}\n\n`;
    }

    return report;
  }
}
