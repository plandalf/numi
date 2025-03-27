import { type Page, type ViewSection, type Block } from '@/types/offer';
import { cn } from '@/lib/utils';

interface LayoutPreviewProps {
    page: Page;
    selectedBlockId?: string | null;
    onSelectBlock?: (blockId: string) => void;
}

interface SectionProps {
    section: ViewSection | undefined;
    className?: string;
    selectedBlockId?: string | null;
    onSelectBlock?: (blockId: string) => void;
}

interface BlockRendererProps {
    block: Block;
    isSelected?: boolean;
    onSelect?: () => void;
}

const BlockRenderer = ({ block, isSelected, onSelect }: BlockRendererProps) => {
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
        switch (block.type) {
            case 'h1':
                return (
                    <h1 className="text-2xl font-bold">
                        {renderText()}
                    </h1>
                );
            case 'h3':
                return (
                    <h3 className="text-xl font-bold">
                        {renderText()}
                    </h3>
                );
            case 'h4':
                return (
                    <h4 className="text-lg font-bold">
                        {renderText()}
                    </h4>
                );
            case 'h5':
                return (
                    <h5 className="text-base font-bold">
                        {renderText()}
                    </h5>
                );
            case 'p':
                return (
                    <p className="text-sm">
                        {renderText()}
                    </p>
                );
            case 'button':
                return (
                    <button 
                        type="button"
                        className={cn(
                            "px-4 py-2 rounded-md text-sm font-medium",
                            "bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                        style={block.style}
                    >
                        {renderText()}
                    </button>
                );
            case 'dl':
                return (
                    <dl className="space-y-2">
                        {block.children?.map((child, index) => {
                            if (child.type === 'dl-group') {
                                return (
                                    <div key={index} className="flex items-start gap-2">
                                        {child.children?.map((groupChild, groupIndex) => {
                                            if (groupChild.type === 'dt') {
                                                return (
                                                    <div key={groupIndex} className="w-6 h-6 flex-none">
                                                        [icon]
                                                    </div>
                                                );
                                            }
                                            if (groupChild.type === 'dd') {
                                                return (
                                                    <div key={groupIndex} className="flex-1">
                                                        {groupChild.children?.map((ddChild, ddIndex) => (
                                                            <BlockRenderer key={ddIndex} block={ddChild} />
                                                        ))}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </dl>
                );
            case 'IntervalSelector@v1':
            case 'PlanDescriptor@v1':
            case 'StripeElements@v1':
                return (
                    <div className="p-4 border border-dashed border-border rounded-lg text-sm text-muted-foreground">
                        {block.type}
                    </div>
                );
            default:
                return (
                    <div className="p-2 border border-dashed border-border rounded text-xs text-muted-foreground">
                        Unknown block: {block.type}
                    </div>
                );
        }
    };

    return (
        <div 
            onClick={() => onSelect?.()}
            className={cn(
                "relative group cursor-pointer rounded-sm transition-all",
                "hover:ring-2 hover:ring-primary/20",
                isSelected && "ring-2 ring-primary"
            )}
        >
            {blockContent()}
            <div className={cn(
                "absolute -right-2 -top-2 px-1.5 py-0.5 rounded text-[10px] font-mono opacity-0 bg-primary text-primary-foreground",
                "group-hover:opacity-100",
                isSelected && "opacity-100"
            )}>
                {block.type}
            </div>
        </div>
    );
};

const Section = ({ section, className, selectedBlockId, onSelectBlock }: SectionProps) => {
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
                <div className="space-y-4">
                    {section.blocks.map((block, index) => (
                        <BlockRenderer 
                            key={block.id || index} 
                            block={block}
                            isSelected={block.id === selectedBlockId}
                            onSelect={() => block.id && onSelectBlock?.(block.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function LayoutPreview({ page, selectedBlockId, onSelectBlock }: LayoutPreviewProps) {
    return (
        <div className="aspect-[16/9] w-full">
            <div className="grid h-full grid-cols-2">
                {/* Left Column - Content */}
                <div className="overflow-hidden">
                    <div className="flex flex-col justify-center h-full">
                        <div className="flex flex-col space-y-6 overflow-y-auto px-6 py-4 grow">
                            <Section 
                                section={page.view.title} 
                                className="min-h-[3rem]"
                                selectedBlockId={selectedBlockId}
                                onSelectBlock={onSelectBlock}
                            />
                            <Section 
                                section={page.view.content} 
                                className="grow"
                                selectedBlockId={selectedBlockId}
                                onSelectBlock={onSelectBlock}
                            />
                        </div>
                        <Section 
                            section={page.view.action} 
                            className="p-6 min-h-[6rem]"
                            selectedBlockId={selectedBlockId}
                            onSelectBlock={onSelectBlock}
                        />
                    </div>
                </div>

                {/* Right Column - Promo */}
                <Section 
                    section={page.view.promo} 
                    className="h-full"
                    selectedBlockId={selectedBlockId}
                    onSelectBlock={onSelectBlock}
                />
            </div>
        </div>
    );
} 