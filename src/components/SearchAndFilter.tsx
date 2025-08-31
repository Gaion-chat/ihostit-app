import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, RotateCcw } from 'lucide-react';
import type { ParsedCategory } from '@/services/github';

interface SearchAndFilterProps {
  searchTerm: string;
  selectedCategory: string;
  categories: ParsedCategory[];
  onSearchChange: (term: string) => void;
  onCategoryChange: (category: string) => void;
  onReset: () => void;
  totalApps: number;
  filteredCount: number;
  showStats?: boolean;
  showCategoryFilter?: boolean;
}

export function SearchAndFilter({
  searchTerm,
  selectedCategory,
  categories,
  onSearchChange,
  onCategoryChange,
  onReset,
  totalApps,
  filteredCount,
  showStats = true,
  showCategoryFilter = true
}: SearchAndFilterProps) {
  const handleReset = () => {
    onSearchChange('');
    onCategoryChange('all');
    onReset();
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search applications..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-background border-border"
        />
      </div>

      {/* Filters */}
      {showCategoryFilter && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedCategory} onValueChange={onCategoryChange}>
                <SelectTrigger className="w-[300px] bg-background border-border">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.name} value={category.name}>
                      {category.name} ({category.apps.length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reset and Stats */}
          {showStats && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {filteredCount} of {totalApps} apps
              </span>
              {(searchTerm || selectedCategory !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}