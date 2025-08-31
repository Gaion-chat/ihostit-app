// Database types for SQLite entities

export interface Category {
  id: number;
  name: string;
  description?: string;
  app_count: number;
  created_at: string;
  updated_at: string;
}

export interface App {
  id: number;
  name: string;
  description?: string;
  website?: string;
  source_code?: string;
  demo?: string;
  license?: string;
  category_id?: number;
  subcategory?: string;
  created_at: string;
  updated_at: string;
}

export interface SyncMetadata {
  id: number;
  last_sync: string;
  sync_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  total_apps: number;
  total_categories: number;
  created_at: string;
}

// Input types for creating new records
export interface CreateCategoryInput {
  name: string;
  description?: string;
  app_count?: number;
}

export interface CreateAppInput {
  name: string;
  description?: string;
  website?: string;
  source_code?: string;
  demo?: string;
  license?: string;
  category_id?: number;
  subcategory?: string;
}

export interface CreateSyncMetadataInput {
  sync_status?: 'pending' | 'in_progress' | 'completed' | 'failed';
  total_apps?: number;
  total_categories?: number;
}

// Update types
export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  app_count?: number;
}

export interface UpdateAppInput {
  name?: string;
  description?: string;
  website?: string;
  source_code?: string;
  demo?: string;
  license?: string;
  category_id?: number;
  subcategory?: string;
}

export interface UpdateSyncMetadataInput {
  sync_status?: 'pending' | 'in_progress' | 'completed' | 'failed';
  total_apps?: number;
  total_categories?: number;
}