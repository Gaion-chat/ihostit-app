import SyncService from './syncService';

export class SchedulerService {
  private syncService: SyncService;
  private intervalId: number | null = null;

  constructor() {
    this.syncService = new SyncService();
  }

  /**
   * Start the daily sync scheduler
   * Runs every day at 2:00 AM
   */
  public startDailySync(): void {
    if (this.intervalId !== null) {
      console.log('⚠️ Daily sync scheduler is already running');
      return;
    }

    // Run once on start if due
    (async () => {
      if (this.syncService.shouldSync(24)) {
        try {
          const result = await this.syncService.syncFromGitHub();
          if (result.success) {
            console.log('✅ Daily sync (initial) completed:', result.stats);
          }
        } catch (e) {
          console.error('❌ Daily sync (initial) error:', e);
        }
      }
    })();

    // Then check every hour to see if 24h elapsed
    this.intervalId = window.setInterval(async () => {
      console.log('🕐 Daily sync started at:', new Date().toISOString());
      
      try {
        if (this.syncService.shouldSync(24)) {
          const result = await this.syncService.syncFromGitHub();
          
          if (result.success) {
            console.log('✅ Daily sync completed successfully:', result.stats);
          } else {
            console.error('❌ Daily sync failed:', result.message);
          }
        } else {
          console.log('⏭️ Skipping daily sync - recent sync found');
        }
      } catch (error) {
        console.error('❌ Daily sync error:', error);
      }
    }, 60 * 60 * 1000);

    console.log('📅 Daily sync scheduler started (runs at 2:00 AM UTC)');
  }

  /**
   * Start a more frequent sync for development/testing
   * Runs every hour
   */
  public startHourlySync(): void {
    if (this.intervalId !== null) {
      console.log('⚠️ Sync scheduler is already running');
      return;
    }

    // Schedule to run every hour
    this.intervalId = window.setInterval(async () => {
      console.log('🕐 Hourly sync started at:', new Date().toISOString());
      
      try {
        // Only sync if it's been more than 1 hour since last sync
        if (this.syncService.shouldSync(1)) {
          const result = await this.syncService.syncFromGitHub();
          
          if (result.success) {
            console.log('✅ Hourly sync completed successfully:', result.stats);
          } else {
            console.error('❌ Hourly sync failed:', result.message);
          }
        } else {
          console.log('⏭️ Skipping hourly sync - recent sync found');
        }
      } catch (error) {
        console.error('❌ Hourly sync error:', error);
      }
    }, 60 * 60 * 1000);

    console.log('📅 Hourly sync scheduler started');
  }

  /**
   * Stop the scheduled sync
   */
  public stopScheduledSync(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Scheduled sync stopped');
    } else {
      console.log('⚠️ No scheduled sync to stop');
    }
  }

  /**
   * Check if scheduler is running
   */
  public isRunning(): boolean {
    return this.intervalId !== null;
  }

  /**
   * Get scheduler status
   */
  public getStatus(): { running: boolean; lastSync?: any } {
    return {
      running: this.isRunning(),
      lastSync: this.syncService.getLastSyncInfo()
    };
  }

  /**
   * Manually trigger a sync
   */
  public async manualSync(): Promise<{ success: boolean; message: string; stats?: any }> {
    console.log('🔄 Manual sync triggered');
    return await this.syncService.forcSync();
  }
}

export default SchedulerService;
