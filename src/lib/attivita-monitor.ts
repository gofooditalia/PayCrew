export class AttivitaMonitor {
  private static errorCount = 0;
  private static successCount = 0;
  private static lastAlert: Date | null = null;
  private static readonly ERROR_THRESHOLD = 10;
  private static readonly ALERT_COOLDOWN = 300000; // 5 minuti
  private static totalDuration = 0;
  private static operationCount = 0;

  /**
   * Registra un'operazione riuscita
   */
  static recordSuccess(duration?: number): void {
    this.successCount++;
    if (duration !== undefined) {
      this.totalDuration += duration;
      this.operationCount++;
    }
  }

  /**
   * Registra un errore e verifica se è necessario inviare un alert
   */
  static recordError(): void {
    this.errorCount++;
    
    if (this.shouldSendAlert()) {
      this.sendAlert();
    }
  }

  /**
   * Determina se è necessario inviare un alert basandosi sulla soglia e cooldown
   */
  private static shouldSendAlert(): boolean {
    const now = new Date();
    const cooldownPassed = !this.lastAlert || 
      (now.getTime() - this.lastAlert.getTime()) > this.ALERT_COOLDOWN;
    
    return this.errorCount >= this.ERROR_THRESHOLD && cooldownPassed;
  }

  /**
   * Invia un alert di sistema
   */
  private static sendAlert(): void {
    // In un sistema reale, questo invierebbe a un servizio di monitoraggio
    console.error(`🚨 ALERT: AttivitaLogger error threshold exceeded (${this.errorCount} errors)`);
    console.error(`Stats: ${this.getStats()}`);
    
    this.lastAlert = new Date();
    
    // Reset contatore dopo alert
    setTimeout(() => {
      this.errorCount = 0;
    }, this.ALERT_COOLDOWN);
  }

  /**
   * Restituisce le statistiche correnti
   */
  static getStats(): { 
    errors: number; 
    success: number; 
    rate: number; 
    avgDuration: number;
    totalOperations: number;
    healthStatus: 'HEALTHY' | 'WARNING' | 'UNHEALTHY';
  } {
    const total = this.errorCount + this.successCount;
    const errorRate = total > 0 ? (this.errorCount / total) * 100 : 0;
    const avgDuration = this.operationCount > 0 ? this.totalDuration / this.operationCount : 0;
    
    let healthStatus: 'HEALTHY' | 'WARNING' | 'UNHEALTHY' = 'HEALTHY';
    if (errorRate > 10) {
      healthStatus = 'UNHEALTHY';
    } else if (errorRate > 5) {
      healthStatus = 'WARNING';
    }
    
    return {
      errors: this.errorCount,
      success: this.successCount,
      rate: errorRate,
      avgDuration: Math.round(avgDuration * 100) / 100, // Arrotonda a 2 decimali
      totalOperations: total,
      healthStatus
    };
  }

  /**
   * Resetta tutte le statistiche
   */
  static reset(): void {
    this.errorCount = 0;
    this.successCount = 0;
    this.totalDuration = 0;
    this.operationCount = 0;
    this.lastAlert = null;
  }

  /**
   * Log delle metriche in formato strutturato
   */
  static logMetrics(): void {
    const stats = this.getStats();
    console.log('📊 AttivitaLogger Metrics:', {
      health: stats.healthStatus,
      successRate: `${(100 - stats.rate).toFixed(1)}%`,
      errorRate: `${stats.rate.toFixed(1)}%`,
      avgDuration: `${stats.avgDuration}ms`,
      totalOps: stats.totalOperations
    });
  }
}