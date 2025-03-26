import { type Page, type ViewSection, type Block } from '@/types/offer';
import { cn } from '@/lib/utils';
import LayoutPreview from './layout-preview';
import BlockEditor from './block-editor';
import { useState } from 'react';
import { X } from 'lucide-react';

interface EditorProps {
    page: Page;
}

const Canvas = ({ 
    page, 
    selectedBlockId, 
    onSelectBlock 
}: { 
    page: Page; 
    selectedBlockId: string | null;
    onSelectBlock: (id: string) => void;
}) => {
    return (
        <div className="flex-1 flex items-center justify-center p-8">
            <div className="bg-background rounded-lg shadow-lg w-full max-w-5xl">
                <LayoutPreview 
                    page={page} 
                    selectedBlockId={selectedBlockId}
                    onSelectBlock={onSelectBlock}
                />
            </div>
        </div>
    );
};

const Inspector = ({
    block,
    onClose,
    onUpdate
}: {
    block: Block;
    onClose: () => void;
    onUpdate: (block: Block) => void;
}) => {
    return (
        <div className="w-[400px] border-l border-border bg-background h-full overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-medium">Inspector</h3>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-muted rounded-md"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div className="p-4">
                <BlockEditor 
                    block={block}
                    onUpdate={onUpdate}
                />
            </div>
        </div>
    );
};

export default function Editor({ page }: EditorProps) {
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const selectedBlock = selectedBlockId ? findBlockInPage(page, selectedBlockId) : null;

    const handleBlockUpdate = (updatedBlock: Block) => {
        // TODO: Implement block update logic
        console.log('Update block:', updatedBlock);
    };

    return (
        <div className="h-full flex bg-zinc-900">
            {/* Canvas */}
            <div className={cn(
                "flex-1 flex items-center transition-all duration-200 ease-in-out",
                selectedBlock ? "mr-[400px]" : "mr-0"
            )}>
                <Canvas 
                    page={page}
                    selectedBlockId={selectedBlockId}
                    onSelectBlock={setSelectedBlockId}
                />
            </div>

            {/* Inspector */}
            <div className={cn(
                "absolute top-0 right-0 h-full",
                "transform transition-transform duration-200 ease-in-out",
                selectedBlock ? "translate-x-0" : "translate-x-full"
            )}>
                {selectedBlock && (
                    <Inspector
                        block={selectedBlock}
                        onClose={() => setSelectedBlockId(null)}
                        onUpdate={handleBlockUpdate}
                    />
                )}
            </div>
        </div>
    );
}

function findBlockInPage(page: Page, blockId: string): Block | null {
    const sections: ViewSection[] = [
        page.view.promo,
        page.view.title,
        page.view.action,
        page.view.content
    ].filter((section): section is ViewSection => section !== undefined);

    for (const section of sections) {
        const block = section.blocks.find(block => block.id === blockId);
        if (block) return block;
    }

    return null;
} 