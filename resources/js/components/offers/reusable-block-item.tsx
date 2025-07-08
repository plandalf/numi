import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CustomElementIcon } from '@/components/offers/page-elements';
import { blockTypes } from '@/components/blocks';
import { BookmarkIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from '@/lib/axios';
import cx from 'classnames';

interface ReusableBlock {
  id: string;
  name: string;
  block_type: string;
  configuration: Record<string, unknown>;
}

interface ReusableBlockItemProps {
  item: ReusableBlock;
}

export const ReusableBlockItem: React.FC<ReusableBlockItemProps> = ({ item }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: `reusable:${item.id}`,
  });

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this reusable block?')) {
      try {
        await axios.delete(`/reusable-blocks/${item.id}`);
        window.location.reload();
      } catch (error) {
        console.error('Failed to delete reusable block:', error);
      }
    }
  };

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
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-3 h-3 text-red-500" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        <h4 className="font-medium text-sm text-gray-900 truncate mb-1">
          {item.name}
        </h4>
        <p className="text-xs text-gray-600">
          {item.block_type.replace(/_/g, ' ')}
        </p>
      </div>
    </div>
  );
}; 