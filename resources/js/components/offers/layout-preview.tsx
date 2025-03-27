import { type Page, type ViewSection, type Block, type PageView } from '@/types/offer';
import { cn } from '@/lib/utils';
import { BlockDropZone } from './page-preview';
import { styleToClassName } from './page-preview';
import React from 'react';

interface LayoutPreviewProps {
    page: Page;
    selectedBlockId?: string | null;
    onSelectBlock?: (blockId: string) => void;
    onAddBlock?: (section: keyof PageView, blockType: any, index?: number) => void;
}

interface SectionProps {
    section: ViewSection | undefined;
    sectionName: keyof PageView;
    className?: string;
    selectedBlockId?: string | null;
    onSelectBlock?: (blockId: string) => void;
    onAddBlock?: (section: keyof PageView, blockType: any, index?: number) => void;
}

interface BlockRendererProps {
    block: Block;
    isSelected?: boolean;
    onSelect?: () => void;
}

const BlockRenderer = ({ block, isSelected, onSelect }: BlockRendererProps) => {
    const blockId = block.id || 'missing-id';

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

    const renderText = () => {
        if (!block.text) return null;
        return block.text.map((content, i) => {
            if (content.object === 'text') {
                return (
                    <span 
                        key={i}
                        className={cn(
                            content.annotations?.bold && "font-bold"
                        )}
                    >
                        {content.props.content}
                    </span>
                );
            }
            if (content.object === 'icon') {
                return (
                    <span 
                        key={i}
                        className="inline-block w-4 h-4 align-middle"
                        style={content.style}
                    >
                        [icon]
                    </span>
                );
            }
            return null;
        });
    };

    const blockContent = () => {
        if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(block.type)) {
            const className = {
                p: "text-sm",
                h1: "text-2xl font-bold",
                h2: "text-xl font-bold",
                h3: "text-lg font-bold",
                h4: "text-base font-bold",
                h5: "text-sm font-bold",
                h6: "text-xs font-bold"
            }[block.type];
            
            if (block.type === 'p') {
                return (
                    <div className="w-full h-full">
                        <p className={addPointerEventsNone(className)}>{renderText()}</p>
                    </div>
                );
            }
            
            const Heading = block.type as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
            return React.createElement(
                'div',
                { className: "w-full h-full" },
                React.createElement(Heading, { className: addPointerEventsNone(className) }, renderText())
            );
        }
        
        switch (block.type) {
            case 'button':
                return (
                    <button 
                        type="button"
                        className={addPointerEventsNone(cn(
                            "px-4 py-2 rounded-md text-sm font-medium",
                            "bg-primary text-primary-foreground hover:bg-primary/90"
                        ))}
                        style={block.style}
                    >
                        {renderText()}
                    </button>
                );
            case 'dl':
                return (
                    <div className="space-y-4">
                        <dl className={addPointerEventsNone(cn("space-y-4", block.style && styleToClassName(block.style)))}>
                            {block.children?.map((group, groupIdx) => {
                                if (group.type !== 'dl-group' || !group.children) return null;
                                
                                const dtChild = group.children.find(child => child.type === 'dt');
                                const ddChild = group.children.find(child => child.type === 'dd');
                                
                                // Extract content from dt
                                let dtContent = '';
                                if (dtChild?.text?.[0]?.props && 'content' in dtChild.text[0].props) {
                                    dtContent = dtChild.text[0].props.content;
                                }
                                
                                return (
                                    <div key={groupIdx} className={addPointerEventsNone("border-b border-border pb-3 last:border-0 last:pb-0")}>
                                        <dt className={addPointerEventsNone("font-semibold mb-1")}>
                                            {dtContent}
                                        </dt>
                                        {ddChild?.children?.map((paragraph, paraIdx) => (
                                            <dd key={paraIdx} className={addPointerEventsNone("text-muted-foreground")}>
                                                {paragraph.text?.map((text, textIdx) => (
                                                    <span key={textIdx} className="pointer-events-none">
                                                        {text.object === 'text' && text.props.content}
                                                    </span>
                                                ))}
                                            </dd>
                                        ))}
                                    </div>
                                );
                            })}
                        </dl>
                    </div>
                );
            case 'image':
                return (
                    <div className="rounded-md overflow-hidden border border-border">
                        <img 
                            src={block.props?.src || ''}
                            alt={block.props?.alt || ''}
                            className={addPointerEventsNone("w-full h-auto object-cover")}
                        />
                    </div>
                );
            case 'IntervalSelector@v1':
            case 'PlanDescriptor@v1':
            case 'StripeElements@v1':
                return (
                    <div 
                        className={addPointerEventsNone("p-4 border border-dashed border-border rounded-lg text-sm text-muted-foreground")}
                    >
                        {block.type}
                    </div>
                );
            default:
                return (
                    <div 
                        className={addPointerEventsNone("p-2 border border-dashed border-border rounded text-xs text-muted-foreground")}
                    >
                        Unknown block: {block.type}
                    </div>
                );
        }
    };

    return (
        <div 
            data-block-id={blockId}
            data-block-type={block.type}
            className={cn(
                "relative group cursor-pointer rounded-sm transition-all z-10",
                "hover:ring-2 hover:ring-primary/20",
                isSelected && "ring-2 ring-primary"
            )}
        >
            <div 
                className="absolute inset-0 z-10" 
                onClick={handleClick}
                aria-hidden="true"
            />
            {blockContent()}
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

const Section = ({ section, sectionName, className, selectedBlockId, onSelectBlock, onAddBlock }: SectionProps) => {
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
                        />
                    )}

                    {section.blocks.map((block, index) => (
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
                            />
                            
                            {onAddBlock && (
                                <BlockDropZone
                                    sectionName={sectionName}
                                    index={index + 1}
                                    onDropBlock={onAddBlock}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function LayoutPreview({ page, selectedBlockId, onSelectBlock, onAddBlock }: LayoutPreviewProps) {
    const handleBlockSelect = (blockId: string) => {
        console.log('Layout preview passing block selection:', blockId);
        onSelectBlock?.(blockId);
    };

    return (
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
                            />
                            <Section 
                                section={page.view.content} 
                                sectionName="content"
                                className="grow"
                                selectedBlockId={selectedBlockId}
                                onSelectBlock={handleBlockSelect}
                                onAddBlock={onAddBlock}
                            />
                        </div>
                        <Section 
                            section={page.view.action} 
                            sectionName="action"
                            className="p-6 min-h-[6rem]"
                            selectedBlockId={selectedBlockId}
                            onSelectBlock={handleBlockSelect}
                            onAddBlock={onAddBlock}
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
                />
            </div>
        </div>
    );
} 