import { type Block, type BlockContent } from '@/types/offer';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface BlockEditorProps {
    block: Block;
    onUpdate?: (block: Block) => void;
}

export default function BlockEditor({ block, onUpdate }: BlockEditorProps) {
    const handleTextContentUpdate = (index: number, content: string) => {
        if (!block.text) return;
        
        const newText = [...block.text];
        if (newText[index].object === 'text') {
            newText[index] = {
                ...newText[index],
                props: {
                    ...newText[index].props,
                    content
                }
            } as BlockContent;
        }

        onUpdate?.({
            ...block,
            text: newText
        });
    };

    const handleStyleUpdate = (property: string, value: string) => {
        onUpdate?.({
            ...block,
            style: {
                ...block.style,
                [property]: value
            }
        });
    };

    return (
        <div className="space-y-6 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Block Editor</h3>
                    <p className="text-sm text-muted-foreground">
                        Edit block properties
                    </p>
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                    {block.id}
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <Label>Type</Label>
                    <div className="text-sm font-mono mt-1.5">
                        {block.type}
                    </div>
                </div>

                {block.text && (
                    <div className="space-y-4">
                        <Label>Text Content</Label>
                        {block.text.map((content, index) => (
                            <div key={index} className="space-y-2">
                                {content.object === 'text' && (
                                    <div>
                                        <Input
                                            value={content.props.content}
                                            onChange={(e) => handleTextContentUpdate(index, e.target.value)}
                                            placeholder="Enter text content"
                                        />
                                        <div className="flex gap-2 mt-1">
                                            {Object.entries(content.annotations || {}).map(([key, value]) => (
                                                <div 
                                                    key={key}
                                                    className="text-[10px] bg-secondary px-1.5 py-0.5 rounded font-mono"
                                                >
                                                    {key}: {String(value)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {content.object === 'icon' && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-muted flex items-center justify-center rounded">
                                            [icon]
                                        </div>
                                        <div className="text-xs font-mono">
                                            {content.props.icon}@{content.props.variant}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {block.style && (
                    <div className="space-y-4">
                        <Label>Styles</Label>
                        {Object.entries(block.style).map(([property, value]) => (
                            <div key={property} className="grid grid-cols-2 gap-2">
                                <div className="text-sm font-mono">{property}</div>
                                <Input
                                    value={value}
                                    onChange={(e) => handleStyleUpdate(property, e.target.value)}
                                    placeholder={`Enter ${property}`}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {block.props && (
                    <div className="space-y-2">
                        <Label>Properties</Label>
                        <pre className="text-xs font-mono bg-muted p-2 rounded">
                            {JSON.stringify(block.props, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
} 