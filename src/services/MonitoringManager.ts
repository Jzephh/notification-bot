import { MessageMonitorService } from './MessageMonitorService';

/**
 * Global monitoring manager that handles auto-start, auto-restart, and health monitoring
 */
class MonitoringManager {
  private static instance: MonitoringManager | null = null;
  private messageMonitor: MessageMonitorService | null = null;
  private isAutoStarted: boolean = false;
  private autoStartEnabled: boolean = true;
  private companyId: string = '';
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private startTime: number = 0;
  private lastError: string | null = null;
  private lastRestart: string | null = null;
  private restartAttempts: number = 0;
  private maxRestartAttempts: number = 5;
  private restartCooldown: number = 30000; // 30 seconds
  private lastRestartAttempt: number = 0;

  private constructor() {}

  static getInstance(): MonitoringManager {
    if (!MonitoringManager.instance) {
      MonitoringManager.instance = new MonitoringManager();
    }
    return MonitoringManager.instance;
  }

  /**
   * Initialize and auto-start monitoring if enabled
   */
  async initialize(companyId: string): Promise<void> {
    if (this.isAutoStarted) {
      console.log('📡 Monitoring already auto-started');
      return;
    }

    if (!this.autoStartEnabled) {
      console.log('📡 Auto-start disabled, monitoring not started');
      return;
    }

    this.companyId = companyId;
    await this.startMonitoringInternal();
    this.startHealthCheck();
  }

  /**
   * Internal method to start monitoring with error handling
   */
  private async startMonitoringInternal(): Promise<void> {
    try {
      console.log('🚀 Starting message monitoring...');
      this.messageMonitor = new MessageMonitorService(this.companyId);
      await this.messageMonitor.start();
      this.isAutoStarted = true;
      this.startTime = Date.now();
      this.lastError = null;
      this.restartAttempts = 0;
      console.log('✅ Message monitoring started successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.lastError = errorMessage;
      console.error('❌ Failed to start message monitoring:', error);
      this.isAutoStarted = false;
      throw error;
    }
  }

  /**
   * Get the current message monitor instance
   */
  getMessageMonitor(): MessageMonitorService | null {
    return this.messageMonitor;
  }

  /**
   * Start health check monitoring
   */
  private startHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Check health every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck().catch(console.error);
    }, 30000);

    console.log('🔍 Health check started - monitoring every 30 seconds');
  }

  /**
   * Perform health check and auto-restart if needed
   */
  private async performHealthCheck(): Promise<void> {
    if (!this.messageMonitor) {
      console.log('⚠️ No message monitor instance found, attempting restart...');
      await this.attemptRestart();
      return;
    }

    const status = this.messageMonitor.getStatus();
    if (!status.isRunning) {
      console.log('⚠️ Message monitoring is not running, attempting restart...');
      await this.attemptRestart();
    }
  }

  /**
   * Attempt to restart monitoring with cooldown and retry limits
   */
  private async attemptRestart(): Promise<void> {
    const now = Date.now();
    
    // Check cooldown period
    if (now - this.lastRestartAttempt < this.restartCooldown) {
      console.log('⏳ Restart cooldown active, skipping restart attempt');
      return;
    }

    // Check max restart attempts
    if (this.restartAttempts >= this.maxRestartAttempts) {
      console.error('❌ Max restart attempts reached, stopping auto-restart');
      this.lastError = `Max restart attempts (${this.maxRestartAttempts}) reached`;
      return;
    }

    this.lastRestartAttempt = now;
    this.restartAttempts++;

    try {
      console.log(`🔄 Attempting restart #${this.restartAttempts}...`);
      
      // Stop existing monitor if any
      if (this.messageMonitor) {
        this.messageMonitor.stop();
        this.messageMonitor = null;
      }

      // Start fresh
      await this.startMonitoringInternal();
      this.lastRestart = new Date().toISOString();
      console.log('✅ Monitoring restarted successfully');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.lastError = `Restart attempt ${this.restartAttempts} failed: ${errorMessage}`;
      console.error(`❌ Restart attempt ${this.restartAttempts} failed:`, error);
    }
  }

  /**
   * Stop monitoring and health checks
   */
  stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.messageMonitor) {
      this.messageMonitor.stop();
      this.messageMonitor = null;
    }
    
    this.isAutoStarted = false;
    console.log('🛑 Message monitoring and health checks stopped');
  }

  /**
   * Get monitoring status with health information
   */
  getStatus(): {
    isRunning: boolean;
    isAutoStarted: boolean;
    autoStartEnabled: boolean;
    chatExperiences: Array<{ id: string; name: string; appName: string }>;
    experienceCount: number;
    lastError?: string;
    lastRestart?: string;
    uptime?: number;
    restartAttempts: number;
  } {
    const monitorStatus = this.messageMonitor ? this.messageMonitor.getStatus() : {
      isRunning: false,
      chatExperiences: [],
      experienceCount: 0
    };

    const uptime = this.startTime > 0 ? Date.now() - this.startTime : 0;

    return {
      ...monitorStatus,
      isAutoStarted: this.isAutoStarted,
      autoStartEnabled: this.autoStartEnabled,
      lastError: this.lastError || undefined,
      lastRestart: this.lastRestart || undefined,
      uptime: uptime > 0 ? uptime : undefined,
      restartAttempts: this.restartAttempts
    };
  }

  /**
   * Clear message tracking
   */
  async clearMessageTracking(): Promise<void> {
    if (this.messageMonitor) {
      await this.messageMonitor.clearMessageTracking();
    }
  }

  /**
   * Reset restart attempts (useful for manual intervention)
   */
  resetRestartAttempts(): void {
    this.restartAttempts = 0;
    this.lastError = null;
    console.log('🔄 Restart attempts reset');
  }

  /**
   * Force restart monitoring (bypass cooldown and limits)
   */
  async forceRestart(): Promise<void> {
    console.log('🔄 Force restart requested...');
    this.restartAttempts = 0;
    this.lastRestartAttempt = 0;
    await this.attemptRestart();
  }
}

export default MonitoringManager;
