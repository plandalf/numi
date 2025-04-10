import { type Page, type ViewSection, type Block, type BlockContent, type PageView, type TextContent, type IconContent } from '@/types/offer';
import { cn } from '@/lib/utils';
import LayoutPreview from './layout-preview';
import BlockEditor from './block-editor';
import { useState, useRef, useEffect } from 'react';
import { X, Save, Type, Calendar, DollarSign, Mail, Lock, Link, ChevronDown, Circle, CheckSquare, ToggleLeft, List, Heading1, Square as ButtonIcon, Image as ImageIcon, AtSign, User, Phone, MapPin, Package, CreditCard } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { DndProvider, useDrop, useDrag } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';


function createBlock(blockType: BlockType) {
    console.log('xyz', blockType)
    return {
        id: uuidv4(),
        type: blockType.id,
        object: blockType.object,
        // create from all the blocks
    }
}

// DND type constants
export const DRAG_TYPES = {
  NEW_BLOCK: 'new-block',
  EXISTING_BLOCK: 'existing-block'
};

// Drop target for inserting blocks between existing blocks
interface BlockDropZoneProps {
  sectionName: keyof PageView;
  index: number;
  onDropBlock: (section: keyof PageView, blockType: BlockType, index: number) => void;
}

export const BlockDropZone = ({ sectionName, index, onDropBlock }: BlockDropZoneProps) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: DRAG_TYPES.NEW_BLOCK,
    drop: (item: { blockType: BlockType }) => {
      console.log('Dropping block:', item.blockType);
      onDropBlock(sectionName, item.blockType, index);
    },
    collect: monitor => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop()
    })
  }), [sectionName, index, onDropBlock]);

  const isActive = isOver && canDrop;

  if (!isActive && !canDrop) {
    return <div className="h-1" />;
  }

  return (
    <div
      // @ts-ignore - React DnD type mismatch with refs
      ref={(node) => drop(node)}
      className={cn(
        "h-2 -mx-2 my-1 rounded transition-all",
        isActive
          ? "bg-primary scale-y-150"
          : "bg-primary/30"
      )}
    />
  );
};

const Inspector = ({
    block,
    onClose,
    onUpdate,
    onSave
}: {
    block: Block;
    onClose: () => void;
    onUpdate: (block: Block) => void;
    onSave: () => void;
}) => {
    const [editedBlock, setEditedBlock] = useState<Block>(block);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Update local state when incoming block changes
    useEffect(() => {
        console.log('Inspector received block:', block.id, block.type);
        setEditedBlock(block);
    }, [block]);

    const handleUpdate = (updatedBlock: Block) => {
        console.log('Inspector updating block:', updatedBlock.id, updatedBlock.type);
        setEditedBlock(updatedBlock);

        // Update preview immediately
        onUpdate(updatedBlock);

        // Debounce save operation
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            onSave();
        }, 1000); // 1 second debounce
    };

    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="w-[400px] border-l border-border bg-background h-full overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-medium">Inspector</h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        {editedBlock.type}
                    </span>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-md"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="p-4 flex-grow overflow-y-auto">
                <BlockEditor
                    block={editedBlock}
                    onUpdate={handleUpdate}
                />
            </div>
            <div className="p-4 border-t border-border">
                <button
                    onClick={onSave}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
                >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                </button>
            </div>
        </div>
    );
};

interface PreviewProps {
  page: Page;
  onUpdatePage?: (page: Page) => void;
}

