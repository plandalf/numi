import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { blockTypes, getBlockMeta, blockMetas } from '@/components/blocks';
import { findBlockInPage } from '@/components/offers/page-preview';
import { Inspector } from '@/components/offers/page-inspector';
import { useEditor } from '@/pages/offers/Edit';
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

type SidebarTab = 'elements' | 'inspector' | 'templates' | 'settings' | 'layers';

interface CustomElementIconProps {
  type: keyof typeof blockTypes;
}

const CustomElementIcon = ({ type }: CustomElementIconProps) => {
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
        case 'option_selector':
            return <ArrowLeft className="w-6 h-6 inline-block" />;
        case 'text_input':
            return <FormInput className="w-6 h-6" />;
        case 'checkout_summary':
            return <CreditCard className="w-6 h-6" />;
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
  } = useDraggable({
    id: `template:${blockType}`,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "flex flex-col items-center justify-center rounded-md cursor-move transition-all min-h-20 w-full",
      )}
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

export function Sidebar() {
  const [activeTab, setActiveTab] = useState<SidebarTab>('elements');
  const [searchQuery, setSearchQuery] = useState('');
  const {
    data,
    selectedPage,
    selectedBlockId,
    setSelectedBlockId,
    updateBlock,
    viewMode,
    setViewMode
  } = useEditor();

  const isEditorMode = viewMode === 'editor';

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
  ];

  const interactiveElements = [
    { type: 'button', title: 'Button' },
    { type: 'checkbox', title: 'Checkbox' },
    { type: 'option_selector', title: 'Option Slide' },
    { type: 'text_input', title: 'Entry Field' },
  ];

  const paymentElements = [
    { type: 'checkout_summary', title: 'Payment' },
  ];

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
            <div className="relative mb-8">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                className="pl-10 h-12 rounded-lg"
                placeholder="Search for elements" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

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
      case 'layers': {
        // Get blocks for the selected page
        const page = data.view.pages[selectedPage];
        const blocks: Block[] = [];
        if (page && page.view) {
          Object.values(page.view).forEach((section: any) => {
            if (section && Array.isArray(section.blocks)) {
              blocks.push(...section.blocks);
            }
          });
        }
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col gap-3">
                {blocks.length === 0 ? (
                  <div className="text-muted-foreground text-center py-8">No blocks on this page.</div>
                ) : (
                  blocks.map((block, idx) => {
                    const meta = getBlockMeta(block.type as keyof typeof blockTypes);
                    return (
                      <button
                        key={block.id}
                        className={cn(
                          'flex items-center justify-between w-full px-4 py-2 rounded-lg bg-[#EBEFFF] hover:bg-[#EBEFFF]/75 transition-colors group cursor-pointer',
                          selectedBlockId === block.id && 'ring-2 ring-primary bg-primary/10'
                        )}
                        onClick={() => setSelectedBlockId(block.id)}
                        type="button"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium text-sm text-left text-black/90">
                            {meta?.title ?? block.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} {blocks.length > 1 ? idx + 1 : ''}
                          </span>
                          <CircleChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              <Button
                variant="default"
                className="w-full mt-6 bg-gray-900 text-white hover:bg-gray-800 flex items-center justify-center gap-2"
                onClick={() => setActiveTab('elements')}
              >
                <span>Add another element</span>
                <DiamondPlus className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 flex-shrink-0">
              <Button
                variant="outline"
                className="w-full flex items-center justify-between"
                type="button"
              >
                Save experience as a new template
                <SquarePlus className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        );
      }
      case 'templates':
        return (
          <div className="p-4">
            <h3 className="text-md font-medium">Templates</h3>
            <p className="text-xs text-muted-foreground mt-2">
              Coming soon - Save and reuse sections of your pages.
            </p>
          </div>
        );
      case 'settings':
        return (
          <div className="p-4">
            <h3 className="text-md font-medium">Page Settings</h3>
            <p className="text-xs text-muted-foreground mt-2">
              Configure the settings for the current page.
            </p>
          </div>
        );
      case 'inspector':
        return (
          <div className="p-4">
            <h3 className="text-md font-medium">Notifications</h3>
            <p className="text-xs text-muted-foreground mt-2">
              You have no new notifications.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

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
            onClick={() => setActiveTab('elements' as SidebarTab)}
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
                onClick={() => {
                  setActiveTab(button.tab as SidebarTab);
                  setSelectedBlockId(null);
                }}
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
        <div className="flex-grow overflow-y-auto">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
} 