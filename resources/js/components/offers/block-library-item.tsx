import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CustomElementIcon } from '@/components/offers/page-elements';
import { blockTypes } from '@/components/blocks';
import { BookmarkIcon, TagIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Block } from '@/types/offer';
import cx from 'classnames';

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
}

interface BlockLibraryItemProps {
  item: BlockLibraryItem;
}

export const BlockLibraryItemComponent: React.FC<BlockLibraryItemProps> = ({ item }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: `library:${item.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cx({
        "group flex flex-col bg-white border border-gray-200 rounded-lg p-3 cursor-move transition-all hover:shadow-md hover:border-gray-300": true,
        "opacity-60": isDragging,
      })}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-md">
            <CustomElementIcon type={item.block_type as keyof typeof blockTypes} />
          </div>
          <BookmarkIcon className="w-3 h-3 text-indigo-500" />
        </div>
        {item.usage_count > 0 && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {item.usage_count}x
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        <h4 className="font-medium text-sm text-gray-900 truncate mb-1">
          {item.name}
        </h4>
        {item.description && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
            {item.description}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        {item.category && (
          <Badge variant="outline" className="text-xs">
            {item.category}
          </Badge>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className="flex items-center gap-1">
            <TagIcon className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">
              {item.tags.slice(0, 2).join(', ')}
              {item.tags.length > 2 && '...'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}; 