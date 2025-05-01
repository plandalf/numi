import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { blockTypes, getBlockMeta, blockMetas } from '@/components/blocks';
import { findBlockInPage } from '@/components/offers/page-preview';
import { Inspector } from '@/components/offers/page-inspector';
import { EditProps } from '@/pages/offers/edit';
import { useEditor } from '@/contexts/offer/editor-context';
import { Block } from '@/types/offer';
import {
  Type,
  SquareStack,
  Image as ImageIcon,
  CreditCard,
  List,
  Bell,
  X,
  DiamondPlus,
  LayoutPanelLeft,
  Paintbrush,
  Unplug,
  Settings2,
  Package,
  MessageSquare,
  Play,
  AlignLeft,
  ArrowLeft,
  ArrowRight,
  SquareCheck,
  FormInput,
  ToggleLeft,
  Search,
  ChevronLeft,
  CircleChevronRight,
  SquarePlus
} from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageTheme from './page-theme';
import { ScrollArea } from '../ui/scroll-area';
import SearchBar from './search-bar';
import { usePage } from '@inertiajs/react';
import cx from 'classnames';
import { PageLayers } from './page-layers';
import PageProducts from './page-products';

type SidebarTab = 'elements' | 'products' | 'themes' | 'settings' | 'layers';

interface CustomElementIconProps {
  type: keyof typeof blockTypes;
}

export const CustomElementIcon = ({ type }: CustomElementIconProps) => {
    switch(type) {
        case 'text':
            return <AlignLeft className="w-6 h-6" />;
        case 'quote':
            return <MessageSquare className="w-6 h-6" />;
        case 'detail_list':
            return <LayoutPanelLeft className="w-6 h-6" />;
        case 'button':
            return <SquareStack className="w-6 h-6" />;
        case 'checkbox':
            return <SquareCheck className="w-6 h-6" />;
        case 'text_input':
            return <FormInput className="w-6 h-6" />;
        case 'checkout_summary':
            return <CreditCard className="w-6 h-6" />;
        case 'option_selector':
            return <ToggleLeft className="w-6 h-6" />;
        default:
            return null;
    }
};

// BlockTemplateItem component with revamped UI for card style
interface BlockItemProps {
  blockType: string;
  title: string;
}

const BlockTemplateItem = ({ blockType, title }: BlockItemProps) => {

  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: `template:${blockType}`,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cx({
        "flex flex-col items-center justify-center rounded-md cursor-move transition-all min-h-20 w-full": true,
        "opacity-60": isDragging,
      })}
    >
      <div className="flex items-center justify-center bg-slate-800 rounded-md w-full h-14 mb-2">
        <span className="text-white">
          <CustomElementIcon type={blockType as keyof typeof blockTypes} />
        </span>
      </div>
      <span className="text-sm text-black">{title}</span>
    </div>
  );
};

// Category section component
interface ElementCategoryProps {
  title: string;
  children: React.ReactNode;
}

const ElementCategory = ({ title, children }: ElementCategoryProps) => {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <h3 className="text-sm text-black/50 font-light">{title}</h3>
      <div className="grid grid-cols-3 gap-2">
        {children}
      </div>
    </div>
  );
};

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

// Mapping for block elements
const baseElements = [
  { type: 'text', title: 'Text Block' },
  { type: 'quote', title: 'Quote' },
  { type: 'detail_list', title: 'Detail List' },
  { type: 'option_selector', title: 'Plan Selector' },
];

const interactiveElements = [
  { type: 'button', title: 'Button' },
  { type: 'checkbox', title: 'Checkbox' },
  { type: 'text_input', title: 'Entry Field' },
];

const paymentElements = [
  { type: 'checkout_summary', title: 'Payment' },
];

export const allElementTypes = [
  ...baseElements,
  ...interactiveElements,
  ...paymentElements,
];


export function Sidebar() {
  const [activeTab, setActiveTab] = useState<SidebarTab>('elements');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    globalThemes,
    organizationThemes,
    data,
    setData,
    selectedPage,
    selectedBlockId,
    setSelectedBlockId,
    updateBlock,
    viewMode,
  } = useEditor();

  const isEditorMode = viewMode === 'editor';

  // Content for each tab
  const renderTabContent = () => {
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
        // Filter elements based on search query
        const filteredBaseElements = baseElements.filter(element =>
          element.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          element.type.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const filteredInteractiveElements = interactiveElements.filter(element =>
          element.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          element.type.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const filteredPaymentElements = paymentElements.filter(element =>
          element.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          element.type.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Check if any category has elements after filtering
        const hasBaseElements = filteredBaseElements.length > 0;
        const hasInteractiveElements = filteredInteractiveElements.length > 0;
        const hasPaymentElements = filteredPaymentElements.length > 0;

        return (
          <div className="p-4 space-y-6 overflow-y-auto">
            <SearchBar
              placeholder="Search for elements"
              value={searchQuery}
              onChange={setSearchQuery}
            />

            {searchQuery && !hasBaseElements && !hasInteractiveElements && !hasPaymentElements ? (
              <div className="text-center py-8 text-muted-foreground">
                No elements found matching "{searchQuery}"
              </div>
            ) : (
              <>
                {(hasBaseElements || !searchQuery) && (
                  <ElementCategory title="Base Elements">
                    {filteredBaseElements.map((element) => (
                      <BlockTemplateItem
                        key={element.type}
                        blockType={element.type}
                        title={element.title}
                      />
                    ))}
                  </ElementCategory>
                )}

                {(hasInteractiveElements || !searchQuery) && (
                  <ElementCategory title="Interactive Elements">
                    {filteredInteractiveElements.map((element) => (
                      <BlockTemplateItem
                        key={element.type}
                        blockType={element.type}
                        title={element.title}
                      />
                    ))}
                  </ElementCategory>
                )}

                {(hasPaymentElements || !searchQuery) && (
                  <ElementCategory title="Payments">
                    {filteredPaymentElements.map((element) => (
                      <BlockTemplateItem
                        key={element.type}
                        blockType={element.type}
                        title={element.title}
                      />
                    ))}
                  </ElementCategory>
                )}
              </>
            )}
          </div>
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
          <div className="p-4">
            <h3 className="text-md font-medium">Page Settings</h3>
            <p className="text-xs text-muted-foreground mt-2">
              Coming soon - Configure the settings for the current page.
            </p>
          </div>
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
    setActiveTab(tab);
    setSelectedBlockId(null);
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
            <div className="flex items-center gap-2 w-full">
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
