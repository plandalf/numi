import { type Page, type ViewSection, type Block, type BlockContent, type PageView, type TextContent, type IconContent } from '@/types/offer';
import { cn } from '@/lib/utils';
import LayoutPreview from './layout-preview';
import BlockEditor from './block-editor';
import { useState, useRef, useEffect, useContext } from 'react';
import { X, Save, Type, Calendar, DollarSign, Mail, Lock, Link, ChevronDown, Circle, CheckSquare, ToggleLeft, List, Heading1, Square as ButtonIcon, Image as ImageIcon, AtSign, User, Phone, MapPin, Package, CreditCard } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { BlockType, DRAG_TYPES } from './layout-preview';
import Edit, { useEditor } from '@/pages/offers/edit';

interface PreviewProps {
  page: Page;
  onUpdatePage?: (page: Page) => void;
}


export function findBlockInPage(page: Page, blockId: string): Block | null {
    if (!page || !page.view) {
        console.error('Invalid page or view in findBlockInPage');
        return null;
    }

    const sections = Object.keys(page.view);

    for (const sectionName of sections) {
        const section = page.view[sectionName];
        if (!section || !section.blocks) continue;

        const block = section.blocks.find(block => block.id === blockId);
        if (block) return block;
    }

    return null;
}

// Helper function to find nested blocks
function findNestedBlock(blocks: Block[], blockId: string): Block | null {
    for (const block of blocks) {
        if (block.id === blockId) return block;

        if (block.children) {
            const nestedBlock = findNestedBlock(block.children, blockId);
            if (nestedBlock) return nestedBlock;
        }
    }

    return null;
}

// Helper function to convert style object to className string
export function styleToClassName(style: Record<string, string>): string {
    // This is a simple implementation - you might want to expand this
    // to handle more complex style conversions
    const classNames: string[] = [];

    if (style.textAlign) {
        const alignmentMap: Record<string, string> = {
            'left': 'text-left',
            'center': 'text-center',
            'right': 'text-right',
            'justify': 'text-justify'
        };
        classNames.push(alignmentMap[style.textAlign] || '');
    }

    if (style.color) {
        // This is simplified - in a real app you'd map colors to Tailwind classes
        classNames.push(`text-[${style.color}]`);
    }

    if (style.backgroundColor) {
        classNames.push(`bg-[${style.backgroundColor}]`);
    }

    return classNames.join(' ');
}

// Helper function to update a block in the page
function updateBlockInPage(page: Page, updatedBlock: Block): boolean {
    if (!page || !page.view || !updatedBlock.id) return false;

    const sections = ['title', 'content', 'action', 'promo'] as const;

    for (const sectionName of sections) {
        const section = page.view[sectionName];
        if (!section || !section.blocks) continue;

        const blockIndex = section.blocks.findIndex(b => b.id === updatedBlock.id);
        if (blockIndex >= 0) {
            section.blocks[blockIndex] = updatedBlock;
            return true;
        }
    }

    return false;
}


export default function PagePreview({ page, onUpdatePage }: PreviewProps) {

  const [pendingChanges, setPendingChanges] = useState<Block | null>(null);
  const [livePreviewPage, setLivePreviewPage] = useState<Page>(page);

  const { selectedBlockId, setSelectedBlockId } = useEditor();

  // Update live preview when page changes from outside
  useEffect(() => {
      setLivePreviewPage(page);
  }, [page]);

  const selectedBlock = selectedBlockId ? findBlockInPage(livePreviewPage, selectedBlockId) : null;


  useEffect(() => {
      console.log('Current selected block:', selectedBlock);
  }, [selectedBlock]);

  const handleBlockUpdate = (updatedBlock: Block) => {
      if (!updatedBlock.id) return;

      // Apply changes to the live preview immediately
      const updatedPreviewPage = JSON.parse(JSON.stringify(livePreviewPage));
      updateBlockInPage(updatedPreviewPage, updatedBlock);

      // Update live preview
      setLivePreviewPage(updatedPreviewPage);
      setPendingChanges(updatedBlock);
  };

  const handleSaveChanges = () => {
      if (!pendingChanges || !pendingChanges.id || !onUpdatePage) return;
      onUpdatePage(livePreviewPage);
      setPendingChanges(null);
  };

return (

  <div className="h-full flex bg-[#F7F9FF]">
    <div className="flex-1 flex items-center justify-center p-8 h-full overflow-auto">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-5xl">
        {/* The layout preview - using live preview page */}
        <LayoutPreview
          page={livePreviewPage}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
        />
      </div>
    </div>
  </div>
);
}