export default function PagePreview({ page, onUpdatePage }: PreviewProps) {
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [pendingChanges, setPendingChanges] = useState<Block | null>(null);
    const [livePreviewPage, setLivePreviewPage] = useState<Page>(page);

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

    const handleAddBlock = (section: keyof typeof page.view, blockType: BlockType, index: number = -1) => {
        if (!onUpdatePage) return;

        // Create a deep copy of the page
        const updatedPage = JSON.parse(JSON.stringify(livePreviewPage));

        // Ensure the section exists
        if (!updatedPage.view[section]) {
            updatedPage.view[section] = { blocks: [] };
        }

        console.log('Adding block:', blockType, 'to section:', section, 'at index:', index);

        // Create the new block
        const newBlock = createBlock(blockType);

        // Add the new block to the section at the specified index
        if (index >= 0) {
            updatedPage.view[section].blocks.splice(index, 0, newBlock);
        } else {
            updatedPage.view[section].blocks.push(newBlock);
        }

        // Update live preview first
        setLivePreviewPage(updatedPage);

        // Then update the actual page
        onUpdatePage(updatedPage);

        // Select the new block
        if (newBlock.id) {
            setSelectedBlockId(newBlock.id);
        }
    };

    const handleMoveBlock = (fromSection: keyof PageView, fromIndex: number, toSection: keyof PageView, toIndex: number) => {
        if (!onUpdatePage) return;

        // Create a deep copy of the page
        const updatedPage = JSON.parse(JSON.stringify(livePreviewPage));

        // Get the source section
        const sourceSection = updatedPage.view[fromSection];
        if (!sourceSection || !sourceSection.blocks) return;

        // Get the target section
        const targetSection = updatedPage.view[toSection];
        if (!targetSection || !targetSection.blocks) return;

        // Remove the block from the source section
        const [movedBlock] = sourceSection.blocks.splice(fromIndex, 1);

        // Add the block to the target section
        targetSection.blocks.splice(toIndex, 0, movedBlock);

        // Update live preview first
        setLivePreviewPage(updatedPage);

        // Then update the actual page
        onUpdatePage(updatedPage);
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="h-full flex bg-zinc-100">
                {/* Canvas - Now using the full space */}
                <div className={cn(
                    "flex-1 transition-all duration-200 ease-in-out",
                    selectedBlock ? "mr-[400px]" : "mr-0"
                )}>
                    <div className="flex-1 flex items-center justify-center p-8 h-full overflow-auto">
                        <div className="bg-background rounded-lg shadow-lg w-full max-w-5xl">
                            {/* The layout preview - using live preview page */}
                            <LayoutPreview
                                page={livePreviewPage}
                                selectedBlockId={selectedBlockId}
                                onSelectBlock={setSelectedBlockId}
                                onAddBlock={handleAddBlock}
                                onMoveBlock={handleMoveBlock}
                            />
                        </div>
                    </div>
                </div>

                {/* Inspector */}
                <div className={cn(
                    "absolute top-0 right-0 h-full",
                    "transform transition-transform duration-200 ease-in-out",
                    selectedBlock ? "translate-x-0" : "translate-x-full"
                )}>
                    {selectedBlock && (
                        <Inspector
                            key={selectedBlockId} /* Force re-mount when changing blocks */
                            block={selectedBlock}
                            onClose={() => setSelectedBlockId(null)}
                            onUpdate={handleBlockUpdate}
                            onSave={handleSaveChanges}
                        />
                    )}
                </div>
            </div>
        </DndProvider>
    );
}

