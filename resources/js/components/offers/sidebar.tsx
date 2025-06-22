import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { findBlockInPage, findSectionInPage, findSectionInPageViaBlock } from '@/components/offers/page-preview';
import { Inspector } from '@/components/offers/page-inspector';
import { SectionInspector } from '@/components/offers/page-section-inspector';
import { useEditor } from '@/contexts/offer/editor-context';
import {
  DiamondPlus,
  Paintbrush,
  Settings2,
  Package,
  ChevronLeft,
  Edit3,
  LayersIcon,
  FlameIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageTheme from './page-theme';
import { ScrollArea } from '../ui/scroll-area';
import { PageLayers } from './page-layers';
import { PageElements } from './page-elements';
import PageProducts from './page-products';
import OfferSettings from './offer-settings';

import { DeleteBlockDialog } from './dialogs/delete-block-dialog';
import { EditableLabel } from '../ui/editable-label';

export type SidebarTab = 'elements' | 'products' | 'themes' | 'settings' | 'layers';

// Define proper type for the iconButtons array
type IconButton = {
  icon: React.ReactNode;
  tab: string;
  label: string;
};

const iconButtons: IconButton[] = [
  { icon: <FlameIcon className="size-6" />, tab: 'elements', label: 'Elements' },
  { icon: <LayersIcon className="size-6" />, tab: 'layers', label: 'Layers' },
  { icon: <Package className="size-6" />, tab: 'products', label: 'Products' },
  { icon: <Paintbrush className="size-6" />, tab: 'themes', label: 'Themes' },
  { icon: <Settings2 className="size-6" />, tab: 'settings', label: 'Settings' },
];


export function Sidebar() {
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

  // Get all block names across all pages and sections for validation
  const getAllBlockNames = useCallback(() => {
    const blockNames = new Set<string>();

    Object.values(data.view.pages).forEach(page => {
      Object.values(page.view).forEach(section => {
        if (section.blocks) {
          section.blocks.forEach(block => {
            if (block.name) {
              blockNames.add(block.name);
            }
          });
        }
      });
    });

    return blockNames;
  }, [data.view.pages]);

  const validateBlockName = useCallback((newName: string) => {
    if (!newName.trim()) {
      return 'Block name cannot be empty';
    }

    // Check for valid slug characters (alphanumeric, dashes, underscores)
    const slugPattern = /^[a-zA-Z0-9_-]+$/;
    if (!slugPattern.test(newName)) {
      return 'Block name can only contain letters, numbers, dashes, and underscores';
    }


    if(selectedBlockId ) {
      const currentBlock = findBlockInPage(data.view.pages[selectedPage], selectedBlockId);
      if (newName === currentBlock?.name) {
        return null;
      }
    }

    const allBlockNames = getAllBlockNames();
    if (allBlockNames.has(newName)) {
      return 'Block name already exists';
    }

    return null;
  }, [selectedBlockId, getAllBlockNames]);


  const saveBlockId = (value: string) => {
    // Format the input to slug format before validation and saving
    const formattedName = formatToSlug(value);

    const error = validateBlockName(formattedName);
    if (error) {
      setBlockIdError(error);
      return;
    }
    if (selectedBlockId) {
      const currentBlock = findBlockInPage(data.view.pages[selectedPage], selectedBlockId);
      if (currentBlock && formattedName !== currentBlock.name) {
        const updatedBlock = { ...currentBlock, name: formattedName };

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
            setSelectedBlockId(currentBlock.id);
          }
        }
      }
    }

    setBlockIdError(null);
  };

  const formatToSlug = (input: string) => {
    return input
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace invalid chars with underscores
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single underscore
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
  };

  const handleBlockIdChange = () => {
    if (blockIdError) {
      setBlockIdError(null);
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
      <div className="flex flex-col border-r border-border w-15">
        {/* Lower left: Navigation Icons */}
        <div className="flex flex-col flex-grow w-15 gap-1.5">
          {iconButtons
            .map((button) => (
            <button
                key={button.tab}
                onClick={() => onTabClick(button.tab as SidebarTab)}
                className={cn(
                    "group h-14 w-15 flex items-center justify-center transition-colors text-primary bg-transparent border-none cursor-pointer outline-none focus:outline-none",
                    "",
                    activeTab === button.tab ? "font-bold " : "font-medium"
                )}
                title={button.label}
                >
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className={cn(
                    "size-8 p-1.5 rounded-md transition-colors flex items-center justify-center",
                    activeTab === button.tab
                      ? "bg-default text-white"
                      : "group-hover:bg-gray-800 group-hover:text-white"
                  )}>{button.icon}</div>
                  <div className="text-[10px] leading-none">{button.label}</div>
                </div>
            </button>
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
                    <EditableLabel
                      className="w-[235px]"
                      value={findBlockInPage(data.view.pages[selectedPage], selectedBlockId)?.name ?? selectedBlockId}
                      onSave={saveBlockId}
                      onChange={handleBlockIdChange}
                    >
                      <div
                        className="w-[235px] justify-between flex items-center gap-1 cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 transition-colors group"
                      >

                        <h2 className="text-sm font-bold truncate leading-6">
                          {findBlockInPage(data.view.pages[selectedPage], selectedBlockId)?.name ?? selectedBlockId}
                        </h2>
                        <Edit3 className="size-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </EditableLabel>
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
