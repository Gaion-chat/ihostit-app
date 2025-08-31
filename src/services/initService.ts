import DatabaseService from '@/db';
import SyncService from './syncService';
import SchedulerService from './scheduler';

export class InitService {
  private db: DatabaseService;
  private syncService: SyncService;
  private schedulerService: SchedulerService;
  private initialized: boolean = false;

  constructor() {
    this.db = DatabaseService.getInstance();
    this.syncService = new SyncService();
    this.schedulerService = new SchedulerService();
  }

  /**
   * Initialize the application database and services
   */
  public async initialize(): Promise<{ success: boolean; message: string }> {
    if (this.initialized) {
      return { success: true, message: 'Application already initialized' };
    }

    try {
      console.log('🚀 Initializing ihostit.app...');

      // Check if database needs initial seeding
      const needsSeeding = this.syncService.needsInitialSync();
      
      if (needsSeeding) {
        console.log('📦 Database is empty, performing initial data sync...');
        
        const syncResult = await this.syncService.syncFromGitHub();
        
        if (!syncResult.success) {
          throw new Error(`Initial sync failed: ${syncResult.message}`);
        }
        
        console.log('✅ Initial data sync completed:', syncResult.stats);
      } else {
        console.log('📊 Database already contains data');
        
        // Check if we need to update existing data
        if (this.syncService.shouldSync(24)) {
          console.log('🔄 Performing daily update...');
          const syncResult = await this.syncService.syncFromGitHub();
          
          if (syncResult.success) {
            console.log('✅ Daily update completed:', syncResult.stats);
          } else {
            console.warn('⚠️ Daily update failed, continuing with existing data:', syncResult.message);
          }
        }
      }

      // Start the daily sync scheduler
      this.schedulerService.startDailySync();
      
      // Get final stats
      const stats = this.db.getStats();
      const lastSync = this.syncService.getLastSyncInfo();
      
      this.initialized = true;
      
      const message = `Application initialized successfully with ${stats.totalApps} apps across ${stats.totalCategories} categories`;
      console.log('🎉', message);
      
      if (lastSync) {
        console.log('📅 Last sync:', new Date(lastSync.last_sync).toLocaleString());
      }
      
      return { success: true, message };
      
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      return {
        success: false,
        message: `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Reset the application (clear all data and re-initialize)
   */
  public async reset(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 Resetting application...');
      
      // Stop scheduler
      this.schedulerService.stopScheduledSync();
      
      // Clear all data
      this.db.clearAllData();
      console.log('🗑️ All data cleared');
      
      // Reset initialization flag
      this.initialized = false;
      
      // Re-initialize
      return await this.initialize();
      
    } catch (error) {
      console.error('❌ Reset failed:', error);
      return {
        success: false,
        message: `Reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get application status
   */
  public getStatus(): {
    initialized: boolean;
    stats: { totalApps: number; totalCategories: number };
    lastSync?: any;
    schedulerRunning: boolean;
  } {
    return {
      initialized: this.initialized,
      stats: this.db.getStats(),
      lastSync: this.syncService.getLastSyncInfo(),
      schedulerRunning: this.schedulerService.isRunning()
    };
  }

  /**
   * Force a manual sync
   */
  public async forceSync(): Promise<{ success: boolean; message: string; stats?: any }> {
    return await this.schedulerService.manualSync();
  }

  /**
   * Check if the application is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
}

// Create a singleton instance
const initService = new InitService();

export default initService;
