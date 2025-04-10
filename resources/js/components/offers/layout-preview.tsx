import { type Page, type ViewSection, type Block } from '@/types/offer';
import { cn } from '@/lib/utils';
import React, { useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Head } from '@inertiajs/react';
import { useEffect, useState, createContext, useContext } from 'react';
import { type PageType, type OfferConfiguration, type OfferVariant, Branch, type PageView as OfferPageView, type PageSection, type FormSection } from '@/types/offer';
import { BlockConfig, FieldState, HookUsage, GlobalState, BlockContextType } from '@/types/blocks';
import { BlockContext } from '@/contexts/Numi';
import { blockTypes } from '@/components/blocks';

// Local interfaces that match the actual structure
interface LocalPageView extends OfferPageView {
    [key: string]: PageSection | FormSection | undefined;
}

function getBlockComponent(type: string): React.ComponentType<any> | null {
    // Return a simple component that shows the block type
    return ({ block }: { block: Block }) => (
        <div className="p-2 border border-dashed border-gray-300 rounded">
            <div className="text-xs text-gray-500">{type}</div>
            {block.content?.value && (
                <div className="mt-1">{block.content.value}</div>
            )}
        </div>
    );
}

interface LocalPage extends Omit<Page, 'view'> {
    view: LocalPageView;
}

// BlockType interface
export interface BlockType {
    id: string;
    name: string;
    icon: React.ReactNode;
    create: () => Block;
}

// DND type constants
export const DRAG_TYPES = {
    NEW_BLOCK: 'new-block',
    EXISTING_BLOCK: 'existing-block'
};

interface LayoutPreviewProps {
    page: LocalPage;
    selectedBlockId?: string | null;
    onSelectBlock?: (blockId: string) => void;
    onAddBlock?: (section: keyof LocalPageView, blockType: BlockType, index?: number) => void;
    onMoveBlock?: (fromSection: keyof LocalPageView, fromIndex: number, toSection: keyof LocalPageView, toIndex: number) => void;
}

interface SectionProps {
    section: PageSection | FormSection | undefined;
    sectionName: keyof LocalPageView;
    className?: string;
    selectedBlockId?: string | null;
    onSelectBlock?: (blockId: string) => void;
    onAddBlock?: (section: keyof LocalPageView, blockType: BlockType, index?: number) => void;
    onMoveBlock?: (fromSection: keyof LocalPageView, fromIndex: number, toSection: keyof LocalPageView, toIndex: number) => void;
}

interface BlockRendererProps {
    block: Block;
    isSelected?: boolean;
    onSelect?: () => void;
    sectionName: keyof LocalPageView;
    index: number;
    onMoveBlock?: (fromSection: keyof LocalPageView, fromIndex: number, toSection: keyof LocalPageView, toIndex: number) => void;
}

interface BlockDropZoneProps {
    sectionName: keyof LocalPageView;
    index: number;
    onDropBlock: (section: keyof LocalPageView, blockType: BlockType, index: number) => void;
    onMoveBlock?: (fromSection: keyof LocalPageView, fromIndex: number, toSection: keyof LocalPageView, toIndex: number) => void;
}

interface TailwindLayoutConfig {
  name?: string;
  template: {
    type: string;
    props?: Record<string, any>;
    children?: Array<any>;
    id?: string;
  };
}

interface TailwindLayoutRendererProps {
  layoutConfig: TailwindLayoutConfig | string;
  contentMap?: Record<string, React.ReactNode>;
  page: LocalPage;
  components?: Record<string, React.ComponentType<any>>;
}