export function findBlockInPage(page: Page, blockId: string): Block | null {
    if (!page || !page.view) {
        console.error('Invalid page or view in findBlockInPage');
        return null;
    }

    console.log('Finding block:', blockId, 'in page:', page.id);

    const sections: Array<[keyof PageView, ViewSection]> = [
        ['title', page.view.title],
        ['content', page.view.content],
        ['action', page.view.action],
        ['promo', page.view.promo]
    ].filter((entry): entry is [keyof PageView, ViewSection] => entry[1] !== undefined);

    // Log all blocks in the page to help diagnose issues
    console.log('Available blocks:');
    sections.forEach(([sectionName, section]) => {
        if (!section || !section.blocks) return;

        console.log(`Section ${sectionName}:`);
        section.blocks.forEach((block, blockIndex) => {
            console.log(`  - Block ${blockIndex}:`, block.id, block.type);
        });
    });

    // First try direct lookup for performance
    for (const [sectionName, section] of sections) {
        if (!section || !section.blocks) continue;

        const block = section.blocks.find(block => block.id === blockId);
        if (block) {
            console.log(`Found block in section ${sectionName}:`, block.id, block.type);
            return block;
        }
    }

    // Then try nested blocks
    for (const [sectionName, section] of sections) {
        if (!section || !section.blocks) continue;

        for (const parentBlock of section.blocks) {
            if (parentBlock.children) {
                const nestedBlock = findNestedBlock(parentBlock.children, blockId);
                if (nestedBlock) {
                    console.log(`Found nested block in section ${sectionName}:`, nestedBlock.id, nestedBlock.type);
                    return nestedBlock;
                }
            }
        }
    }

    console.log('Block not found:', blockId);
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

// Add preview renderers for each field type
const FieldPreview = ({ block }: { block: Block }) => {
  const { type, props } = block;

  switch (type) {
    case 'text_field':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {props.label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder={props.placeholder}
            disabled
          />
          {props.helpText && (
            <p className="text-sm text-gray-500">{props.helpText}</p>
          )}
        </div>
      );

    case 'textarea':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {props.label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            rows={props.rows}
            disabled
          />
          {props.helpText && (
            <p className="text-sm text-gray-500">{props.helpText}</p>
          )}
        </div>
      );

    case 'date_field':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {props.label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="date"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            disabled
          />
          {props.helpText && (
            <p className="text-sm text-gray-500">{props.helpText}</p>
          )}
        </div>
      );

    case 'currency_field':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {props.label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">{props.currency}</span>
            <input
              type="number"
              className="w-full rounded-md border border-gray-300 pl-12 pr-3 py-2 text-sm"
              disabled
            />
          </div>
          {props.helpText && (
            <p className="text-sm text-gray-500">{props.helpText}</p>
          )}
        </div>
      );

    case 'email_field':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {props.label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="email"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder={props.placeholder}
            disabled
          />
          {props.helpText && (
            <p className="text-sm text-gray-500">{props.helpText}</p>
          )}
        </div>
      );

    case 'password_field':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {props.label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="password"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            disabled
          />
          {props.showStrengthMeter && (
            <div className="h-1 bg-gray-200 rounded-full">
              <div className="h-full w-0 bg-gray-400 rounded-full" />
            </div>
          )}
          {props.helpText && (
            <p className="text-sm text-gray-500">{props.helpText}</p>
          )}
        </div>
      );

    case 'url_field':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {props.label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="url"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder={props.placeholder}
            disabled
          />
          {props.helpText && (
            <p className="text-sm text-gray-500">{props.helpText}</p>
          )}
        </div>
      );

    case 'select_field':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {props.label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" disabled>
            <option value="">Select an option</option>
            {props.options.map((option: { value: string; label: string }) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {props.helpText && (
            <p className="text-sm text-gray-500">{props.helpText}</p>
          )}
        </div>
      );

    case 'multiselect_field':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {props.label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" multiple disabled>
            {props.options.map((option: { value: string; label: string }) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {props.helpText && (
            <p className="text-sm text-gray-500">{props.helpText}</p>
          )}
        </div>
      );

    case 'radio_group':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {props.label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className={`space-y-2 ${props.layout === 'horizontal' ? 'flex gap-4' : ''}`}>
            {props.options.map((option: { value: string; label: string }) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name={props.name}
                  value={option.value}
                  className="mr-2"
                  disabled
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
          {props.helpText && (
            <p className="text-sm text-gray-500">{props.helpText}</p>
          )}
        </div>
      );

    case 'checkbox_group':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {props.label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className={`space-y-2 ${props.layout === 'horizontal' ? 'flex gap-4' : ''}`}>
            {props.options.map((option: { value: string; label: string }) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  name={props.name}
                  value={option.value}
                  className="mr-2"
                  disabled
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
          {props.helpText && (
            <p className="text-sm text-gray-500">{props.helpText}</p>
          )}
        </div>
      );

    case 'switch_field':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {props.label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="flex items-center">
            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
              <div className="h-4 w-4 transform rounded-full bg-white transition-transform" />
            </div>
            <span className="ml-2 text-sm text-gray-500">Toggle {props.defaultChecked ? 'On' : 'Off'}</span>
          </div>
          {props.helpText && (
            <p className="text-sm text-gray-500">{props.helpText}</p>
          )}
        </div>
      );

    default:
      return null;
  }
};

// Add this function to render legacy blocks
const renderLegacyBlock = (block: Block) => {
  switch (block.type) {
    case 'p':
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      const className = {
        p: "text-base",
        h1: "text-3xl font-bold",
        h2: "text-2xl font-bold",
        h3: "text-xl font-bold",
        h4: "text-lg font-bold",
        h5: "text-base font-bold",
        h6: "text-sm font-bold"
      }[block.type];

      return (
        <div className={cn(className, block.style && styleToClassName(block.style))}>
          {block.text?.map((content, i) => (
            <span key={i}>{content.props.content}</span>
          ))}
        </div>
      );
    case 'button':
      return (
        <button
          type="button"
          className={cn(
            "w-full px-4 py-3 text-base font-medium rounded-md",
            "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
            block.style && styleToClassName(block.style)
          )}
        >
          {block.text?.map((content, i) => (
            <span key={i}>{content.props.content}</span>
          ))}
        </button>
      );
    case 'dl':
      return <DetailList block={block} />;
    case 'image':
      return <ImageBlock block={block} />;
    case 'StripeElements@v1':
      return <PaymentBlock block={block} />;
    default:
      if (block.object === 'field') {
        return <InputBlock block={block} />;
      }
      return (
        <div className="p-4 border border-gray-200 rounded bg-gray-50">
          <p className="text-sm text-gray-500">Unsupported block type: {block.type}</p>
        </div>
      );
  }
};

// Update the BlockRenderer component to handle both new and legacy blocks
const BlockRenderer = ({ block }: { block: Block }) => {
  // First try to get a registered block component
  const BlockComponent = getBlockComponent(block.type);
  if (BlockComponent) {
    return <BlockComponent.Renderer block={block} isEditing={true} />;
  }

  // Fall back to legacy rendering if no registered component
  return renderLegacyBlock(block);
};

// Add this component to make blocks draggable
interface DraggableBlockProps {
    blockType: BlockType;
    children: React.ReactNode;
}

const DraggableBlock = ({ blockType, children }: DraggableBlockProps) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: DRAG_TYPES.NEW_BLOCK,
        item: { blockType },
        collect: monitor => ({
            isDragging: !!monitor.isDragging()
        })
    }));

    return (
        <div
            ref={drag}
            className={cn(
                "cursor-grab active:cursor-grabbing",
                isDragging && "opacity-50"
            )}
        >
            {children}
        </div>
    );
};

// Update the block type buttons to use DraggableBlock
const BlockTypeButton = ({ blockType }: { blockType: BlockType }) => {
    return (
        <DraggableBlock blockType={blockType}>
            <button
                type="button"
                className={cn(
                    "flex items-center gap-2 w-full p-2 rounded-md text-sm",
                    "hover:bg-muted transition-colors"
                )}
            >
                {blockType.icon}
                <span>{blockType.name}</span>
            </button>
        </DraggableBlock>
    );
};

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
