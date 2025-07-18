import React, { useState, useEffect } from 'react';
import { ReusableBlockItem } from './reusable-block-item';
import SearchBar from './search-bar';
import { BookmarkIcon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from '@/lib/axios';

interface ReusableBlock {
  id: string;
  name: string;
  block_type: string;
  configuration: any;
}

interface ReusableBlocksGridProps {
  onAddNew?: () => void;
}

export const ReusableBlocksGrid: React.FC<ReusableBlocksGridProps> = ({ onAddNew }) => {
  const [blocks, setBlocks] = useState<ReusableBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadBlocks();
  }, []);

  const loadBlocks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/reusable-blocks');
      setBlocks(response.data.data || []);
    } catch (error) {
      console.error('Failed to load reusable blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBlocks = blocks.filter(block => 
    searchQuery === '' || 
    block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    block.block_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-500">
          <BookmarkIcon className="w-4 h-4" />
          <span className="text-sm">Loading your saved blocks...</span>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 rounded-lg h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookmarkIcon className="w-4 h-4 text-indigo-600" />
          <h3 className="font-medium text-sm">Reusable Blocks</h3>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {blocks.length}
          </span>
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

      <SearchBar
        placeholder="Search saved blocks..."
        value={searchQuery}
        onChange={setSearchQuery}
      />

      {filteredBlocks.length === 0 ? (
        <div className="text-center py-8">
          {blocks.length === 0 ? (
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
        <div className="grid grid-cols-1 gap-3">
          {filteredBlocks.map(block => (
            <ReusableBlockItem key={block.id} item={block} />
          ))}
        </div>
      )}
    </div>
  );
}; 