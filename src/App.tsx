import { useState, useEffect } from 'react';
import { useAwesomeSelfHosted } from '@/hooks/useAwesomeSelfHosted';
import { AppCard } from '@/components/AppCard';
import { CategoryCard } from '@/components/CategoryCard';
import { SearchAndFilter } from '@/components/SearchAndFilter';
import { Server, AlertCircle, ArrowLeft, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import initService from '@/services/initService';

function App() {
  const [currentView, setCurrentView] = useState<'categories' | 'apps'>('categories');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [initStatus, setInitStatus] = useState<{ loading: boolean; error?: string }>({ loading: true });
  
  // Initialize the database and services on app start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Starting app initialization...');
        const result = await initService.initialize();
        
        if (result.success) {
          console.log('✅ App initialization completed');
          setInitStatus({ loading: false });
        } else {
          console.error('❌ App initialization failed:', result.message);
          setInitStatus({ loading: false, error: result.message });
        }
      } catch (error) {
        console.error('❌ App initialization error:', error);
        setInitStatus({ 
          loading: false, 
          error: error instanceof Error ? error.message : 'Unknown initialization error'
        });
      }
    };
    
    initializeApp();
  }, []);

  // no-op
  
  const {
    categories,
    loading,
    error,
    searchTerm,
    selectedCategory,
    setSearchTerm,
    setSelectedCategory,
    filteredApps,
    apps
  } = useAwesomeSelfHosted();

  const handleReset = () => {
    setSearchTerm('');
    setSelectedCategory('all');
  };

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategoryName(categoryName);
    setSelectedCategory(categoryName);
    setCurrentView('apps');
    window.scrollTo(0, 0);
  };

  const handleBackToCategories = () => {
    setCurrentView('categories');
    setSelectedCategory('all');
    setSearchTerm('');
  };

  // Get apps for the selected category
  const selectedCategoryData = categories.find(cat => cat.name === selectedCategoryName);
  const categoryApps = selectedCategoryData ? selectedCategoryData.apps : [];

  // Show initialization loading first
  if (initStatus.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Server className="h-8 w-8 animate-pulse mx-auto text-primary" />
          <p className="text-muted-foreground">Initializing database and syncing data...</p>
        </div>
      </div>
    );
  }

  // Show initialization error
  if (initStatus.error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <h2 className="text-xl font-semibold text-foreground">Initialization Failed</h2>
          <p className="text-muted-foreground">{initStatus.error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show data loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Server className="h-8 w-8 animate-pulse mx-auto text-primary" />
          <p className="text-muted-foreground">Loading awesome self-hosted applications...</p>
        </div>
      </div>
    );
  }

  // Show data error
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <h2 className="text-xl font-semibold text-foreground">Failed to load data</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Server className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Pixelify Sans, monospace' }}>ihostit.app</h1>
                <p className="text-sm text-muted-foreground">Discover amazing self-hosted applications</p>
              </div>
            </div>
            <div className="text-sm text-white">
              {currentView === 'categories' ? (
                `Categories: ${categories.length} | Total Apps: ${apps.length}`
              ) : (
                `${selectedCategoryName} | Apps: ${categoryApps.length}`
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentView === 'categories' ? (
          /* Category Cards View */
          <>
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4">Browse by Category</h2>
              <p className="text-muted-foreground mb-6">Choose a category to explore self-hosted applications</p>
              
              {/* Search and Filter */}
              <div className="max-w-2xl mx-auto">
                <SearchAndFilter
                  searchTerm={searchTerm}
                  selectedCategory={selectedCategory}
                  categories={categories}
                  onSearchChange={setSearchTerm}
                  onCategoryChange={setSelectedCategory}
                  onReset={handleReset}
                  totalApps={apps.length}
                  filteredCount={filteredApps.length}
                  showStats={false}
                  showCategoryFilter={false}
                />
              </div>
            </div>
            
            {searchTerm ? (
              /* Show filtered apps when searching */
              filteredApps.length === 0 ? (
                <div className="text-center py-12">
                  <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No applications found</h3>
                  <p className="text-muted-foreground">Try adjusting your search terms</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredApps.map((app, index) => (
                    <AppCard key={`${app.name}-${index}`} app={app} />
                  ))}
                </div>
              )
            ) : (
              /* Show categories when not searching */
              categories.length === 0 ? (
                <div className="text-center py-12">
                  <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No categories found</h3>
                  <p className="text-muted-foreground">Unable to load categories</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categories.map((category) => (
                    <CategoryCard 
                      key={category.name} 
                      category={category} 
                      onClick={handleCategoryClick}
                    />
                  ))}
                </div>
              )
            )}
          </>
        ) : (
          /* Apps List View */
          <>
            {/* Back Button */}
            <div className="mb-6">
              <Button 
                variant="outline" 
                onClick={handleBackToCategories}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Categories
              </Button>
            </div>



            {/* Apps Grid */}
            {filteredApps.length === 0 ? (
              <div className="text-center py-12">
                <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No applications found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or filters
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredApps.map((app, index) => (
                  <AppCard key={`${app.name}-${index}`} app={app} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="container mx-auto px-4 py-4">
          <div className="text-center text-sm text-muted-foreground">
            <p className="flex items-center justify-center gap-2 flex-wrap">
              <span>
                Data sourced from{' '}
                <a
                  href="https://github.com/awesome-selfhosted/awesome-selfhosted"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  awesome-selfhosted
                </a>
              </span>
              <span>•</span>
              {/* Buy Me a Beer button (no external script to avoid blockers) */}
              <a
                href="https://www.buymeacoffee.com/cyph3rasi"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium"
                style={{ backgroundColor: '#BD5FFF', color: '#ffffff' }}
              >
                <span role="img" aria-label="beer">🍺</span>
                Buy me a beer
              </a>
              <span>•</span>
              <a
                href="https://github.com/Gaion-chat/ihostit-app"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="ihostit.app GitHub repository"
                className="text-primary hover:text-primary/80"
              >
                <Github className="h-4 w-4 inline-block align-text-bottom" />
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App
