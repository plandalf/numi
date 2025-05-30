import { type Page, type Block } from '@/types/offer';
import { isBlockVisible } from '@/lib/blocks';
import { cn } from '@/lib/utils';
import React, { CSSProperties, useMemo, useCallback, useEffect } from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useContext } from 'react';
import { type PageSection, type FormSection } from '@/types/offer';
import { BlockConfig, GlobalState, BlockContextType } from '@/types/blocks';
import Numi, { BlockContext } from '@/contexts/Numi';
import { blockTypes } from '@/components/blocks';
import { GlobalStateContext } from '@/pages/checkout-main';
import { useDroppable } from '@dnd-kit/core';
import cx from 'classnames';
import { rectSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { useEditor } from '@/contexts/offer/editor-context';
import { hasVisibilityCondition as hasVisibilityConditionFn } from "@/lib/blocks";
import { Badge } from '../ui/badge';
import { Theme } from '@/types/theme';
import { resolveThemeValue } from '@/lib/theme';

// Local interfaces that match the actual structure
interface LocalPageView {
    [key: string]: PageSection | FormSection | undefined;
}

interface LocalPage extends Omit<Page, 'view'> {
    view: LocalPageView;
    onSelectBlock?: (blockId: string) => void;
    onAddBlock?: (section: keyof LocalPageView, blockType: BlockType, index?: number) => void;
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
    theme: Theme;
    selectedBlockId?: string | null;
    onSelectBlock?: (blockId: string) => void;
    onAddBlock?: (section: keyof LocalPageView, blockType: BlockType, index?: number) => void;
}

interface SectionProps {
    section: PageSection | FormSection | undefined;
    sectionName: keyof LocalPageView;
    className?: string;
    style?: CSSProperties;
}

interface TailwindLayoutConfig {
  name?: string;
  template: {
    type: string;
    props?: Record<string, unknown>;
    children?: Array<TailwindLayoutConfig['template'] | string>;
    id?: string;
  };
}

interface TailwindLayoutRendererProps {
  layoutConfig: TailwindLayoutConfig | string;
  contentMap?: Record<string, React.ReactNode>;
  page: LocalPage;
  theme: Theme;
  components?: ComponentRegistry;
  onBlockSelect?: (blockId: string) => void;
  onSectionSelect?: (sectionId: string) => void;
}

const layoutConfig: TailwindLayoutConfig = {
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
                  "className": "flex flex-col flex-grow overflow-y-auto"
                },
                "children": [
                  {
                    "id": "title",
                    "type": "box",
                    "props": {
                      "className": "space-y-1 p-6"
                    }
                  },
                  {
                    "id": "content",
                    "type": "flex",
                    "props": {
                      "className": "flex flex-col flex-grow space-y-2 p-6"
                    }
                  }
                ]
              },
              {
                "id": "action",
                "type": "box",
                "props": {
                  "className": "p-6"
                }
              }
            ]
          }
        ]
      },
      {
        "type": "box",
        "id": "promo_box",
        "props": {
          "className": "hidden md:flex h-full overflow-y-auto flex-col"
        },
        "children": [
          {
            "id": "promo_header",
            "type": "box",
            "props": {
              "className": "h-auto p-6"
            }
          },
          {
            "id": "promo_content",
            "type": "box",
            "props": {
              "className": "h-full flex flex-col flex-grow space-y-2 p-6"
            }
          }
        ]
      }
    ]
  }
}

type ComponentProps = React.HTMLAttributes<HTMLElement> & {
  className?: string;
  id: string;
  [key: string]: unknown;
};

type ComponentRegistry = {
  [key: string]: React.ComponentType<ComponentProps>;
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
    // Ensure key is part of props if available, otherwise React might warn for components from registry
    return <Component {...props}>{children}</Component>;
  }

  // Use a div
  return <div {...props}>{children}</div>;
};

interface RecursiveRenderElementProps {
  element: {
    type: string;
    props?: ComponentProps;
    children?: Array<RecursiveRenderElementProps['element']>;
    id?: string;
  } | null;
  page: LocalPage;
  theme: Theme;
  componentRegistry: ComponentRegistry;
  selectedSectionId: string | null | undefined;
  onBlockSelect?: (blockId: string) => void;
  onSectionSelect?: (sectionId: string) => void;
  isContained?: boolean;
}