const layoutConfig = {
  "name": "SplitCheckout@v1.1",
  "template": {
    "type": "grid",
    "props": {
      "className": "grid grid-cols-1 md:grid-cols-2 h-full w-full"
    },
    "children": [
      {
        "type": "box",
        "props": {
          "className": "h-full overflow-hidden"
        },
        "children": [
          {
            "type": "flex",
            "props": {
              "className": "flex flex-col h-full"
            },
            "children": [
              {
                "type": "flex",
                "props": {
                  "className": "flex flex-col flex-grow space-y-6 p-6 overflow-y-auto"
                },
                "children": [
                  {
                    "id": "title",
                    "type": "box",
                    "props": {
                      "className": "space-y-1"
                    }
                  },
                  {
                    "id": "content",
                    "type": "flex",
                    "props": {
                      "className": "flex flex-col flex-grow space-y-2"
                    }
                  }
                ]
              },
              {
                "id": "action",
                "type": "box",
                "props": {
                  "className": "p-6 bg-white border-t"
                }
              }
            ]
          }
        ]
      },
      {
        "id": "promo",
        "type": "box",
        "props": {
          "className": "hidden md:block bg-blue-50 h-full overflow-y-auto"
        }
      }
    ]
  }
}

type ComponentProps = React.HTMLAttributes<HTMLElement> & {
  className?: string;
  [key: string]: any;
};

type ComponentRegistry = {
  [key: string]: React.ComponentType<any>;
};

// Create the appropriate element based on type
const createElement = (
  type: string,
  props: ComponentProps,
  children: React.ReactNode,
  componentRegistry: ComponentRegistry
) => {
  // If we have a custom component registered for this type, use it
  if (componentRegistry[type]) {
    const Component = componentRegistry[type];
    return <Component {...props}>{children}</Component>;
  }

  // Use a div
  return <div {...props} style={{ outline: '1px dashed red' }}>{children}</div>;
};

const TailwindLayoutRenderer = ({ 
  layoutConfig, 
  page, 
  components = {} 
}: TailwindLayoutRendererProps) => {
  console.log('TailwindLayoutRenderer page:', page);
  console.log('TailwindLayoutRenderer page.view:', page.view);
  
  // Use the config directly if it's an object, otherwise parse it
  const config = typeof layoutConfig === 'string' 
    ? JSON.parse(layoutConfig) 
    : layoutConfig;
  
  // Set up component registry
  const componentRegistry = {
    // Default components
    box: (props: ComponentProps) => {
      console.log('Rendering box with props:', props);
      return (
        <div {...props} className={cn("relative border border-dashed border-gray-300", props.className)}>
          {props.children}
        </div>
      );
    },
    flex: (props: ComponentProps) => (
      <div {...props} className={cn("flex border border-dashed border-gray-300", props.className)}>
        {props.children}
      </div>
    ),
    grid: (props: ComponentProps) => (
      <div {...props} className={cn("grid border border-dashed border-gray-300", props.className)}>
        {props.children}
      </div>
    ),
    // Custom components from props
    ...components
  };

  // Render the template
  return renderElement(config.template, page, { componentRegistry, contentMap: {} });
};

// Helper function to render an element based on its type and props
const renderElement = (
  element: {
    type: string;
    props?: ComponentProps;
    children?: Array<any>;
    id?: string;
  } | null,
  page: LocalPage,
  context: {
    componentRegistry: ComponentRegistry;
    contentMap: Record<string, React.ReactNode>;
  }
): React.ReactNode => {
  if (!element) return null;
  
  const { type, props = {}, children = [], id } = element;
  const { componentRegistry, contentMap } = context;
  
  console.log('Rendering element:', { type, id, props });
  console.log('Page view:', page.view);
  
  if (id && id in page.view) {
    console.log('Found section for id:', id, page.view[id]);
    const section = page.view[id];
    return createElement(
      type,
      { ...props, id },
      <Section 
        section={section} 
        sectionName={id as keyof LocalPageView} 
        className={props.className} 
      />,
      componentRegistry
    );
  }
  
  const childElements = Array.isArray(children) 
    ? children.map((child, index) => renderElement(
        child,
        page,
        context
      ))
    : null;
  
  return createElement(type, { ...props, key: id || `${type}` }, childElements, componentRegistry);
};

// Extend the GlobalState type to match our implementation
interface PreviewGlobalState extends Omit<GlobalState, 'registerHook' | 'hookUsage'> {
    registerHook: (block: BlockConfig, hook: HookUsage) => void;
    hookUsage: Record<string, HookUsage[]>;
}

// Create GlobalStateContext with our extended type
const GlobalStateContext = createContext<PreviewGlobalState | null>(null);

