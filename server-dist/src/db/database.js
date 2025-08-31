import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
class DatabaseService {
    db;
    static instance;
    constructor() {
        // Create database in the project root
        this.db = new Database(join(process.cwd(), 'ihostit.db'));
        this.initializeDatabase();
    }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    initializeDatabase() {
        try {
            // Read and execute schema
            const __dirnameESM = dirname(fileURLToPath(import.meta.url));
            const schemaPath = join(__dirnameESM, 'schema.sql');
            const schema = readFileSync(schemaPath, 'utf-8');
            this.db.exec(schema);
            console.log('Database initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize database:', error);
            throw error;
        }
    }
    // Category operations
    createCategory(input) {
        const stmt = this.db.prepare(`
      INSERT INTO categories (name, description, app_count)
      VALUES (?, ?, ?)
    `);
        const result = stmt.run(input.name, input.description || null, input.app_count || 0);
        return this.getCategoryById(result.lastInsertRowid);
    }
    getCategoryById(id) {
        const stmt = this.db.prepare('SELECT * FROM categories WHERE id = ?');
        return stmt.get(id);
    }
    getCategoryByName(name) {
        const stmt = this.db.prepare('SELECT * FROM categories WHERE name = ?');
        return stmt.get(name);
    }
    getAllCategories() {
        const stmt = this.db.prepare('SELECT * FROM categories ORDER BY name');
        return stmt.all();
    }
    updateCategory(id, input) {
        const fields = Object.keys(input).filter(key => input[key] !== undefined);
        if (fields.length === 0)
            return this.getCategoryById(id);
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => input[field]);
        const stmt = this.db.prepare(`
      UPDATE categories 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
        stmt.run(...values, id);
        return this.getCategoryById(id);
    }
    deleteCategory(id) {
        const stmt = this.db.prepare('DELETE FROM categories WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
    // App operations
    createApp(input) {
        const stmt = this.db.prepare(`
      INSERT INTO apps (name, description, website, source_code, demo, license, category_id, subcategory)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(input.name, input.description || null, input.website || null, input.source_code || null, input.demo || null, input.license || null, input.category_id || null, input.subcategory || null);
        return this.getAppById(result.lastInsertRowid);
    }
    getAppById(id) {
        const stmt = this.db.prepare('SELECT * FROM apps WHERE id = ?');
        return stmt.get(id);
    }
    getAllApps() {
        const stmt = this.db.prepare('SELECT * FROM apps ORDER BY name');
        return stmt.all();
    }
    getAppsByCategory(categoryId) {
        const stmt = this.db.prepare('SELECT * FROM apps WHERE category_id = ? ORDER BY name');
        return stmt.all(categoryId);
    }
    searchApps(query) {
        const stmt = this.db.prepare(`
      SELECT * FROM apps 
      WHERE name LIKE ? OR description LIKE ?
      ORDER BY name
    `);
        const searchTerm = `%${query}%`;
        return stmt.all(searchTerm, searchTerm);
    }
    updateApp(id, input) {
        const fields = Object.keys(input).filter(key => input[key] !== undefined);
        if (fields.length === 0)
            return this.getAppById(id);
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => input[field]);
        const stmt = this.db.prepare(`
      UPDATE apps 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
        stmt.run(...values, id);
        return this.getAppById(id);
    }
    deleteApp(id) {
        const stmt = this.db.prepare('DELETE FROM apps WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
    // Sync metadata operations
    createSyncMetadata(input) {
        const stmt = this.db.prepare(`
      INSERT INTO sync_metadata (sync_status, total_apps, total_categories)
      VALUES (?, ?, ?)
    `);
        const result = stmt.run(input.sync_status || 'pending', input.total_apps || 0, input.total_categories || 0);
        return this.getSyncMetadataById(result.lastInsertRowid);
    }
    getSyncMetadataById(id) {
        const stmt = this.db.prepare('SELECT * FROM sync_metadata WHERE id = ?');
        return stmt.get(id);
    }
    getLatestSyncMetadata() {
        const stmt = this.db.prepare('SELECT * FROM sync_metadata ORDER BY created_at DESC LIMIT 1');
        return stmt.get();
    }
    updateSyncMetadata(id, input) {
        const fields = Object.keys(input).filter(key => input[key] !== undefined);
        if (fields.length === 0)
            return this.getSyncMetadataById(id);
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => input[field]);
        const stmt = this.db.prepare(`
      UPDATE sync_metadata 
      SET ${setClause} 
      WHERE id = ?
    `);
        stmt.run(...values, id);
        return this.getSyncMetadataById(id);
    }
    // Utility methods
    clearAllData() {
        this.db.exec('DELETE FROM apps');
        this.db.exec('DELETE FROM categories');
        this.db.exec('DELETE FROM sync_metadata');
    }
    getStats() {
        const appsStmt = this.db.prepare('SELECT COUNT(*) as count FROM apps');
        const categoriesStmt = this.db.prepare('SELECT COUNT(*) as count FROM categories');
        const appsResult = appsStmt.get();
        const categoriesResult = categoriesStmt.get();
        return {
            totalApps: appsResult.count,
            totalCategories: categoriesResult.count
        };
    }
    close() {
        this.db.close();
    }
}
export default DatabaseService;
