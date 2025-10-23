import { MessageMonitorService } from './MessageMonitorService';

/**
 * Global monitoring manager that handles auto-start and manual control
 */
class MonitoringManager {
  private static instance: MonitoringManager | null = null;
  private messageMonitor: MessageMonitorService | null = null;
  private isAutoStarted: boolean = false;
  private autoStartEnabled: boolean = true;

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

    try {
      console.log('🚀 Auto-starting message monitoring...');
      this.messageMonitor = new MessageMonitorService(companyId);
      await this.messageMonitor.start();
      this.isAutoStarted = true;
      console.log('✅ Message monitoring auto-started successfully');
    } catch (error) {
      console.error('❌ Failed to auto-start message monitoring:', error);
      this.isAutoStarted = false;
    }
  }

  /**
   * Get the current message monitor instance
   */
  getMessageMonitor(): MessageMonitorService | null {
    return this.messageMonitor;
  }

  /**
   * Manually start monitoring (override auto-start)
   */
  async startMonitoring(companyId: string): Promise<void> {
    if (this.messageMonitor && this.messageMonitor.getStatus().isRunning) {
      console.log('⚠️ Monitoring is already running');
      return;
    }

    try {
      this.messageMonitor = new MessageMonitorService(companyId);
      await this.messageMonitor.start();
      this.isAutoStarted = true;
      console.log('✅ Message monitoring started manually');
    } catch (error) {
      console.error('❌ Failed to start monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.messageMonitor) {
      this.messageMonitor.stop();
      this.messageMonitor = null;
      this.isAutoStarted = false;
      console.log('🛑 Message monitoring stopped');
    }
  }

  /**
   * Get monitoring status
   */
  getStatus(): {
    isRunning: boolean;
    isAutoStarted: boolean;
    autoStartEnabled: boolean;
    chatExperiences: Array<{ id: string; name: string; appName: string }>;
    experienceCount: number;
  } {
    const monitorStatus = this.messageMonitor ? this.messageMonitor.getStatus() : {
      isRunning: false,
      chatExperiences: [],
      experienceCount: 0
    };

    return {
      ...monitorStatus,
      isAutoStarted: this.isAutoStarted,
      autoStartEnabled: this.autoStartEnabled
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
   * Enable/disable auto-start
   */
  setAutoStartEnabled(enabled: boolean): void {
    this.autoStartEnabled = enabled;
    console.log(`📡 Auto-start ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if auto-start is enabled
   */
  isAutoStartEnabled(): boolean {
    return this.autoStartEnabled;
  }
}

export default MonitoringManager;