const RecursiveRenderElement: React.FC<RecursiveRenderElementProps> = React.memo(({
  element,
  page,
  theme,
  componentRegistry,
  selectedSectionId,
  onBlockSelect,
  onSectionSelect,
  isContained,
}) => {
  
  const sectionContainerStyle = useMemo(() => {
    if (!element?.id || !page?.view || !(element.id in page.view)) return {};
    const section = page.view[element.id] as PageSection;

    const backgroundColor = isContained ? section.style?.backgroundColor : resolveThemeValue(section.style?.backgroundColor, theme, 'canvas_color');
    const padding = section.appearance?.padding;
    const margin = section.appearance?.margin;
    const backgroundImage = section.style?.backgroundImage;
    const hidden = section.style?.hidden;
    const borderRadius = section.style?.borderRadius;

    return {
      backgroundColor,
      padding,
      borderRadius: borderRadius,
      margin: margin === 'none' ? '0px' : margin,
      ...(backgroundImage ? {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      } : {}),
      ...(hidden ? {display: 'none'} : {}),
    };
  }, [element?.id, page?.view, theme]);

  const sectionStyle = useMemo(() => {
    if (!element?.id || !page?.view || !(element.id in page.view)) return {};
    const section = page.view[element.id] as PageSection;
    const spacing = section.appearance?.spacing;
    return { gap: spacing };
  }, [element?.id, page?.view]);

  if (!element) return null;

  const { type, props = {} as ComponentProps, children = [], id } = element;

  const sectionProps = {
    ...props,
    id,
    style: { ...props.style, ...sectionContainerStyle },
    className: cn(
      "relative",
      props.className,
      selectedSectionId === id && 'shadow-[inset_0_0_0_1.5px_#3B82F6]'
    )
  };

  const childElements = Array.isArray(children)
    ? children
        .filter(Boolean)
        .map((child, index) => (
        <RecursiveRenderElement
          key={child!.id || `${child!.type}-${index}`}
          element={child}
          page={page}
          componentRegistry={componentRegistry}
          selectedSectionId={selectedSectionId}
          onBlockSelect={onBlockSelect}
          onSectionSelect={onSectionSelect}
          theme={theme}
          isContained={(page.view[element.id ?? ''] as PageSection)?.asContainer ?? false}
        />
      ))
    : null;

  if (id && page?.view && id in page.view) {
    const sectionData = page.view[id];

    return createElement(
      type,
      sectionProps as ComponentProps,
      <Section
        key={id}
        section={sectionData}
        sectionName={id as keyof LocalPageView}
        style={sectionStyle}
        onBlockSelect={onBlockSelect}
        children={childElements}
      />,
      componentRegistry
    );
  }

  return createElement(type, sectionProps as ComponentProps, childElements, componentRegistry);
});
RecursiveRenderElement.displayName = 'RecursiveRenderElement';

const TailwindLayoutRenderer = ({
  layoutConfig,
  page,
  components = {},
  onBlockSelect,
  theme,
}: Omit<TailwindLayoutRendererProps, 'onSectionSelect'>) => {
  const config = typeof layoutConfig === 'string'
    ? JSON.parse(layoutConfig)
    : layoutConfig;

  const componentRegistry = useMemo(() => ({
    box: (props: ComponentProps) => <div key={props.id} className={cn("relative", props.className)} style={props.style}>{props.children}</div>,
    flex: (props: ComponentProps) => <div key={props.id} className={cn('flex', props.className)} style={props.style}>{props.children}</div>,
    grid: (props: ComponentProps) => <div key={props.id} className={cn('grid', props.className)} style={props.style}>{props.children}</div>,
    ...components
  }), [components]);

  const { selectedSectionId, setSelectedSectionId } = useEditor();

  // console.log(`TailwindLayoutRenderer rendering. Context selectedSectionId: ${selectedSectionId}`);

  return (
    <RecursiveRenderElement
      element={config.template}
      page={page}
      theme={theme}
      componentRegistry={componentRegistry}
      selectedSectionId={selectedSectionId}
      onBlockSelect={onBlockSelect}
      onSectionSelect={setSelectedSectionId}
    />
  );
};

