import { type Page, type ViewSection, type Block } from '@/types/offer';
import { cn, isBlockVisible } from '@/lib/utils';
import React, { useMemo, useRef } from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useContext } from 'react';
import { type PageView as OfferPageView, type PageSection, type FormSection } from '@/types/offer';
import { BlockConfig, FieldState, HookUsage, GlobalState, BlockContextType } from '@/types/blocks';
import { BlockContext } from '@/contexts/Numi';
import { blockTypes } from '@/components/blocks';
import { GlobalStateContext } from '@/pages/checkout-main';
import { useDroppable } from '@dnd-kit/core';
import cx from 'classnames';
import { rectSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { useEditor } from '@/pages/offers/Edit';

// Local interfaces that match the actual structure
interface LocalPageView extends OfferPageView {
    [key: string]: PageSection | FormSection | undefined;
}

function getBlockComponent(type: string): React.ComponentType<any> | null {
    // Return a simple component that shows the block type
    return ({ block }: { block: Block }) => (
        <div className="p-2 rounded">
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
}

interface SectionProps {
    section: PageSection | FormSection | undefined;
    sectionName: keyof LocalPageView;
    className?: string;
    selectedBlockId?: string | null;
    onSelectBlock?: (blockId: string) => void;
    onAddBlock?: (section: keyof LocalPageView, blockType: BlockType, index?: number) => void;

}

interface BlockRendererProps {
    block: Block;
    isSelected?: boolean;
    onSelect?: () => void;
    sectionName: keyof LocalPageView;
    index: number;
}

interface BlockDropZoneProps {
    sectionName: keyof LocalPageView;
    index: number;
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
    "id": "1x2-grid",
    "props": {
      "className": "grid grid-cols-1 md:grid-cols-2 h-full w-full"
    },
    "children": [
      {
        "type": "box",
        "id": "core-box",
        "props": {
          "className": "h-full overflow-hidden"
        },
        "children": [
          {
            "type": "flex",
            "id": "core-flex",
            "props": {
              "className": "flex flex-col h-full"
            },
            "children": [
              {
                "type": "flex",
                "id": "header",
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
  id: string;
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

    return <Component key={props.id} {...props}>{children}</Component>;
  }

  // Use a div
  return <div {...props}>{children}</div>;
};

const TailwindLayoutRenderer = ({
  layoutConfig,
  page,
  components = {}
}: TailwindLayoutRendererProps) => {

  // Use the config directly if it's an object, otherwise parse it
  const config = typeof layoutConfig === 'string'
    ? JSON.parse(layoutConfig)
    : layoutConfig;

  // Set up component registry
  const componentRegistry = {
    // Default components
    box: (props: ComponentProps) => {
      return (
        <div key={props.id} className={cn("relative", props.className)}>
          {props.children}
        </div>
      );
    },
    flex: (props: ComponentProps) => {
      return (
        <div key={props.id} className={cn('flex', props.className)}>
          {props.children}
        </div>
      )
    },
    grid: (props: ComponentProps) => {
      return (
        <div key={props.id} className={cn('grid', props.className)}>
          {props.children}
        </div>
      )
    },
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

  const {
    type,
    props = {},
    children = [],
    id
  } = element;
  const { componentRegistry, contentMap } = context;

  if (id && page?.view && id in page?.view) {
    // console.log('Found section for id:', id, page.view[id]);
    const section = page.view[id];
    return createElement(
      type,
      { ...props, id },
      <Section
        key={id}
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

  return createElement(type, { ...props, id: id || type }, childElements, componentRegistry);
};

// Update BlockRenderer to use our extended type
function BlockRenderer({ block, children }: {
  block: BlockConfig,
  children: (props: BlockContextType) => React.ReactNode
}) {
  const globalStateContext = useContext(GlobalStateContext);

  const { selectedBlockId, setSelectedBlockId, data } = useEditor();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: `block:${block.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // border: '1px dashed red',
    opacity: isDragging ? 0.5 : 1,
  };
  // console.log('BlockRenderer', { block, style, transform });

  if (!globalStateContext) {
    throw new Error('BlockRenderer must be used within a GlobalStateProvider');
  }

  const blockContext: BlockContextType = {
    theme: data?.theme,
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

  const handleClick = () => {
    console.log('BlockRenderer clicked:', block);
    if (block) {
      setSelectedBlockId(block.id)
    }
  }

  const isVisible = useMemo(() => {
    const visibility = block.appearance?.visibility;

   return isBlockVisible({ fields: globalStateContext.fields }, visibility?.fn);
  }, [block, globalStateContext]);

  if(!isVisible) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cx({
        "group relative cursor-pointer": true,
        "hover:outline hover:outline-2 hover:outline-blue-300": true,
        "outline outline-2 outline-blue-500": selectedBlockId === block.id,
      })}
      onClick={handleClick}>
      <BlockContext.Provider value={blockContext}>
        <div className={cx({
          "hidden group-hover:block absolute text-xs bg-gray-100 border font-semibold right-0 top-0": true,
          "!block": selectedBlockId === block.id,
        })}>{block.id}</div>
        {children(blockContext)}
      </BlockContext.Provider>
    </div>
  );
}

// Section Component
const Section = ({ section, sectionName: id, className, selectedBlockId, onSelectBlock }: SectionProps) => {

  const { setNodeRef, isOver, active } = useDroppable({
    id: `section:${id}`,
  })

  return (
    <div
      className={cn(
        "relative",
        className
      )}
    >
      <div className="">

      <SortableContext
        id={`section:${id}`}
        items={(section?.blocks || [])?.map(block => `block:${block.id}`)}
        strategy={rectSortingStrategy}
      >
        <div
         className={cx({
          "border border-transparent min-h-20" : true,
          'border-red-500': active,
          'border-blue-500': isOver,
        })}
        ref={setNodeRef}
        >
          {section.blocks?.map((block: Block, index: number) => {
            return (
              <BlockRenderer block={block as BlockConfig} key={`${block.id}-${index}`}>
                {(blockContext) => {
                    const Component = blockTypes[block.type as keyof typeof blockTypes];
                    return Component ? (
                      <Component context={blockContext} />
                    ) : (
                      <div className="text-xs text-purple-500 font-bold">
                        <pre>UNFINISHED: {JSON.stringify(block, null, 2)}</pre>
                      </div>
                    );
                }}
            </BlockRenderer>
            )
          })}
        </div>
        </SortableContext>
      </div>
    </div>
  );
};



export default function LayoutPreview({ page, selectedBlockId, onSelectBlock, onAddBlock }: LayoutPreviewProps) {
  const handleBlockSelect = (blockId: string) => {
    // console.log('Layout preview passing block selection:', blockId);
    onSelectBlock?.(blockId);
  };

  return (
    <div className="h-full w-full aspect-video bg-gray-50 overflow-hidden">
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

            />
          )
        }}
      />
    </div>
  );
}
