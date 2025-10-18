/**
 * Performance Monitoring Service
 * 
 * Implements performance monitoring for API calls and component rendering,
 * caching strategies, and performance metrics collection.
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface APICallMetrics {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  size?: number;
  cached?: boolean;
  retryCount?: number;
}

export interface ComponentRenderMetrics {
  componentName: string;
  renderDuration: number;
  propsSize: number;
  childrenCount: number;
  reRenderCount: number;
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  evictionCount: number;
  totalSize: number;
  entryCount: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private apiCallMetrics: APICallMetrics[] = [];
  private componentMetrics: ComponentRenderMetrics[] = [];
  private cacheMetrics: Map<string, CacheMetrics> = new Map();
  private performanceObserver?: PerformanceObserver;

  constructor() {
    this.initializePerformanceObserver();
  }

  private initializePerformanceObserver(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.recordMetric({
            name: `performance.${entry.entryType}.${entry.name}`,
            value: entry.duration,
            unit: 'ms',
            timestamp: new Date(entry.startTime),
            tags: {
              entryType: entry.entryType,
              name: entry.name
            }
          });
        });
      });

      try {
        this.performanceObserver.observe({ 
          entryTypes: ['measure', 'navigation', 'resource'] 
        });
      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }
    }
  }

  /**
   * Record a custom performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Start timing an operation
   */
  startTiming(name: string): () => number {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name: `timing.${name}`,
        value: duration,
        unit: 'ms',
        timestamp: new Date()
      });
      return duration;
    };
  }

  /**
   * Measure API call performance
   */
  async measureAPICall<T>(
    endpoint: string,
    method: string,
    apiCall: () => Promise<T>,
    options: { 
      expectedSize?: number;
      cacheKey?: string;
      retryCount?: number;
    } = {}
  ): Promise<T> {
    const startTime = performance.now();
    let status = 0;
    let cached = false;
    
    try {
      const result = await apiCall();
      status = 200; // Assume success if no error thrown
      
      const duration = performance.now() - startTime;
      
      // Estimate response size if not provided
      const size = options.expectedSize || this.estimateObjectSize(result);
      
      this.apiCallMetrics.push({
        endpoint,
        method,
        duration,
        status,
        size,
        cached,
        retryCount: options.retryCount || 0
      });

      this.recordMetric({
        name: 'api.call.duration',
        value: duration,
        unit: 'ms',
        timestamp: new Date(),
        tags: {
          endpoint,
          method,
          status: status.toString(),
          cached: cached.toString()
        }
      });

      if (size) {
        this.recordMetric({
          name: 'api.response.size',
          value: size,
          unit: 'bytes',
          timestamp: new Date(),
          tags: { endpoint, method }
        });
      }

      return result;
    } catch (error) {
      status = error instanceof Error && 'status' in error ? 
        (error as any).status : 500;
      
      const duration = performance.now() - startTime;
      
      this.apiCallMetrics.push({
        endpoint,
        method,
        duration,
        status,
        retryCount: options.retryCount || 0
      });

      this.recordMetric({
        name: 'api.call.error',
        value: 1,
        unit: 'count',
        timestamp: new Date(),
        tags: {
          endpoint,
          method,
          status: status.toString(),
          errorType: error instanceof Error ? error.constructor.name : 'Unknown'
        }
      });

      throw error;
    }
  }

  /**
   * Measure component render performance
   */
  measureComponentRender(
    componentName: string,
    renderFunction: () => any,
    props?: any
  ): any {
    const startTime = performance.now();
    
    try {
      const result = renderFunction();
      const duration = performance.now() - startTime;
      
      const propsSize = props ? this.estimateObjectSize(props) : 0;
      const childrenCount = this.countChildren(result);
      
      // Get existing metrics for this component to track re-renders
      const existingMetrics = this.componentMetrics.filter(m => 
        m.componentName === componentName
      );
      const reRenderCount = existingMetrics.length + 1;
      
      const metrics: ComponentRenderMetrics = {
        componentName,
        renderDuration: duration,
        propsSize,
        childrenCount,
        reRenderCount
      };
      
      this.componentMetrics.push(metrics);
      
      this.recordMetric({
        name: 'component.render.duration',
        value: duration,
        unit: 'ms',
        timestamp: new Date(),
        tags: {
          component: componentName,
          reRenderCount: reRenderCount.toString()
        }
      });

      if (propsSize > 0) {
        this.recordMetric({
          name: 'component.props.size',
          value: propsSize,
          unit: 'bytes',
          timestamp: new Date(),
          tags: { component: componentName }
        });
      }

      return result;
    } catch (error) {
      this.recordMetric({
        name: 'component.render.error',
        value: 1,
        unit: 'count',
        timestamp: new Date(),
        tags: {
          component: componentName,
          errorType: error instanceof Error ? error.constructor.name : 'Unknown'
        }
      });
      throw error;
    }
  }

  /**
   * Update cache metrics
   */
  updateCacheMetrics(cacheName: string, metrics: Partial<CacheMetrics>): void {
    const existing = this.cacheMetrics.get(cacheName) || {
      hitRate: 0,
      missRate: 0,
      evictionCount: 0,
      totalSize: 0,
      entryCount: 0
    };

    const updated = { ...existing, ...metrics };
    this.cacheMetrics.set(cacheName, updated);

    // Record individual cache metrics
    Object.entries(updated).forEach(([key, value]) => {
      this.recordMetric({
        name: `cache.${key}`,
        value,
        unit: key.includes('Rate') ? 'percentage' : 
              key.includes('Size') ? 'bytes' : 'count',
        timestamp: new Date(),
        tags: { cache: cacheName }
      });
    });
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(timeWindow?: number): {
    apiCalls: {
      averageDuration: number;
      errorRate: number;
      totalCalls: number;
      slowestEndpoints: Array<{ endpoint: string; avgDuration: number }>;
    };
    components: {
      slowestComponents: Array<{ name: string; avgDuration: number }>;
      mostReRendered: Array<{ name: string; reRenderCount: number }>;
    };
    cache: {
      overallHitRate: number;
      totalSize: number;
      cachesByPerformance: Array<{ name: string; hitRate: number }>;
    };
    memory: {
      estimatedUsage: number;
      metricsCount: number;
    };
  } {
    const cutoffTime = timeWindow ? 
      new Date(Date.now() - timeWindow) : 
      new Date(0);

    // Filter metrics by time window
    const recentApiCalls = this.apiCallMetrics.filter(m => 
      new Date() >= cutoffTime
    );
    const recentComponentMetrics = this.componentMetrics.filter(m => 
      new Date() >= cutoffTime
    );

    // API call analysis
    const totalApiCalls = recentApiCalls.length;
    const averageDuration = totalApiCalls > 0 ? 
      recentApiCalls.reduce((sum, m) => sum + m.duration, 0) / totalApiCalls : 0;
    const errorCount = recentApiCalls.filter(m => m.status >= 400).length;
    const errorRate = totalApiCalls > 0 ? (errorCount / totalApiCalls) * 100 : 0;

    // Group by endpoint for slowest analysis
    const endpointGroups = recentApiCalls.reduce((groups, call) => {
      if (!groups[call.endpoint]) {
        groups[call.endpoint] = [];
      }
      groups[call.endpoint].push(call);
      return groups;
    }, {} as Record<string, APICallMetrics[]>);

    const slowestEndpoints = Object.entries(endpointGroups)
      .map(([endpoint, calls]) => ({
        endpoint,
        avgDuration: calls.reduce((sum, c) => sum + c.duration, 0) / calls.length
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 5);

    // Component analysis
    const componentGroups = recentComponentMetrics.reduce((groups, metric) => {
      if (!groups[metric.componentName]) {
        groups[metric.componentName] = [];
      }
      groups[metric.componentName].push(metric);
      return groups;
    }, {} as Record<string, ComponentRenderMetrics[]>);

    const slowestComponents = Object.entries(componentGroups)
      .map(([name, metrics]) => ({
        name,
        avgDuration: metrics.reduce((sum, m) => sum + m.renderDuration, 0) / metrics.length
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 5);

    const mostReRendered = Object.entries(componentGroups)
      .map(([name, metrics]) => ({
        name,
        reRenderCount: Math.max(...metrics.map(m => m.reRenderCount))
      }))
      .sort((a, b) => b.reRenderCount - a.reRenderCount)
      .slice(0, 5);

    // Cache analysis
    const cacheEntries = Array.from(this.cacheMetrics.entries());
    const overallHitRate = cacheEntries.length > 0 ?
      cacheEntries.reduce((sum, [, metrics]) => sum + metrics.hitRate, 0) / cacheEntries.length : 0;
    const totalCacheSize = cacheEntries.reduce((sum, [, metrics]) => sum + metrics.totalSize, 0);

    const cachesByPerformance = cacheEntries
      .map(([name, metrics]) => ({ name, hitRate: metrics.hitRate }))
      .sort((a, b) => b.hitRate - a.hitRate);

    // Memory usage estimation
    const estimatedUsage = this.estimateObjectSize({
      metrics: this.metrics,
      apiCallMetrics: this.apiCallMetrics,
      componentMetrics: this.componentMetrics,
      cacheMetrics: this.cacheMetrics
    });

    return {
      apiCalls: {
        averageDuration,
        errorRate,
        totalCalls: totalApiCalls,
        slowestEndpoints
      },
      components: {
        slowestComponents,
        mostReRendered
      },
      cache: {
        overallHitRate,
        totalSize: totalCacheSize,
        cachesByPerformance
      },
      memory: {
        estimatedUsage,
        metricsCount: this.metrics.length
      }
    };
  }

  /**
   * Get metrics for external reporting
   */
  getMetricsForReporting(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear old metrics to free memory
   */
  clearOldMetrics(olderThan: Date): void {
    this.metrics = this.metrics.filter(m => m.timestamp >= olderThan);
    this.apiCallMetrics = this.apiCallMetrics.filter(m => 
      new Date() >= olderThan // Assuming current time for API calls
    );
    this.componentMetrics = this.componentMetrics.filter(m => 
      new Date() >= olderThan // Assuming current time for component renders
    );
  }

  /**
   * Estimate object size in bytes (rough approximation)
   */
  private estimateObjectSize(obj: any): number {
    if (obj === null || obj === undefined) return 0;
    
    if (typeof obj === 'string') return obj.length * 2; // UTF-16
    if (typeof obj === 'number') return 8;
    if (typeof obj === 'boolean') return 4;
    if (obj instanceof Date) return 8;
    
    if (Array.isArray(obj)) {
      return obj.reduce((size, item) => size + this.estimateObjectSize(item), 0);
    }
    
    if (typeof obj === 'object') {
      return Object.entries(obj).reduce((size, [key, value]) => 
        size + key.length * 2 + this.estimateObjectSize(value), 0
      );
    }
    
    return 0;
  }

  /**
   * Count children in a component result (rough approximation)
   */
  private countChildren(result: any): number {
    if (!result) return 0;
    if (Array.isArray(result)) return result.length;
    if (typeof result === 'object' && result.children) {
      return Array.isArray(result.children) ? result.children.length : 1;
    }
    return 0;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    this.metrics = [];
    this.apiCallMetrics = [];
    this.componentMetrics = [];
    this.cacheMetrics.clear();
  }
}

// Singleton instance
let performanceMonitorInstance: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor();
  }
  return performanceMonitorInstance;
}

export function initializePerformanceMonitoring(): PerformanceMonitor {
  performanceMonitorInstance = new PerformanceMonitor();
  return performanceMonitorInstance;
}

/**
 * Decorator for measuring function performance
 */
export function measurePerformance(metricName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const monitor = getPerformanceMonitor();
      const endTiming = monitor.startTiming(`${target.constructor.name}.${propertyKey}`);
      
      try {
        const result = await originalMethod.apply(this, args);
        endTiming();
        return result;
      } catch (error) {
        endTiming();
        monitor.recordMetric({
          name: `${metricName}.error`,
          value: 1,
          unit: 'count',
          timestamp: new Date(),
          tags: {
            method: propertyKey,
            class: target.constructor.name
          }
        });
        throw error;
      }
    };
    
    return descriptor;
  };
}