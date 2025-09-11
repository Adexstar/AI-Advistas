import { useState, useRef, useEffect } from 'react';
import { Search, X, Filter, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  placeholder?: string;
  filters?: FilterOption[];
  recentSearches?: string[];
  className?: string;
}

interface FilterOption {
  id: string;
  label: string;
  options: { value: string; label: string }[];
}

interface SearchFilters {
  [key: string]: string[];
}

export const SearchBar = ({
  onSearch,
  placeholder = "Search campaigns, ads, or keywords...",
  filters = [],
  recentSearches = [],
  className = "",
}: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<SearchFilters>({});
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (searchQuery: string = query) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim(), selectedFilters);
      setShowRecentSearches(false);
    }
  };

  const handleFilterChange = (filterId: string, value: string, checked: boolean) => {
    setSelectedFilters(prev => {
      const current = prev[filterId] || [];
      if (checked) {
        return { ...prev, [filterId]: [...current, value] };
      } else {
        return { ...prev, [filterId]: current.filter(v => v !== value) };
      }
    });
  };

  const clearFilters = () => {
    setSelectedFilters({});
  };

  const clearSearch = () => {
    setQuery('');
    setSelectedFilters({});
    onSearch('', {});
  };

  const getActiveFiltersCount = () => {
    return Object.values(selectedFilters).reduce((acc, vals) => acc + vals.length, 0);
  };

  const handleRecentSearch = (searchTerm: string) => {
    setQuery(searchTerm);
    handleSearch(searchTerm);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
              if (e.key === 'Escape') {
                setQuery('');
                setShowRecentSearches(false);
              }
            }}
            onFocus={() => setShowRecentSearches(true)}
            className="pl-10 pr-24 h-12 text-base shadow-soft border-border/50 focus:border-primary focus:shadow-glow transition-all"
          />
          
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="h-8 w-8 p-0 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            
            <kbd className="hidden sm:inline-flex items-center rounded border bg-muted px-2 py-1 text-xs font-mono text-muted-foreground">
              ⌘K
            </kbd>
          </div>
        </div>

        {filters.length > 0 && (
          <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="ml-2 h-12 px-4 border-border/50 hover:border-primary transition-all"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-2">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Filter Results</h4>
                  {getActiveFiltersCount() > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                  )}
                </div>
                
                {filters.map((filter) => (
                  <div key={filter.id} className="space-y-2">
                    <h5 className="font-medium text-sm">{filter.label}</h5>
                    <div className="space-y-2">
                      {filter.options.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${filter.id}-${option.value}`}
                            checked={selectedFilters[filter.id]?.includes(option.value) || false}
                            onCheckedChange={(checked) =>
                              handleFilterChange(filter.id, option.value, !!checked)
                            }
                          />
                          <Label
                            htmlFor={`${filter.id}-${option.value}`}
                            className="text-sm cursor-pointer"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <Button
                  onClick={() => {
                    handleSearch();
                    setIsFiltersOpen(false);
                  }}
                  className="w-full"
                >
                  Apply Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Recent Searches Dropdown */}
      <AnimatePresence>
        {showRecentSearches && recentSearches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-soft z-50"
          >
            <div className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Recent Searches</span>
              </div>
              <div className="space-y-1">
                {recentSearches.slice(0, 5).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearch(search)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Display */}
      {getActiveFiltersCount() > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(selectedFilters).map(([filterId, values]) =>
            values.map((value) => {
              const filter = filters.find(f => f.id === filterId);
              const option = filter?.options.find(o => o.value === value);
              return (
                <Badge
                  key={`${filterId}-${value}`}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {filter?.label}: {option?.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleFilterChange(filterId, value, false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};