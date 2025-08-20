import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ReusableBlockItem } from './reusable-block-item';
import SearchBar from './search-bar';
import { BookmarkIcon, PlusIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from '@/lib/axios';
import { Pagination } from '@/components/pagination/Pagination';
import { useDebounce } from '@/hooks/use-debounce';

interface ReusableBlock {
  id: string;
  name: string;
  block_type: string;
  configuration: Record<string, unknown>;
}

interface ReusableBlocksGridProps {
  onAddNew?: () => void;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const ReusableBlocksGrid: React.FC<ReusableBlocksGridProps> = ({ onAddNew }) => {
  const [blocks, setBlocks] = useState<ReusableBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const currentRequestRef = useRef<AbortController | null>(null);

  const loadBlocks = useCallback(async (pageParam: number = 1, searchParam: string = '') => {
    try {
      // Cancel any in-flight request to avoid out-of-order updates
      if (currentRequestRef.current) {
        currentRequestRef.current.abort();
      }
      const controller = new AbortController();
      currentRequestRef.current = controller;

      // Set loading without unmounting content; retain focus in search
      const previouslyFocused = document.activeElement as HTMLElement | null;
      const shouldRestoreFocus = !!(previouslyFocused && containerRef.current?.contains(previouslyFocused));
      setLoading(true);
      const response = await axios.get<PaginatedResponse<ReusableBlock>>('/reusable-blocks', {
        params: { page: pageParam, search: searchParam || undefined },
        signal: controller.signal,
      });

      const payload = response.data as PaginatedResponse<ReusableBlock>;
      setBlocks(payload.data || []);
      setPage(payload.current_page);
      setPerPage(payload.per_page);
      setTotal(payload.total);
      setLastPage(payload.last_page);
      // Attempt to restore focus to the previously focused element if it was inside
      if (shouldRestoreFocus) {
        requestAnimationFrame(() => previouslyFocused?.focus({ preventScroll: true } as unknown as FocusOptions));
      }
    } catch (error) {
      // Ignore aborted requests; log others
      const err = error as unknown as { name?: string };
      if (err?.name !== 'CanceledError' && err?.name !== 'AbortError') {
        console.error('Failed to load reusable blocks:', error);
      }
    } finally {
      // Defer to next frame to reduce layout thrash and focus glitches
      requestAnimationFrame(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    // Reset to first page on search change and fetch
    loadBlocks(1, debouncedSearch);
  }, [debouncedSearch, loadBlocks]);

  const hasAnyBlocks = total > 0;

  const isInitialLoading = loading && blocks.length === 0 && total === 0;

  return (
    <div ref={containerRef} className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookmarkIcon className="w-4 h-4 text-indigo-600" />
          <h3 className="font-medium text-sm">Reusable Blocks</h3>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {total}
          </span>
          {loading && blocks.length > 0 && (
            <Loader2 className="ml-2 h-3 w-3 animate-spin text-gray-400" />
          )}
        </div>
        {onAddNew && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAddNew}
            className="h-7 px-2 text-xs"
          >
            <PlusIcon className="w-3 h-3 mr-1" />
            Add
          </Button>
        )}
      </div>

      <div className="sticky top-0 z-10 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40">
        <SearchBar
          placeholder="Search saved blocks..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>

      {isInitialLoading ? (
        <div className="grid grid-cols-1 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 rounded-lg h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {blocks.length === 0 ? (
            <div className="text-center py-8">
              {!hasAnyBlocks && debouncedSearch === '' ? (
                <div className="text-gray-500">
                  <BookmarkIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-medium mb-1">No saved blocks yet</p>
                  <p className="text-xs text-gray-400">
                    Save configured blocks to reuse them later
                  </p>
                </div>
              ) : (
                <div className="text-gray-500">
                  <p className="text-sm">No blocks found matching your search</p>
                </div>
              )}
            </div>
          ) : (
            <div className={`grid grid-cols-1 gap-3 transition-opacity duration-150 ${loading ? 'opacity-60' : 'opacity-100'}`}>
              {blocks.map(block => (
                <ReusableBlockItem key={block.id} item={block} />
              ))}
            </div>
          )}
        </>
      )}

      {lastPage > 1 && (
        <div className="pt-2">
          <Pagination
            page={page}
            pageSize={perPage}
            totalCount={total}
            onPageChange={(newPage) => {
              loadBlocks(newPage, debouncedSearch);
            }}
          />
        </div>
      )}
    </div>
  );
}; 