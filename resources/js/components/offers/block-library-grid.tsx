import React, { useState, useEffect } from 'react';
import { BlockLibraryItemComponent } from './block-library-item';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import SearchBar from './search-bar';
import { BookmarkIcon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import axios from '@/lib/axios';
import { Block } from '@/types/offer';

interface BlockLibraryItem {
  id: string;
  name: string;
  description?: string;
  block_type: string;
  category?: string;
  configuration: Block;
  preview_image_url?: string;
  tags?: string[];
  usage_count: number;
  created_at: string;
  updated_at: string;
}

interface BlockLibraryGridProps {
  onAddNew?: () => void;
}

export const BlockLibraryGrid: React.FC<BlockLibraryGridProps> = ({ onAddNew }) => {
  const [blocks, setBlocks] = useState<BlockLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const organization = useCurrentOrganization();

  useEffect(() => {
    if (organization?.id) {
      loadBlocks();
      loadCategories();
    }
  }, [organization?.id]);

  const loadBlocks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/block-library');
      setBlocks(response.data.data || []);
    } catch (error) {
      console.error('Failed to load block library:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await axios.get('/block-library/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  // Filter blocks based on search query and category
  const filteredBlocks = blocks.filter(block => {
    const matchesSearch = searchQuery === '' || 
      block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.block_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === '' || block.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookmarkIcon className="w-4 h-4 text-indigo-600" />
          <h3 className="font-medium text-sm">Block Library</h3>
          <Badge variant="secondary" className="text-xs">
            {blocks.length}
          </Badge>
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

      {/* Search */}
      <SearchBar
        placeholder="Search saved blocks..."
        value={searchQuery}
        onChange={setSearchQuery}
      />

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('')}
            className="h-7 px-3 text-xs"
          >
            All
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="h-7 px-3 text-xs"
            >
              {category}
            </Button>
          ))}
        </div>
      )}

      {/* Blocks Grid */}
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
            <BlockLibraryItemComponent key={block.id} item={block} />
          ))}
        </div>
      )}
    </div>
  );
}; 