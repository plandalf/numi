import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { findBlockInPage, findSectionInPage, findSectionInPageViaBlock } from '@/components/offers/page-preview';
import { Inspector } from '@/components/offers/page-inspector';
import { SectionInspector } from '@/components/offers/page-section-inspector';
import { useEditor } from '@/contexts/offer/editor-context';
import {
  DiamondPlus,
  LayoutPanelLeft,
  Paintbrush,
  Settings2,
  Package,
  ChevronLeft,
  Edit3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageTheme from './page-theme';
import { ScrollArea } from '../ui/scroll-area';
import { PageLayers } from './page-layers';
import { PageElements } from './page-elements';
import PageProducts from './page-products';
import OfferSettings from './offer-settings';

import { DeleteBlockDialog } from './dialogs/delete-block-dialog';

export type SidebarTab = 'elements' | 'products' | 'themes' | 'settings' | 'layers';

// Define proper type for the iconButtons array
type IconButton = {
  icon: React.ReactNode;
  tab: string;
  label: string;
};

const iconButtons: IconButton[] = [
  { icon: <DiamondPlus className="size-5" />, tab: 'elements', label: 'Elements' },
  { icon: <LayoutPanelLeft className="size-5" />, tab: 'layers', label: 'Layers' },
  { icon: <Package className="size-5" />, tab: 'products', label: 'Products' },
  { icon: <Paintbrush className="size-5" />, tab: 'themes', label: 'Themes' },
  { icon: <Settings2 className="size-5" />, tab: 'settings', label: 'Settings' },
  // { icon: <Unplug className="size-5" />, tab: 'integration', label: 'Integrations' },
  // { icon: <Bell className="size-5" />, tab: 'inspector', label: 'Notifications' },
];


export function Sidebar() {
  const [isEditingBlockId, setIsEditingBlockId] = useState(false);
  const [editBlockIdValue, setEditBlockIdValue] = useState('');
  const [blockIdError, setBlockIdError] = useState<string | null>(null);

  const {
    data,
    selectedPage,
    selectedBlockId,
    setSelectedBlockId,
    selectedSectionId,
    setSelectedSectionId,
    updateBlock,
    updateSection,
    viewMode,
    deleteBlock,
    activeTab,
    setActiveTab,
  } = useEditor();

  const isEditorMode = viewMode === 'editor';

  const handleDeleteBlock = () => {
    if (selectedBlockId) {
      deleteBlock(selectedBlockId);
      setSelectedBlockId(null);
    }
  };

  // Get all block IDs across all pages and sections for validation
  const getAllBlockIds = useCallback(() => {
    const blockIds = new Set<string>();
    
    Object.values(data.view.pages).forEach(page => {
      Object.values(page.view).forEach(section => {
        if (section.blocks) {
          section.blocks.forEach(block => {
            blockIds.add(block.id);
          });
        }
      });
    });
    
    return blockIds;
  }, [data.view.pages]);

  const validateBlockId = useCallback((newId: string) => {
    if (!newId.trim()) {
      return 'Block ID cannot be empty';
    }
    
    // Check for valid slug characters (alphanumeric, dashes, underscores)
    const slugPattern = /^[a-zA-Z0-9_-]+$/;
    if (!slugPattern.test(newId)) {
      return 'Block ID can only contain letters, numbers, dashes, and underscores';
    }
    
    if (newId === selectedBlockId) {
      return null; // Same ID, no change
    }
    
    const allBlockIds = getAllBlockIds();
    if (allBlockIds.has(newId)) {
      return 'Block ID already exists';
    }
    
    return null;
  }, [selectedBlockId, getAllBlockIds]);

  const startEditingBlockId = () => {
    if (selectedBlockId) {
      setEditBlockIdValue(selectedBlockId);
      setIsEditingBlockId(true);
      setBlockIdError(null);
    }
  };

  const cancelEditingBlockId = () => {
    setIsEditingBlockId(false);
    setEditBlockIdValue('');
    setBlockIdError(null);
  };

  const saveBlockId = () => {
    // Format the input to slug format before validation and saving
    const formattedId = formatToSlug(editBlockIdValue);
    
    const error = validateBlockId(formattedId);
    if (error) {
      setBlockIdError(error);
      return;
    }
    
    if (selectedBlockId && formattedId !== selectedBlockId) {
      const currentBlock = findBlockInPage(data.view.pages[selectedPage], selectedBlockId);
      if (currentBlock) {
        // Update the block with the new formatted ID
        const updatedBlock = { ...currentBlock, id: formattedId };
        
        // Find the section containing this block
        const page = data.view.pages[selectedPage];
        const sectionId = Object.keys(page.view).find((section) => {
          return page.view[section].blocks?.some((b) => b.id === selectedBlockId);
        });

        if (sectionId) {
          // Update the block directly in the data structure
          const sectionBlocks = page.view[sectionId].blocks;
          const blockIndex = sectionBlocks.findIndex(b => b.id === selectedBlockId);
          
          if (blockIndex !== -1) {
            // Replace the block with the updated one
            const newBlocks = [...sectionBlocks];
            newBlocks[blockIndex] = updatedBlock;
            
            // Update the section with the new blocks array
            updateSection(sectionId, { blocks: newBlocks });
            setSelectedBlockId(formattedId);
          }
        }
      }
    }
    
    setIsEditingBlockId(false);
    setEditBlockIdValue('');
    setBlockIdError(null);
  };

  const formatToSlug = (input: string) => {
    return input
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace invalid chars with underscores
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single underscore
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
  };

  const handleBlockIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow any characters while typing
    setEditBlockIdValue(e.target.value);
    
    // Clear error when user starts typing
    if (blockIdError) {
      setBlockIdError(null);
    }
  };

  const handleBlockIdKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveBlockId();
    } else if (e.key === 'Escape') {
      cancelEditingBlockId();
    }
  };

  // Content for each tab
  const renderTabContent = () => {
    if (selectedSectionId) {
      return (
        <SectionInspector
          key={selectedSectionId}
          sectionId={selectedSectionId}
          onClose={() => setSelectedSectionId(null)}
        />
      );
    }

    if (selectedBlockId) {
      const block = findBlockInPage(data.view.pages[selectedPage], selectedBlockId);
      if (!block) return null;

      return (
        <Inspector
          key={selectedBlockId}
          block={block}
          onClose={() => setSelectedBlockId(null)}
          onUpdate={updateBlock}
          onSave={() => {}}
        />
      );
    }

    switch (activeTab) {
      case 'elements':
        return (
          <PageElements />
        );
      case 'layers':
        return (
          <PageLayers onAddNewElementClick={() => setActiveTab('elements')} />
        );
      case 'products':
        return (
          <PageProducts />
        );
      case 'settings':
        return (
          <OfferSettings />
        );
      case 'themes':
        return (
          <PageTheme />
        );
      default:
        return null;
    }
  };

  const removeSelection = () => {
    setSelectedBlockId(null);
    setSelectedSectionId(null);
  }

  const onTabClick = (tab: SidebarTab) => {
    setActiveTab(tab);
    removeSelection();
  }
  return (
    <div className={cn(
      "flex h-full overflow-hidden shadow-xl transition-all duration-300",
      !isEditorMode ? "w-14" : "w-[400px]"
    )}>
      {/* Left column: Icon & Buttons */}
      <div className="flex flex-col border-r border-border w-14">
        {/* Upper left: Main Icon */}
        <div className="h-14 flex items-center justify-center border-b border-border">
          <Button
            variant="outline"
            size="icon"
            className={cn("h-10 w-10",
              activeTab === 'elements' ? "bg-primary text-white hover:bg-gray-900 hover:text-white" : "bg-default text-white border-default hover:bg-primary hover:opacity-80 hover:border-gray-900 hover:text-white"
            )}
            onClick={() => onTabClick('elements')}
            tooltip="Elements"
            tooltipSide='right'
          >
            <DiamondPlus className="size-5" />
          </Button>
        </div>

        {/* Lower left: Navigation Icons */}
        <div className="flex flex-col flex-grow w-[56px] p-2 gap-2">
          {iconButtons
            .filter(button => button.tab !== 'elements')
            .map((button) => (
            <Button
                variant="outline-transparent"
                key={button.tab}
                onClick={() => onTabClick(button.tab as SidebarTab)}
                tooltip={button.label}
                tooltipSide='right'
                className={cn(
                    "h-10 border-none shadow-none flex items-center justify-center transition-colors text-primary",
                    activeTab === button.tab
                    ? "bg-gray-900 text-white hover:bg-gray-900 hover:text-white"
                    : "hover:bg-gray-500 hover:text-white"
                )}
                title={button.label}
                >
                {button.icon}
            </Button>
          ))}
        </div>
      </div>

      {/* Right column: Content */}
      <div className={cn(
        "flex flex-col flex-grow overflow-hidden transition-all duration-300 border-r",
        !isEditorMode ? "w-0 hidden" : "w-[346px]"
      )}>
        {/* Upper right: Label */}
        <div className="min-h-14 flex items-center px-4 py-1 border-b border-border min-h-14 flex-shrink-0">
          {selectedBlockId ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={removeSelection}
                >
                  <ChevronLeft className="size-6" />
                </Button>
                <div className="flex flex-col items-start">
                  <span className="flex flex-row gap-x-1 items-center text-xs text-gray-500">
                    Section:
                    <span className="font-bold text-xs text-gray-500 hover:underline cursor-pointer transition-all duration-300" onClick={() => {
                      setSelectedSectionId(findSectionInPageViaBlock(data.view.pages[selectedPage], selectedBlockId)?.id ?? '');
                      setSelectedBlockId(null);
                    }}>{findSectionInPageViaBlock(data.view.pages[selectedPage], selectedBlockId)?.id?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </span>
                  
                  <div className="flex items-center gap-2 w-full">
                    {isEditingBlockId ? (
                      <div className="flex-1">
                        <Input
                          value={editBlockIdValue}
                          onChange={handleBlockIdChange}
                          onKeyDown={handleBlockIdKeyDown}
                          onBlur={saveBlockId}
                          className={cn(
                            "h-6 text-xs",
                            blockIdError && "border-red-500 focus:border-red-500"
                          )}
                          autoFocus
                        />
                        {blockIdError && (
                          <div className="text-xs text-red-500 mt-1">{blockIdError}</div>
                        )}
                      </div>
                    ) : (
                      <div 
                        className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 transition-colors group"
                        onClick={startEditingBlockId}
                      >
                        
                        <h2 className="text-lg font-bold truncate leading-6">
                          {selectedBlockId}
                        </h2>
                        <Edit3 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DeleteBlockDialog onDelete={handleDeleteBlock} />
            </div>
          ) : selectedSectionId ? (
            <div className="flex items-center gap-2 w-full">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={removeSelection}
              >
                <ChevronLeft className="size-6" />
              </Button>
              <h2 className="text-lg font-bold truncate">
                {findSectionInPage(data.view.pages[selectedPage], selectedSectionId)?.label ?? selectedSectionId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h2>
            </div>
          ) : (
            <h2 className="text-lg font-bold truncate">{iconButtons.find(b => b.tab === activeTab)?.label}</h2>
          )}
        </div>

        {/* Lower right: Content */}
        <ScrollArea className="flex-grow overflow-y-hidden">
          {renderTabContent()}
        </ScrollArea>
      </div>
    </div>
  );
}
