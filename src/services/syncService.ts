import DatabaseService from '@/db';
import { GitHubService } from './github';
import * as DbTypes from '../db/types';

export class SyncService {
  private db: DatabaseService;
  private githubService: GitHubService;

  constructor() {
    this.db = DatabaseService.getInstance();
    this.githubService = new GitHubService();
  }

  /**
   * Synchronize data from GitHub to local database
   */
  public async syncFromGitHub(): Promise<{ success: boolean; message: string; stats?: any }> {
    try {
      console.log('Starting data synchronization from GitHub...');
      
      // Create sync metadata record
      const syncRecord = this.db.createSyncMetadata({
        sync_status: 'in_progress',
        total_apps: 0,
        total_categories: 0
      });

      // Fetch data from GitHub
      const githubData = await this.githubService.fetchAwesomeSelfHosted();
      
      if (!githubData || githubData.length === 0) {
        this.db.updateSyncMetadata(syncRecord.id, { sync_status: 'failed' });
        return { success: false, message: 'No data received from GitHub' };
      }

      // Clear existing data
      this.db.clearAllData();
      console.log('Cleared existing data');

      let totalApps = 0;
      let totalCategories = 0;

      // Process each category
      for (const categoryData of githubData) {
        try {
          // Create category
          const categoryInput: DbTypes.CreateCategoryInput = {
            name: categoryData.name,
            description: categoryData.description || '',
            app_count: categoryData.apps.length
          };

          const category = this.db.createCategory(categoryInput);
          totalCategories++;
          console.log(`Created category: ${category.name} with ${categoryData.apps.length} apps`);

          // Process apps in this category
          for (const appData of categoryData.apps) {
            try {
              const appInput: DbTypes.CreateAppInput = {
                name: appData.name,
                description: appData.description,
                website: appData.url,
                source_code: appData.sourceCode,
                demo: appData.demo,
                license: appData.license,
                category_id: category.id,
                subcategory: (appData as any).subcategory || ''
              };

              this.db.createApp(appInput);
              totalApps++;
            } catch (appError) {
              console.error(`Error creating app ${appData.name}:`, appError);
              // Continue with other apps
            }
          }
        } catch (categoryError) {
          console.error(`Error creating category ${categoryData.name}:`, categoryError);
          // Continue with other categories
        }
      }

      // Update sync metadata
      this.db.updateSyncMetadata(syncRecord.id, {
        sync_status: 'completed',
        total_apps: totalApps,
        total_categories: totalCategories
      });

      const stats = {
        totalApps,
        totalCategories,
        syncTime: new Date().toISOString()
      };

      console.log(`Synchronization completed successfully:`, stats);
      return {
        success: true,
        message: `Successfully synced ${totalApps} apps across ${totalCategories} categories`,
        stats
      };

    } catch (error) {
      console.error('Synchronization failed:', error);
      return {
        success: false,
        message: `Synchronization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check if database needs initial seeding
   */
  public needsInitialSync(): boolean {
    const stats = this.db.getStats();
    return stats.totalApps === 0 && stats.totalCategories === 0;
  }

  /**
   * Get last sync information
   */
  public getLastSyncInfo() {
    return this.db.getLatestSyncMetadata();
  }

  /**
   * Check if sync is needed based on time elapsed
   */
  public shouldSync(maxAgeHours: number = 24): boolean {
    const lastSync = this.getLastSyncInfo();
    
    if (!lastSync) {
      return true; // No previous sync
    }

    const lastSyncTime = new Date(lastSync.last_sync);
    const now = new Date();
    const hoursSinceLastSync = (now.getTime() - lastSyncTime.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceLastSync >= maxAgeHours;
  }

  /**
   * Force a manual sync
   */
  public async forcSync(): Promise<{ success: boolean; message: string; stats?: any }> {
    console.log('Force synchronization requested');
    return await this.syncFromGitHub();
  }

  /**
   * Get database statistics
   */
  public getStats() {
    return this.db.getStats();
  }
}

export default SyncService;