// Update BlockRenderer to use our extended type
const BlockRendererComponent = ({ block, children, onBlockSelect }: {
  block: BlockConfig,
  children: (props: BlockContextType) => React.ReactNode,
  onBlockSelect?: (blockId: string) => void
}) => {
  const globalStateContext = useContext(GlobalStateContext);

  const { selectedBlockId, setSelectedBlockId, theme } = useEditor();
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
    theme,
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
    if (block) {
      setSelectedBlockId(block.id)
      onBlockSelect?.(block.id);
    }
  }

  const isVisible = useMemo(() => {
    if (!globalStateContext) return true; // Or handle error appropriately
    const visibility = block.appearance?.visibility;
    return isBlockVisible({ fields: globalStateContext.fields }, visibility);
  }, [block, globalStateContext]);

  const hasVisibilityCondition = useMemo(() => hasVisibilityConditionFn(block.appearance?.visibility), [block.appearance?.visibility]);

  // Show for input blocks
  const hideBlockId = !['text_input', 'checkbox', 'checkout_summary'].includes(block.type);

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
        {/* {!hideBlockId && (
          <div className={cx({
            "hidden group-hover:block absolute text-xs bg-gray-100 border font-semibold right-0 top-0": true,
            "!block": selectedBlockId === block.id,
            "opacity-50": !isVisible,
          })}>{block.id}</div>
        )} */}
        {children(blockContext)}
        {hasVisibilityCondition && <Badge variant="outline" className={cn("absolute top-0 right-0", {
          "bg-green-500 text-white": isVisible,
          "bg-red-500 text-white": !isVisible,
        })}>Conditional: {isVisible ? 'visible' : 'hidden'}</Badge>}
      </BlockContext.Provider>
    </div>
  );
}
const MemoizedBlockRenderer: React.FC<React.ComponentProps<typeof BlockRendererComponent>> = React.memo(BlockRendererComponent);

// Section Component
interface SectionPropsExtended extends SectionProps {
  onBlockSelect?: (blockId: string) => void;
  children?: React.ReactNode;
}

const SectionComponent = ({ section, sectionName: id, style, onBlockSelect, children }: SectionPropsExtended) => {
  const { setNodeRef, isOver, active } = useDroppable({
    id: `section:${id}`,
  });

  const blocksToRender = useMemo(() => {
    if (section && 'blocks' in section && Array.isArray(section.blocks)) {
      return section.blocks as Block[];
    }
    return [];
  }, [section]);

  const sortableItems = useMemo(() => {
    return blocksToRender.map(block => `block:${block.id}`);
  }, [blocksToRender]);

  // Check if the currently dragged item's ID matches this section's droppable ID.
  // const isActiveSectionDragTarget = active ? active.id === `section:${id}` : false;
  if (isOver) {
    console.log('active', isOver);
  }
  // isOver is already a boolean indicating if a draggable is over this droppable.
  const isOverDroppable = isOver;

  // If the section is a container, it is not draggable.
  const isDraggable = !(section as PageSection)?.asContainer;

  const component = (
    <div
     className={cx({
        "flex flex-col min-h-full w-full h-full" : true,
        'outline outline-dotted outline-gray-200 !min-h-4': blocksToRender.length === 0,
        'outline outline-dashed outline-blue-100 !min-h-4': active,
        'outline outline-dashed outline-blue-400': isOverDroppable,
      })}
      ref={isDraggable ? setNodeRef : undefined}
      style={style}
    >
      {blocksToRender.length > 0 ? blocksToRender.map((block: Block) => {
        return (
          <MemoizedBlockRenderer
            block={block as BlockConfig}
            key={block.id}
            onBlockSelect={onBlockSelect}
          >
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
          </MemoizedBlockRenderer>
        )
      }) : children}
    </div>
  );

  return (
    isDraggable ? (
      <SortableContext
        id={`section:${id}`}
        items={sortableItems}
        strategy={rectSortingStrategy}
      >
        {component}
      </SortableContext>
    ) : component
  );
};
const Section = React.memo(SectionComponent);

export default function LayoutPreview({ page, selectedBlockId, onSelectBlock, theme }: LayoutPreviewProps) {
  const { setSelectedBlockId: setContextSelectedBlockId } = useEditor(); // Get setSelectedBlockId from context

  // Sync selectedBlockId prop with context
  useEffect(() => {
    // Check if selectedBlockId is explicitly passed (not undefined)
    // null is a valid value for deselecting, so we don't check against null here.
    if (selectedBlockId !== undefined) {
      setContextSelectedBlockId(selectedBlockId);
    }
  }, [selectedBlockId, setContextSelectedBlockId]);

  const handleBlockSelect = useCallback((blockId: string) => {
    onSelectBlock?.(blockId);
  }, [onSelectBlock]);

  const componentsForRenderer = useMemo(() => ({
    // No custom components needing selectedBlockId or handleBlockSelect in this example.
    // The `Section` component used in the previous `TailwindLayoutRenderer`'s `components` prop
    // was effectively being shadowed by the `Section` component defined in this file and passed
    // to `createElement` when `id` was in `page.view`.
    // If `TailwindLayoutConfig` needed to render a named component like <Section ... /> directly,
    // it would be registered here.
  }), []);

  return (
    <div className="h-full w-full aspect-video bg-gray-50 overflow-hidden">
      <TailwindLayoutRenderer
        layoutConfig={layoutConfig}
        page={page}
        theme={theme}
        components={componentsForRenderer}
        onBlockSelect={handleBlockSelect}
      />
    </div>
  );
}
