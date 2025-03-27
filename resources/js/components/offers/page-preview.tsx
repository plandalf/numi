import { type Page, type ViewSection, type Block, type BlockContent, type PageView, type TextContent, type IconContent } from '@/types/offer';
import { cn } from '@/lib/utils';
import LayoutPreview from './layout-preview';
import BlockEditor from './block-editor';
import { useState, useRef, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { DndProvider, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Define block types with proper type definitions
export interface BlockType {
  id: string;
  name: string;
  icon: React.ReactNode;
  create: () => Block;
}

export const BLOCK_TYPES: Record<string, BlockType> = {
  TEXT: {
    id: 'text',
    name: 'Text',
    icon: null,
    create: (): Block => ({
      id: uuidv4(),
      type: 'p',
      object: 'paragraph',
      text: [{
        href: null,
        props: {
          link: null,
          content: 'New text block'
        },
        object: 'text',
        plain_text: 'New text block',
        annotations: {}
      }]
    })
  },
  HEADING: {
    id: 'heading',
    name: 'Heading',
    icon: null,
    create: (): Block => ({
      id: uuidv4(),
      type: 'h3',
      object: 'heading',
      text: [{
        href: null,
        props: {
          link: null,
          content: 'New heading'
        },
        object: 'text',
        plain_text: 'New heading',
        annotations: { bold: true }
      }]
    })
  },
  BUTTON: {
    id: 'button',
    name: 'Button',
    icon: null,
    create: (): Block => ({
      id: uuidv4(),
      type: 'button',
      object: 'button',
      style: {
        backgroundColor: '#0C4A6E',
        color: '#FFFFFF',
        width: '100%'
      },
      text: [{
        href: null,
        props: {
          link: null,
          content: 'Click me'
        },
        object: 'text',
        plain_text: 'Click me',
        annotations: {}
      }]
    })
  },
  IMAGE: {
    id: 'image',
    name: 'Image',
    icon: null,
    create: (): Block => ({
      id: uuidv4(),
      type: 'image',
      object: 'image',
      props: {
        src: 'https://via.placeholder.com/400x300',
        alt: 'Placeholder image'
      }
    })
  },
  PAYMENT: {
    id: 'payment',
    name: 'Payment',
    icon: null,
    create: (): Block => ({
      id: uuidv4(),
      type: 'StripeElements@v1',
      object: 'payment',
      props: {}
    })
  },
  LIST: {
    id: 'list',
    name: 'List',
    icon: null,
    create: (): Block => ({
      id: uuidv4(),
      type: 'dl',
      object: 'list',
      children: [{
        type: 'dl-group',
        object: 'list-group',
        children: [
          {
            type: 'dt',
            object: 'list-term',
            text: [{
              href: null,
              props: {
                link: null,
                content: 'Icon'
              },
              object: 'text'
            }]
          },
          {
            type: 'dd',
            object: 'list-description',
            children: [{
              type: 'p',
              object: 'paragraph',
              text: [{
                href: null,
                props: {
                  link: null,
                  content: 'List item'
                },
                object: 'text'
              }]
            }]
          }
        ]
      }]
    })
  }
};

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
      onDropBlock(sectionName, item.blockType, index);
    },
    collect: monitor => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop()
    })
  }));

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
    
    // Log when blocks are selected to help debug
    useEffect(() => {
        if (selectedBlockId) {
            console.log('Selected block ID:', selectedBlockId);
        }
    }, [selectedBlockId]);
    
    const selectedBlock = selectedBlockId ? findBlockInPage(livePreviewPage, selectedBlockId) : null;
    
    useEffect(() => {
        console.log('Current selected block:', selectedBlock);
    }, [selectedBlock]);

    // Handle block selection
    const handleSelectBlock = (blockId: string) => {
        console.log('Block selected with ID:', blockId);
        
        // Always force a selection change, even if selecting the same block
        setSelectedBlockId(null);
        
        // Use setTimeout to ensure the state is updated before re-selecting
        setTimeout(() => {
            setSelectedBlockId(blockId);
        }, 10);
    };

    const handleBlockUpdate = (updatedBlock: Block) => {
        if (!updatedBlock.id) return;
        
        console.log('Updating block:', updatedBlock.id, updatedBlock.type);
        
        // Apply changes to the live preview immediately
        const updatedPreviewPage = JSON.parse(JSON.stringify(livePreviewPage));
        
        const sections = ['promo', 'title', 'action', 'content'] as const;
        let updated = false;
        
        for (const sectionName of sections) {
            const section = updatedPreviewPage.view[sectionName];
            if (!section) continue;
            
            const blockIndex = section.blocks.findIndex((b: Block) => b.id === updatedBlock.id);
            if (blockIndex >= 0) {
                section.blocks[blockIndex] = updatedBlock;
                updated = true;
                console.log(`Updated block in section ${sectionName} at index ${blockIndex}`);
                break;
            }
        }
        
        if (updated) {
            // Update live preview
            setLivePreviewPage(updatedPreviewPage);
            
            // Store the pending changes for later save
            setPendingChanges(updatedBlock);
        } else {
            console.error('Failed to update block in preview');
        }
    };
    
    const handleSaveChanges = () => {
        if (!pendingChanges || !pendingChanges.id || !onUpdatePage) return;
        
        console.log('Saving changes for block:', pendingChanges.id);
        
        // Apply the pending changes to the actual page data
        onUpdatePage(livePreviewPage);
        setPendingChanges(null);
    };
    
    const handleAddBlock = (section: keyof typeof page.view, blockType: BlockType, index: number = -1) => {
        if (!onUpdatePage) return;
        
        // Create the new block
        const newBlock = blockType.create();
        
        // Create a deep copy of the page
        const updatedPage = JSON.parse(JSON.stringify(livePreviewPage));
        
        // Ensure the section exists
        if (!updatedPage.view[section]) {
            updatedPage.view[section] = { blocks: [] };
        }
        
        // Add the new block to the section at the specified index
        if (index >= 0) {
            updatedPage.view[section].blocks.splice(index, 0, newBlock);
        } else {
            // Add to the end if no index specified
            updatedPage.view[section].blocks.push(newBlock);
        }
        
        // Update local live preview first
        setLivePreviewPage(updatedPage);
        
        // Then update the actual page
        onUpdatePage(updatedPage);
        
        // Select the new block
        if (newBlock.id) {
            setSelectedBlockId(newBlock.id);
        }
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
                                onSelectBlock={handleSelectBlock}
                                onAddBlock={handleAddBlock}
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