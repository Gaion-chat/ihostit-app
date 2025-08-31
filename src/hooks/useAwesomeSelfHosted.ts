import { useState, useEffect } from 'react';
import { type ParsedCategory, type SelfHostedApp } from '@/services/github';

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
      
      // Fetch transformed data from server API
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setCategories(data.categories as ParsedCategory[]);
      setApps(data.apps as SelfHostedApp[]);
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
