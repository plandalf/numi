import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { findBlockInPage, findSectionInPage } from '@/components/offers/page-preview';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageTheme from './page-theme';
import { ScrollArea } from '../ui/scroll-area';
import { PageLayers } from './page-layers';
import { PageElements } from './page-elements';
import PageProducts from './page-products';
import OfferSettings from './offer-settings';

import { DeleteBlockDialog } from './dialogs/delete-block-dialog';

type SidebarTab = 'elements' | 'products' | 'themes' | 'settings' | 'layers';

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
  const [activeTab, setActiveTab] = useState<SidebarTab>('elements');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data,
    selectedPage,
    selectedBlockId,
    setSelectedBlockId,
    selectedSectionId,
    setSelectedSectionId,
    updateBlock,
    viewMode,
    deleteBlock,
  } = useEditor();

  const isEditorMode = viewMode === 'editor';

  const handleDeleteBlock = () => {
    if (selectedBlockId) {
      deleteBlock(selectedBlockId);
      setSelectedBlockId(null);
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

  const onTabClick = (tab: SidebarTab) => {
    console.log('onTabClick', tab);
    setActiveTab(tab);
    setSelectedBlockId(null);
    setSelectedSectionId(null);
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
              activeTab === 'elements' ? "bg-gray-900 text-white hover:bg-gray-900 hover:text-white" : "hover:bg-gray-500 hover:text-white"
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
        "flex flex-col flex-grow overflow-hidden transition-all duration-300",
        !isEditorMode ? "w-0 hidden" : "w-[346px]"
      )}>
        {/* Upper right: Label */}
        <div className="h-14 flex items-center px-4 border-b border-border min-h-14 flex-shrink-0">
          {selectedBlockId ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSelectedBlockId(null)}
                >
                  <ChevronLeft className="size-6" />
                </Button>
                <h2 className="text-lg font-bold truncate">
                  {findBlockInPage(data.view.pages[selectedPage], selectedBlockId)?.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h2>
              </div>
              <DeleteBlockDialog onDelete={handleDeleteBlock} />
            </div>
          ) : selectedSectionId ? (
            <div className="flex items-center gap-2 w-full">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSelectedSectionId(null)}
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
        <ScrollArea className="flex-grow overflow-y-auto">
          {renderTabContent()}
        </ScrollArea>
      </div>
    </div>
  );
}
