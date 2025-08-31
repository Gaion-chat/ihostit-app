import { useState, useEffect } from 'react';
import { type ParsedCategory, type SelfHostedApp } from '@/services/github';
import DatabaseService from '@/db';
import SyncService from '@/services/syncService';

export interface UseAwesomeSelfHostedReturn {
  categories: ParsedCategory[];
  apps: SelfHostedApp[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  selectedCategory: string;
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (category: string) => void;
  filteredApps: SelfHostedApp[];
  refetch: () => Promise<void>;
}

export function useAwesomeSelfHosted(): UseAwesomeSelfHostedReturn {
  const [categories, setCategories] = useState<ParsedCategory[]>([]);
  const [apps, setApps] = useState<SelfHostedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');


  const fetchData = async () => {
    try {
      console.log('🔄 Starting data fetch from database...');
      setLoading(true);
      setError(null);
      
      const db = DatabaseService.getInstance();
      const syncService = new SyncService();
      
      // Check if we need initial sync or daily update
      if (syncService.needsInitialSync() || syncService.shouldSync(24)) {
        console.log('📥 Syncing data from GitHub...');
        const syncResult = await syncService.syncFromGitHub();
        if (!syncResult.success) {
          throw new Error(syncResult.message);
        }
        console.log('✅ Sync completed:', syncResult.stats);
      }
      
      // Fetch data from database
      const dbCategories = db.getAllCategories();
      const dbApps = db.getAllApps();
      
      // Transform database data to match existing interface
      const transformedCategories: ParsedCategory[] = dbCategories.map(category => {
        const categoryApps = dbApps.filter(app => app.category_id === category.id);
        return {
          name: category.name,
          description: category.description || '',
          apps: categoryApps.map(app => ({
            name: app.name,
            description: app.description || '',
            url: app.website || '',
            sourceCode: app.source_code || '',
            demo: app.demo || '',
            license: app.license || '',
            category: category.name,
            subcategory: app.subcategory || ''
          }))
        };
      });
      
      console.log('✅ Data loaded from database:', {
        categoriesCount: transformedCategories.length,
        totalApps: dbApps.length
      });
      
      setCategories(transformedCategories);
      
      // Flatten all apps with category information
      const allApps: SelfHostedApp[] = dbApps.map(app => {
        const category = dbCategories.find(cat => cat.id === app.category_id);
        return {
          name: app.name,
          description: app.description || '',
          url: app.website || '',
          sourceCode: app.source_code || '',
          demo: app.demo || '',
          license: app.license || '',
          category: category?.name || 'Uncategorized',
          subcategory: app.subcategory || ''
        };
      });
      
      setApps(allApps);
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
      console.log('🏁 Data fetch completed');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  // Filter apps (default sort by name)
  const filteredApps = apps
    .filter(app => {
      const matchesSearch = searchTerm === '' || 
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    categories,
    apps,
    loading,
    error,
    searchTerm,
    selectedCategory,
    setSearchTerm,
    setSelectedCategory,
    filteredApps,
    refetch: fetchData
  };
}
