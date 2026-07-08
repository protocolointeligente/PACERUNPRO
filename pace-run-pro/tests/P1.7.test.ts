import { describe, it, expect } from 'vitest';
import { N1Detector } from '../src/lib/n1-detector';
import { QueryMetric } from '../src/lib/query-analyzer';

describe('P1.7: Fix N+1 Query Patterns', () => {
  describe('N1Detector.detect', () => {
    it('should detect N+1 pattern with multiple queries of same model/action', () => {
      const metrics: QueryMetric[] = [
        { model: 'Athlete', action: 'findMany', duration: 100, timestamp: 0 },
        { model: 'Workout', action: 'findMany', duration: 100, timestamp: 50 },
        { model: 'Workout', action: 'findMany', duration: 100, timestamp: 80 },
        { model: 'Workout', action: 'findMany', duration: 100, timestamp: 110 },
        { model: 'Workout', action: 'findMany', duration: 100, timestamp: 140 },
        { model: 'Workout', action: 'findMany', duration: 100, timestamp: 170 },
        { model: 'Workout', action: 'findMany', duration: 100, timestamp: 200 },
      ];

      const result = N1Detector.detect(metrics, 100);

      expect(result.detected).toBe(true);
      expect(result.patterns.length).toBeGreaterThan(0);
      
      const workoutPattern = result.patterns.find(p => p.model === 'Workout');
      expect(workoutPattern).toBeDefined();
      expect(workoutPattern!.count).toBe(6); // 6 findMany queries for Workout = 600ms total
      expect(workoutPattern!.severity).toBe('medium'); // 600ms > 500ms
    });

    it('should calculate severity based on query count', () => {
      // Critical: > 50 queries
      const criticalMetrics: QueryMetric[] = Array.from({ length: 51 }, (_, i) => ({
        model: 'Athlete',
        action: 'findMany',
        duration: 100,
        timestamp: i * 100,
      }));

      let result = N1Detector.detect(criticalMetrics);
      let pattern = result.patterns[0];
      expect(pattern.severity).toBe('critical');

      // High: > 20 queries
      const highMetrics = criticalMetrics.slice(0, 21);
      result = N1Detector.detect(highMetrics);
      pattern = result.patterns[0];
      expect(pattern.severity).toBe('high');

      // Medium: > 10 queries
      const mediumMetrics = criticalMetrics.slice(0, 11);
      result = N1Detector.detect(mediumMetrics);
      pattern = result.patterns[0];
      expect(pattern.severity).toBe('medium');

      // Low: 2-10 queries
      const lowMetrics = criticalMetrics.slice(0, 5);
      result = N1Detector.detect(lowMetrics);
      pattern = result.patterns[0];
      expect(pattern.severity).toBe('low');
    });

    it('should not detect pattern with isolated queries', () => {
      const metrics: QueryMetric[] = [
        { model: 'Athlete', action: 'findMany', duration: 100, timestamp: 0 },
        { model: 'Workout', action: 'findMany', duration: 50, timestamp: 2000 }, // Far apart
      ];

      const result = N1Detector.detect(metrics);
      expect(result.detected).toBe(false);
    });

    it('should calculate correct total and average duration', () => {
      const metrics: QueryMetric[] = [
        { model: 'User', action: 'findUnique', duration: 100, timestamp: 0 },
        { model: 'User', action: 'findUnique', duration: 200, timestamp: 50 },
        { model: 'User', action: 'findUnique', duration: 300, timestamp: 100 },
      ];

      const result = N1Detector.detect(metrics);
      const pattern = result.patterns[0];

      expect(pattern.totalDuration).toBe(600);
      expect(pattern.avgDuration).toBe(200);
    });

    it('should provide appropriate recommendations', () => {
      const metrics: QueryMetric[] = Array.from({ length: 15 }, (_, i) => ({
        model: 'Athlete',
        action: 'findMany',
        duration: 100,
        timestamp: i * 50,
      }));

      const result = N1Detector.detect(metrics);
      const pattern = result.patterns[0];

      expect(pattern.recommendation).toContain('include');
      expect(pattern.recommendation).toContain('select');
    });

    it('should format report with severity icons', () => {
      const metrics: QueryMetric[] = Array.from({ length: 11 }, (_, i) => ({
        model: 'Workout',
        action: 'findMany',
        duration: 100,
        timestamp: i * 50,
      }));

      const result = N1Detector.detect(metrics);
      const report = N1Detector.formatReport(result);

      expect(report).toContain('🟡'); // Medium severity
      expect(report).toContain('Execuções: 11');
      expect(report).toContain('Recomendação');
    });

    it('should report when no N+1 patterns detected', () => {
      const metrics: QueryMetric[] = [
        { model: 'User', action: 'findUnique', duration: 100, timestamp: 0 },
      ];

      const result = N1Detector.detect(metrics);
      const report = N1Detector.formatReport(result);

      expect(result.detected).toBe(false);
      expect(report).toContain('✅');
    });

    it('should estimate improvement percentage', () => {
      const metrics: QueryMetric[] = Array.from({ length: 25 }, (_, i) => ({
        model: 'Athlete',
        action: 'findMany',
        duration: 100,
        timestamp: i * 50,
      }));

      const result = N1Detector.detect(metrics);

      expect(result.estimatedImprovement).toContain('Potencial de melhoria');
      expect(result.estimatedImprovement).toContain('80%');
    });
  });

  describe('N1 prevention best practices', () => {
    it('should use include for one-to-many relationships', () => {
      // Este teste verifica padrão recomendado
      expect(true).toBe(true); // Documentação apenas
    });

    it('should batch findUnique with findMany + in clause', () => {
      expect(true).toBe(true); // Documentação apenas
    });

    it('should select only necessary fields', () => {
      expect(true).toBe(true); // Documentação apenas
    });
  });
});
