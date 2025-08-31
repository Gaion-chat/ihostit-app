import DatabaseService from '../src/db/database.js';
import { GitHubService } from '../src/services/github.js';
export class ServerSyncService {
    db;
    githubService;
    constructor() {
        this.db = DatabaseService.getInstance();
        this.githubService = new GitHubService();
    }
    async syncFromGitHub() {
        try {
            const syncRecord = this.db.createSyncMetadata({
                sync_status: 'in_progress',
                total_apps: 0,
                total_categories: 0,
            });
            const githubData = await this.githubService.fetchAwesomeSelfHosted();
            if (!githubData || githubData.length === 0) {
                this.db.updateSyncMetadata(syncRecord.id, { sync_status: 'failed' });
                return { success: false, message: 'No data received from GitHub' };
            }
            this.db.clearAllData();
            let totalApps = 0;
            let totalCategories = 0;
            for (const categoryData of githubData) {
                const category = this.db.createCategory({
                    name: categoryData.name,
                    description: categoryData.description || '',
                    app_count: categoryData.apps.length,
                });
                totalCategories++;
                for (const appData of categoryData.apps) {
                    this.db.createApp({
                        name: appData.name,
                        description: appData.description,
                        website: appData.url,
                        source_code: appData.sourceCode,
                        demo: appData.demo,
                        license: appData.license,
                        category_id: category.id,
                        subcategory: appData.subcategory || '',
                    });
                    totalApps++;
                }
            }
            this.db.updateSyncMetadata(syncRecord.id, {
                sync_status: 'completed',
                total_apps: totalApps,
                total_categories: totalCategories,
            });
            const stats = { totalApps, totalCategories, syncTime: new Date().toISOString() };
            return { success: true, message: 'Sync complete', stats };
        }
        catch (error) {
            return {
                success: false,
                message: `Synchronization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    getStats() {
        return this.db.getStats();
    }
    getLastSync() {
        return this.db.getLatestSyncMetadata();
    }
}
export default ServerSyncService;
