import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as DbTypes from './types.js';

type Category = DbTypes.Category;
type App = DbTypes.App;
type SyncMetadata = DbTypes.SyncMetadata;
type CreateCategoryInput = DbTypes.CreateCategoryInput;
type CreateAppInput = DbTypes.CreateAppInput;
type CreateSyncMetadataInput = DbTypes.CreateSyncMetadataInput;
type UpdateCategoryInput = DbTypes.UpdateCategoryInput;
type UpdateAppInput = DbTypes.UpdateAppInput;
type UpdateSyncMetadataInput = DbTypes.UpdateSyncMetadataInput;

class DatabaseService {
  private db: Database.Database;
  private static instance: DatabaseService;

  private constructor() {
    // Create database in the project root
    this.db = new Database(join(process.cwd(), 'ihostit.db'));
    this.initializeDatabase();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private initializeDatabase(): void {
    try {
      // Read and execute schema
      const __dirnameESM = dirname(fileURLToPath(import.meta.url));
      const schemaPath = join(__dirnameESM, 'schema.sql');
      const schema = readFileSync(schemaPath, 'utf-8');
      this.db.exec(schema);
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  // Category operations
  public createCategory(input: CreateCategoryInput): Category {
    const stmt = this.db.prepare(`
      INSERT INTO categories (name, description, app_count)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(input.name, input.description || null, input.app_count || 0);
    return this.getCategoryById(result.lastInsertRowid as number)!;
  }

  public getCategoryById(id: number): Category | null {
    const stmt = this.db.prepare('SELECT * FROM categories WHERE id = ?');
    return stmt.get(id) as Category | null;
  }

  public getCategoryByName(name: string): Category | null {
    const stmt = this.db.prepare('SELECT * FROM categories WHERE name = ?');
    return stmt.get(name) as Category | null;
  }

  public getAllCategories(): Category[] {
    const stmt = this.db.prepare('SELECT * FROM categories ORDER BY name');
    return stmt.all() as Category[];
  }

  public updateCategory(id: number, input: UpdateCategoryInput): Category | null {
    const fields = Object.keys(input).filter(key => input[key as keyof UpdateCategoryInput] !== undefined);
    if (fields.length === 0) return this.getCategoryById(id);

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => input[field as keyof UpdateCategoryInput]);
    
    const stmt = this.db.prepare(`
      UPDATE categories 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(...values, id);
    return this.getCategoryById(id);
  }

  public deleteCategory(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM categories WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // App operations
  public createApp(input: CreateAppInput): App {
    const stmt = this.db.prepare(`
      INSERT INTO apps (name, description, website, source_code, demo, license, category_id, subcategory)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      input.name,
      input.description || null,
      input.website || null,
      input.source_code || null,
      input.demo || null,
      input.license || null,
      input.category_id || null,
      input.subcategory || null
    );
    return this.getAppById(result.lastInsertRowid as number)!;
  }

  public getAppById(id: number): App | null {
    const stmt = this.db.prepare('SELECT * FROM apps WHERE id = ?');
    return stmt.get(id) as App | null;
  }

  public getAllApps(): App[] {
    const stmt = this.db.prepare('SELECT * FROM apps ORDER BY name');
    return stmt.all() as App[];
  }

  public getAppsByCategory(categoryId: number): App[] {
    const stmt = this.db.prepare('SELECT * FROM apps WHERE category_id = ? ORDER BY name');
    return stmt.all(categoryId) as App[];
  }

  public searchApps(query: string): App[] {
    const stmt = this.db.prepare(`
      SELECT * FROM apps 
      WHERE name LIKE ? OR description LIKE ?
      ORDER BY name
    `);
    const searchTerm = `%${query}%`;
    return stmt.all(searchTerm, searchTerm) as App[];
  }

  public updateApp(id: number, input: UpdateAppInput): App | null {
    const fields = Object.keys(input).filter(key => input[key as keyof UpdateAppInput] !== undefined);
    if (fields.length === 0) return this.getAppById(id);

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => input[field as keyof UpdateAppInput]);
    
    const stmt = this.db.prepare(`
      UPDATE apps 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(...values, id);
    return this.getAppById(id);
  }

  public deleteApp(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM apps WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Sync metadata operations
  public createSyncMetadata(input: CreateSyncMetadataInput): SyncMetadata {
    const stmt = this.db.prepare(`
      INSERT INTO sync_metadata (sync_status, total_apps, total_categories)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(
      input.sync_status || 'pending',
      input.total_apps || 0,
      input.total_categories || 0
    );
    return this.getSyncMetadataById(result.lastInsertRowid as number)!;
  }

  public getSyncMetadataById(id: number): SyncMetadata | null {
    const stmt = this.db.prepare('SELECT * FROM sync_metadata WHERE id = ?');
    return stmt.get(id) as SyncMetadata | null;
  }

  public getLatestSyncMetadata(): SyncMetadata | null {
    const stmt = this.db.prepare('SELECT * FROM sync_metadata ORDER BY created_at DESC LIMIT 1');
    return stmt.get() as SyncMetadata | null;
  }

  public updateSyncMetadata(id: number, input: UpdateSyncMetadataInput): SyncMetadata | null {
    const fields = Object.keys(input).filter(key => input[key as keyof UpdateSyncMetadataInput] !== undefined);
    if (fields.length === 0) return this.getSyncMetadataById(id);

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => input[field as keyof UpdateSyncMetadataInput]);
    
    const stmt = this.db.prepare(`
      UPDATE sync_metadata 
      SET ${setClause} 
      WHERE id = ?
    `);
    stmt.run(...values, id);
    return this.getSyncMetadataById(id);
  }

  // Utility methods
  public clearAllData(): void {
    this.db.exec('DELETE FROM apps');
    this.db.exec('DELETE FROM categories');
    this.db.exec('DELETE FROM sync_metadata');
  }

  public getStats(): { totalApps: number; totalCategories: number } {
    const appsStmt = this.db.prepare('SELECT COUNT(*) as count FROM apps');
    const categoriesStmt = this.db.prepare('SELECT COUNT(*) as count FROM categories');
    
    const appsResult = appsStmt.get() as { count: number };
    const categoriesResult = categoriesStmt.get() as { count: number };
    
    return {
      totalApps: appsResult.count,
      totalCategories: categoriesResult.count
    };
  }

  public close(): void {
    this.db.close();
  }
}

export default DatabaseService;
