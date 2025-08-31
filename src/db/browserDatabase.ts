import * as DbTypes from './types';

type Category = DbTypes.Category;
type App = DbTypes.App;
type SyncMetadata = DbTypes.SyncMetadata;
type CreateCategoryInput = DbTypes.CreateCategoryInput;
type CreateAppInput = DbTypes.CreateAppInput;
type CreateSyncMetadataInput = DbTypes.CreateSyncMetadataInput;
type UpdateCategoryInput = DbTypes.UpdateCategoryInput;
type UpdateAppInput = DbTypes.UpdateAppInput;
type UpdateSyncMetadataInput = DbTypes.UpdateSyncMetadataInput;

interface PersistedState {
  categories: Category[];
  apps: App[];
  syncMetadata: SyncMetadata[];
  counters: { categoryId: number; appId: number; syncMetaId: number };
}

const STORAGE_KEY = 'ihostit.db.v1';

function nowIso(): string {
  return new Date().toISOString();
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        categories: [],
        apps: [],
        syncMetadata: [],
        counters: { categoryId: 0, appId: 0, syncMetaId: 0 },
      };
    }
    return JSON.parse(raw) as PersistedState;
  } catch {
    return {
      categories: [],
      apps: [],
      syncMetadata: [],
      counters: { categoryId: 0, appId: 0, syncMetaId: 0 },
    };
  }
}

function saveState(state: PersistedState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

class BrowserDatabaseService {
  private static instance: BrowserDatabaseService;
  private state: PersistedState;

  private constructor() {
    this.state = loadState();
  }

  public static getInstance(): BrowserDatabaseService {
    if (!BrowserDatabaseService.instance) {
      BrowserDatabaseService.instance = new BrowserDatabaseService();
    }
    return BrowserDatabaseService.instance;
  }

  // Category operations
  public createCategory(input: CreateCategoryInput): Category {
    const id = ++this.state.counters.categoryId;
    const category: Category = {
      id,
      name: input.name,
      description: input.description,
      app_count: input.app_count ?? 0,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    this.state.categories.push(category);
    saveState(this.state);
    return category;
  }

  public getCategoryById(id: number): Category | null {
    return this.state.categories.find(c => c.id === id) ?? null;
  }

  public getCategoryByName(name: string): Category | null {
    return this.state.categories.find(c => c.name === name) ?? null;
  }

  public getAllCategories(): Category[] {
    return [...this.state.categories].sort((a, b) => a.name.localeCompare(b.name));
  }

  public updateCategory(id: number, input: UpdateCategoryInput): Category | null {
    const cat = this.state.categories.find(c => c.id === id);
    if (!cat) return null;
    Object.assign(cat, input);
    cat.updated_at = nowIso();
    saveState(this.state);
    return cat;
  }

  public deleteCategory(id: number): boolean {
    const before = this.state.categories.length;
    this.state.categories = this.state.categories.filter(c => c.id !== id);
    saveState(this.state);
    return this.state.categories.length !== before;
  }

  // App operations
  public createApp(input: CreateAppInput): App {
    const id = ++this.state.counters.appId;
    const app: App = {
      id,
      name: input.name,
      description: input.description,
      website: input.website,
      source_code: input.source_code,
      demo: input.demo,
      license: input.license,
      category_id: input.category_id,
      subcategory: input.subcategory,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    this.state.apps.push(app);
    // Update category app_count
    if (app.category_id) {
      const cat = this.state.categories.find(c => c.id === app.category_id);
      if (cat) cat.app_count = (cat.app_count ?? 0) + 1;
    }
    saveState(this.state);
    return app;
  }

  public getAppById(id: number): App | null {
    return this.state.apps.find(a => a.id === id) ?? null;
  }

  public getAllApps(): App[] {
    return [...this.state.apps].sort((a, b) => a.name.localeCompare(b.name));
  }

  public getAppsByCategory(categoryId: number): App[] {
    return this.state.apps
      .filter(a => a.category_id === categoryId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  public searchApps(query: string): App[] {
    const q = query.toLowerCase();
    return this.state.apps
      .filter(a => (a.name || '').toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  public updateApp(id: number, input: UpdateAppInput): App | null {
    const app = this.state.apps.find(a => a.id === id);
    if (!app) return null;
    Object.assign(app, input);
    app.updated_at = nowIso();
    saveState(this.state);
    return app;
  }

  public deleteApp(id: number): boolean {
    const before = this.state.apps.length;
    const app = this.state.apps.find(a => a.id === id);
    if (!app) return false;
    if (app.category_id) {
      const cat = this.state.categories.find(c => c.id === app.category_id);
      if (cat) cat.app_count = Math.max(0, (cat.app_count ?? 0) - 1);
    }
    this.state.apps = this.state.apps.filter(a => a.id !== id);
    saveState(this.state);
    return this.state.apps.length !== before;
  }

  // Sync metadata operations
  public createSyncMetadata(input: CreateSyncMetadataInput): SyncMetadata {
    const id = ++this.state.counters.syncMetaId;
    const record: SyncMetadata = {
      id,
      last_sync: nowIso(),
      sync_status: input.sync_status ?? 'pending',
      total_apps: input.total_apps ?? 0,
      total_categories: input.total_categories ?? 0,
      created_at: nowIso(),
    };
    this.state.syncMetadata.push(record);
    saveState(this.state);
    return record;
  }

  public getSyncMetadataById(id: number): SyncMetadata | null {
    return this.state.syncMetadata.find(m => m.id === id) ?? null;
  }

  public getLatestSyncMetadata(): SyncMetadata | null {
    if (this.state.syncMetadata.length === 0) return null;
    // Latest is last pushed
    return this.state.syncMetadata[this.state.syncMetadata.length - 1];
  }

  public updateSyncMetadata(id: number, input: UpdateSyncMetadataInput): SyncMetadata | null {
    const rec = this.state.syncMetadata.find(m => m.id === id);
    if (!rec) return null;
    Object.assign(rec, input);
    if (input.sync_status === 'completed') {
      rec.last_sync = nowIso();
    }
    saveState(this.state);
    return rec;
  }

  // Utility methods
  public clearAllData(): void {
    this.state.categories = [];
    this.state.apps = [];
    this.state.syncMetadata = [];
    this.state.counters = { categoryId: 0, appId: 0, syncMetaId: 0 };
    saveState(this.state);
  }

  public getStats(): { totalApps: number; totalCategories: number } {
    return {
      totalApps: this.state.apps.length,
      totalCategories: this.state.categories.length,
    };
  }

  public close(): void {
    // No-op in browser
  }
}

export default BrowserDatabaseService;

