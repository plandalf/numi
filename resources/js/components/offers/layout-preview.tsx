import { type Page, type ViewSection, type Block } from '@/types/offer';
import { cn } from '@/lib/utils';
import React, { useRef } from 'react';
import { getBlockComponent } from '../blocks/block-registry';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { NumiProvider } from '@/contexts/Numi';

// Local interfaces that match the actual structure
interface PageView {
    promo: { blocks: Block[]; style?: Record<string, string> };
    title: { blocks: Block[]; style?: Record<string, string> };
    action: { blocks: Block[]; style?: Record<string, string> };
    content: { blocks: Block[]; style?: Record<string, string> };
}

interface LocalPage extends Omit<Page, 'view'> {
    view: PageView;
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
    onAddBlock?: (section: keyof PageView, blockType: BlockType, index?: number) => void;
    onMoveBlock?: (fromSection: keyof PageView, fromIndex: number, toSection: keyof PageView, toIndex: number) => void;
}

interface SectionProps {
    section: PageView[keyof PageView] | undefined;
    sectionName: keyof PageView;
    className?: string;
    selectedBlockId?: string | null;
    onSelectBlock?: (blockId: string) => void;
    onAddBlock?: (section: keyof PageView, blockType: BlockType, index?: number) => void;
    onMoveBlock?: (fromSection: keyof PageView, fromIndex: number, toSection: keyof PageView, toIndex: number) => void;
}

interface BlockRendererProps {
    block: Block;
    isSelected?: boolean;
    onSelect?: () => void;
    sectionName: keyof PageView;
    index: number;
    onMoveBlock?: (fromSection: keyof PageView, fromIndex: number, toSection: keyof PageView, toIndex: number) => void;
}

interface BlockDropZoneProps {
    sectionName: keyof PageView;
    index: number;
    onDropBlock: (section: keyof PageView, blockType: BlockType, index: number) => void;
    onMoveBlock?: (fromSection: keyof PageView, fromIndex: number, toSection: keyof PageView, toIndex: number) => void;
}