function GlobalStateProvider({ offer, children }: { offer: OfferConfiguration, children: React.ReactNode }) {
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({});
  const [hookUsage, setHookUsage] = useState<Record<string, HookUsage[]>>({});
  const [registeredHooks, setRegisteredHooks] = useState<Set<string>>(new Set());

  const updateFieldState = (blockId: string, fieldName: string, value: any) => {
    setFieldStates(prev => ({
      ...prev,
      [`${blockId}:${fieldName}`]: { 
        blockId, 
        fieldName, 
        value, 
        type: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string' 
      }
    }));
  };

  const getFieldState = (blockId: string, fieldName: string) => {
    return fieldStates[`${blockId}:${fieldName}`];
  };

  const registerHook = (block: BlockConfig, hook: HookUsage) => {
    const hookKey = `${block.id}:${hook.name}`;
    if (!registeredHooks.has(hookKey)) {
      setRegisteredHooks(prev => new Set([...prev, hookKey]));
      setHookUsage(prev => ({
        ...prev,
        [block.id]: [...(prev[block.id] || []), hook]
      }));
    }
  };

  const value: PreviewGlobalState = {
    fieldStates,
    updateFieldState,
    getFieldState,
    registerHook,
    hookUsage
  };

  return (
    <GlobalStateContext.Provider value={value}>
      {children}
    </GlobalStateContext.Provider>
  );
}

// Update BlockRenderer to use our extended type
function BlockRenderer({ block, children }: { 
  block: BlockConfig, 
  children: (props: BlockContextType) => React.ReactNode 
}) {
  const globalStateContext = useContext(GlobalStateContext);
  if (!globalStateContext) {
    throw new Error('BlockRenderer must be used within a GlobalStateProvider');
  }
  
  const blockContext: BlockContextType = {
    blockId: block.id,
    blockConfig: block,
    globalState: globalStateContext as unknown as GlobalState,
    registerField: (fieldName, defaultValue) => {
      if (!globalStateContext.getFieldState(block.id, fieldName)) {
        globalStateContext.updateFieldState(block.id, fieldName, defaultValue);
      }
    },
    getFieldValue: (fieldName) => {
      return globalStateContext.getFieldState(block.id, fieldName)?.value;
    },
    setFieldValue: (fieldName, value) => {
      globalStateContext.updateFieldState(block.id, fieldName, value);
    },
    registerHook: (hook) => {
      globalStateContext.registerHook(block, hook);
    }
  };

  return (
    <BlockContext.Provider value={blockContext}>
      {children(blockContext)}
    </BlockContext.Provider>
  );
}

// Section Component
const Section = ({ section, sectionName, className, selectedBlockId, onSelectBlock, onAddBlock, onMoveBlock }: SectionProps) => {
    if (!section) return null;

    console.log('Rendering section:', { sectionName, section });

    // Handle form sections differently if needed
    if ('fields' in section) {
        return (
            <div
                className={cn(
                    "relative min-h-4 bg-gray-100/50 border border-dashed border-gray-400",
                    className
                )}
            >
                <div className="absolute top-0 left-0 bg-gray-200 px-2 py-0.5 text-xs font-mono">
                    {sectionName} (form)
                </div>
                <div className="absolute inset-0 pt-6 p-4 overflow-auto">
                    <div className="space-y-1">
                        Form fields will be rendered here
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "relative min-h-4 bg-gray-100/50 border border-dashed border-gray-400",
                className
            )}
        >
            <div className="absolute top-0 left-0 bg-gray-200 px-2 py-0.5 text-xs font-mono">
                {sectionName}
            </div>
            <div className="absolute inset-0 pt-6 p-4 overflow-auto">
                <div className="space-y-1">
                    {onAddBlock && (
                        <BlockDropZone
                            sectionName={sectionName}
                            index={0}
                            onDropBlock={onAddBlock}
                            onMoveBlock={onMoveBlock}
                        />
                    )}

                    {section.blocks?.map((block: Block, index: number) => (
                        <div key={block.id || index} className="relative" data-section={sectionName} data-index={index}>
                            <BlockRenderer block={block as BlockConfig}>
                                {(blockContext) => {
                                    const Component = blockTypes[block.type as keyof typeof blockTypes];
                                    return Component ? (
                                        <div 
                                            className={cn(
                                                "relative group cursor-move rounded-sm transition-all z-10",
                                                "hover:ring-2 hover:ring-primary/20",
                                                block.id === selectedBlockId && "ring-2 ring-primary"
                                            )}
                                            onClick={() => block.id && onSelectBlock?.(block.id)}
                                        >
                                            <Component context={blockContext} />
                                            <div className={cn(
                                                "absolute -right-2 -top-2 px-1.5 py-0.5 rounded text-[10px] font-mono opacity-0 bg-primary text-primary-foreground",
                                                "group-hover:opacity-100",
                                                block.id === selectedBlockId && "opacity-100",
                                                "z-20"
                                            )}>
                                                {block.type}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-purple-500 font-bold">
                                            <pre>UNFINISHED: {block.type}</pre>
                                        </div>
                                    );
                                }}
                            </BlockRenderer>

                            {onAddBlock && (
                                <BlockDropZone
                                    sectionName={sectionName}
                                    index={index + 1}
                                    onDropBlock={onAddBlock}
                                    onMoveBlock={onMoveBlock}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const BlockDropZone = ({ sectionName, index, onDropBlock, onMoveBlock }: BlockDropZoneProps) => {
    const dropRef = useRef<HTMLDivElement>(null);
    const [{ isOver, canDrop, isDragging }, drop] = useDrop(() => ({
        accept: [DRAG_TYPES.NEW_BLOCK, DRAG_TYPES.EXISTING_BLOCK],
        drop: (item: { blockType?: BlockType; fromSection?: keyof LocalPageView; fromIndex?: number }) => {
            if (item.blockType) {
                // Handle new block drop
                console.log('Dropping new block:', item.blockType);
                onDropBlock(sectionName, item.blockType, index);
            } else if (item.fromSection && typeof item.fromIndex === 'number') {
                // Handle existing block move
                console.log('Moving block from', item.fromSection, item.fromIndex, 'to', sectionName, index);
                onMoveBlock?.(item.fromSection, item.fromIndex, sectionName, index);
            }
        },
        collect: monitor => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
            isDragging: !!monitor.getItem()
        })
    }), [sectionName, index, onDropBlock]);

    drop(dropRef);
    const isActive = isOver && canDrop;

    return (
        <div
            ref={dropRef}
            className={cn(
                "h-1 transition-all duration-200",
                isDragging && (
                    isOver
                        ? "h-6 -mx-2 my-2 border-2 border-dashed border-primary bg-primary/10 scale-y-125"
                        : "hover:h-6 hover:-mx-2 hover:my-2 hover:border-2 hover:border-dashed hover:border-primary/20"
                ),
                "group cursor-copy"
            )}
        >
            {isDragging && (isOver || dropRef.current?.matches(':hover')) && (
                <div className={cn(
                    "flex items-center justify-center h-full text-xs",
                    isActive ? "text-primary" : "text-primary/40"
                )}>
                    <span>Drop here</span>
                </div>
            )}
        </div>
    );
};

export default function LayoutPreview({ page, selectedBlockId, onSelectBlock, onAddBlock, onMoveBlock }: LayoutPreviewProps) {
    const handleBlockSelect = (blockId: string) => {
        console.log('Layout preview passing block selection:', blockId);
        onSelectBlock?.(blockId);
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <GlobalStateProvider offer={page as unknown as OfferConfiguration}>
                <div className="w-full aspect-video bg-gray-50 overflow-hidden">
                    <TailwindLayoutRenderer
                        layoutConfig={layoutConfig}
                        page={page}
                        components={{
                            Section: ({ section, sectionName, className }: SectionProps) => (
                                <Section
                                    section={section}
                                    sectionName={sectionName}
                                    className={className}
                                    selectedBlockId={selectedBlockId}
                                    onSelectBlock={handleBlockSelect}
                                    onAddBlock={onAddBlock}
                                    onMoveBlock={onMoveBlock}
                                />
                            )
                        }}
                    />
                </div>
            </GlobalStateProvider>
        </DndProvider>
    );
}