const BlockRenderer = ({ block, isSelected, onSelect, sectionName, index, onMoveBlock }: BlockRendererProps) => {
    const blockId = block.id || 'missing-id';
    const blockRef = useRef<HTMLDivElement>(null);

    const [{ isDragging }, drag] = useDrag(() => ({
        type: DRAG_TYPES.EXISTING_BLOCK,
        item: { 
            id: blockId,
            fromSection: sectionName,
            fromIndex: index 
        },
        collect: monitor => ({
            isDragging: !!monitor.isDragging()
        })
    }), [blockId, sectionName, index]);

    const [{ isOver }, drop] = useDrop(() => ({
        accept: DRAG_TYPES.EXISTING_BLOCK,
        hover: (item: { id: string, fromSection: keyof PageView, fromIndex: number }, monitor) => {
            if (!blockRef.current) return;
            if (item.id === blockId) return;
            
            // Get the middle Y of the current item
            const hoverBoundingRect = blockRef.current.getBoundingClientRect();
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            
            // Get the mouse position
            const clientOffset = monitor.getClientOffset();
            if (!clientOffset) return;
            
            // Get the pixels to the top
            const hoverClientY = clientOffset.y - hoverBoundingRect.top;
            
            // Only perform the move when the mouse has crossed half of the items height
            // When dragging downwards, only move when the cursor is below 50%
            // When dragging upwards, only move when the cursor is above 50%
            
            // Dragging downwards
            if (item.fromSection === sectionName && item.fromIndex < index && hoverClientY < hoverMiddleY) {
                return;
            }
            
            // Dragging upwards
            if (item.fromSection === sectionName && item.fromIndex > index && hoverClientY > hoverMiddleY) {
                return;
            }
            
            // Don't update if we're hovering the same position
            if (item.fromSection === sectionName && item.fromIndex === index) {
                return;
            }
            
            // Time to actually perform the action
            onMoveBlock?.(item.fromSection, item.fromIndex, sectionName, index);
            
            // Update the source index only after we're sure we want to make the move
            item.fromSection = sectionName;
            item.fromIndex = index;
        },
        collect: monitor => ({
            isOver: !!monitor.isOver()
        })
    }), [sectionName, index, onMoveBlock]);

    // Combine the drag and drop refs
    const ref = (node: HTMLDivElement | null) => {
        blockRef.current = node;
        drag(drop(node));
    };

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Block clicked, ID:', blockId, 'Type:', block.type);
        
        if (block.id) {
            onSelect?.();
        } else {
            console.error('Block has no ID:', block);
        }
    };

    // Add pointer-events-none to child elements to ensure overlay captures clicks
    const addPointerEventsNone = (className: string | undefined) => {
        return cn(className || "", "pointer-events-none");
    };

    // Try to get a registered block component first
    const BlockComponent = getBlockComponent(block.type);

    if (BlockComponent) {
        return (
            <div 
                ref={ref}
                onClick={handleClick}
                className={cn(
                    "relative group cursor-move rounded-sm transition-all z-10",
                    "hover:ring-2 hover:ring-primary/20",
                    isSelected && "ring-2 ring-primary",
                    isDragging && "opacity-50",
                    isOver && "ring-2 ring-primary"
                )}
            >
                <div className={addPointerEventsNone("w-full")}>
                    <NumiProvider 
                        block={block} 
                        isEditing={true} 
                        formValues={{}}
                        formErrors={{}}
                    >
                        <BlockComponent block={block} isEditing={true} />
                    </NumiProvider>
                </div>
                {isSelected && (
                    <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
                )}
                <div className={cn(
                    "absolute -right-2 -top-2 px-1.5 py-0.5 rounded text-[10px] font-mono opacity-0 bg-primary text-primary-foreground",
                    "group-hover:opacity-100",
                    isSelected && "opacity-100",
                    "z-20"
                )}>
                    {block.type}
                </div>
            </div>
        );
    }

    // Fall back to legacy rendering
    return (
        <div 
            ref={ref}
            onClick={handleClick}
            className={cn(
                "relative group cursor-move rounded-sm transition-all z-10",
                "hover:ring-2 hover:ring-primary/20",
                isSelected && "ring-2 ring-primary",
                isDragging && "opacity-50",
                isOver && "ring-2 ring-primary"
            )}
        >
            <div className={addPointerEventsNone("w-full")}>
                {(() => {
                    switch (block.type) {
                        case 'p':
                        case 'h1':
                        case 'h2':
                        case 'h3':
                        case 'h4':
                        case 'h5':
                        case 'h6':
                            return (
                                <div className={cn(
                                    block.type === 'p' && "text-base",
                                    block.type === 'h1' && "text-3xl font-bold",
                                    block.type === 'h2' && "text-2xl font-bold",
                                    block.type === 'h3' && "text-xl font-bold",
                                    block.type === 'h4' && "text-lg font-bold",
                                    block.type === 'h5' && "text-base font-bold",
                                    block.type === 'h6' && "text-sm font-bold",
                                    "p-2"
                                )}>
                                    {block.text?.map((content, i) => (
                                        <span key={i}>{content.props.content}</span>
                                    ))}
                                </div>
                            );
                        case 'button':
                            return (
                                <div className="p-2">
                                    <button 
                                        type="button"
                                        className={cn(
                                            "w-full px-4 py-2 text-base font-medium rounded-md",
                                            "bg-primary text-primary-foreground"
                                        )}
                                        style={block.style}
                                    >
                                        {block.text?.map((content, i) => (
                                            <span key={i}>{content.props.content}</span>
                                        ))}
                                    </button>
                                </div>
                            );
                        case 'image':
                            return (
                                <div className="p-2">
                                    <div className="rounded-md overflow-hidden border border-border">
                                        <img 
                                            src={block.props?.src || ''}
                                            alt={block.props?.alt || ''}
                                            className={addPointerEventsNone("w-full h-auto object-cover")}
                                        />
                                    </div>
                                </div>
                            );
                        case 'IntervalSelector@v1':
                        case 'PlanDescriptor@v1':
                        case 'StripeElements@v1':
                            return (
                                <div className="p-2">
                                    <div className={addPointerEventsNone("p-4 border border-dashed border-border rounded-lg text-sm text-muted-foreground")}>
                                        {block.type}
                                    </div>
                                </div>
                            );
                        case 'checkbox':
                            return (
                                <div className="p-2">
                                    <div className="space-y-2">
                                        <div className="flex items-start space-x-2">
                                            <input
                                                type="checkbox"
                                                disabled
                                                className="h-4 w-4 rounded border border-input bg-background text-primary ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                            <div className="space-y-1 leading-none">
                                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                    {block.props?.label}
                                                    {block.props?.required && <span className="text-destructive ml-1">*</span>}
                                                </label>
                                                {block.props?.helpText && (
                                                    <p className="text-sm text-muted-foreground">{block.props.helpText}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        default:
                            if (block.object === 'field') {
                                return (
                                    <div className="p-2">
                                        <div className="space-y-2">
                                            {block.props?.label && (
                                                <label className="block text-sm font-medium">
                                                    {block.props.label}
                                                    {block.props?.required && <span className="text-red-500 ml-1">*</span>}
                                                </label>
                                            )}
                                            <input
                                                type="text"
                                                className="w-full rounded-md border border-input bg-background px-3 py-2"
                                                placeholder={block.props?.placeholder}
                                                disabled
                                            />
                                        </div>
                                    </div>
                                );
                            }
                            return (
                                <div className="p-2">
                                    <div className={addPointerEventsNone("p-2 border border-dashed border-border rounded text-xs text-muted-foreground")}>
                                        Unknown block: {block.type}
                                    </div>
                                </div>
                            );
                    }
                })()}
            </div>
            {isSelected && (
                <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
            )}
            <div className={cn(
                "absolute -right-2 -top-2 px-1.5 py-0.5 rounded text-[10px] font-mono opacity-0 bg-primary text-primary-foreground",
                "group-hover:opacity-100",
                isSelected && "opacity-100",
                "z-20"
            )}>
                {block.type}
            </div>
        </div>
    );
};

const Section = ({ section, sectionName, className, selectedBlockId, onSelectBlock, onAddBlock, onMoveBlock }: SectionProps) => {
    if (!section) return null;

    return (
        <div 
            className={cn(
                "relative",
                className
            )}
            style={section.style}
        >
            <div className="absolute inset-0 p-4 overflow-auto">
                <div className="space-y-1">
                    {onAddBlock && (
                        <BlockDropZone
                            sectionName={sectionName}
                            index={0}
                            onDropBlock={onAddBlock}
                            onMoveBlock={onMoveBlock}
                        />
                    )}

                    {section.blocks?.map((block, index) => (
                        <div key={block.id || index} className="relative" data-section={sectionName} data-index={index}>
                            <BlockRenderer 
                                block={block}
                                isSelected={block.id === selectedBlockId}
                                onSelect={() => {
                                    if (block.id) {
                                        console.log(`Section: ${sectionName}, Block: ${block.id} selected`);
                                        onSelectBlock?.(block.id);
                                    }
                                }}
                                sectionName={sectionName}
                                index={index}
                                onMoveBlock={onMoveBlock}
                            />
                            
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
        drop: (item: { blockType?: BlockType; fromSection?: keyof PageView; fromIndex?: number }) => {
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
            <div className="aspect-[16/9] w-full">
                <div className="grid h-full grid-cols-2">
                    <div className="overflow-hidden">
                        <div className="flex flex-col justify-center h-full">
                            <div className="flex flex-col space-y-6 overflow-y-auto px-6 py-4 grow">
                                <Section 
                                    section={page.view.title}
                                    sectionName="title"
                                    className="min-h-[3rem]"
                                    selectedBlockId={selectedBlockId}
                                    onSelectBlock={handleBlockSelect}
                                    onAddBlock={onAddBlock}
                                    onMoveBlock={onMoveBlock}
                                />
                                <Section 
                                    section={page.view.content}
                                    sectionName="content"
                                    className="grow"
                                    selectedBlockId={selectedBlockId}
                                    onSelectBlock={handleBlockSelect}
                                    onAddBlock={onAddBlock}
                                    onMoveBlock={onMoveBlock}
                                />
                            </div>
                            <Section 
                                section={page.view.action}
                                sectionName="action"
                                className="p-6 min-h-[6rem]"
                                selectedBlockId={selectedBlockId}
                                onSelectBlock={handleBlockSelect}
                                onAddBlock={onAddBlock}
                                onMoveBlock={onMoveBlock}
                            />
                        </div>
                    </div>

                    <Section 
                        section={page.view.promo}
                        sectionName="promo"
                        className="h-full"
                        selectedBlockId={selectedBlockId}
                        onSelectBlock={handleBlockSelect}
                        onAddBlock={onAddBlock}
                        onMoveBlock={onMoveBlock}
                    />
                </div>
            </div>
        </DndProvider>
    );
} 