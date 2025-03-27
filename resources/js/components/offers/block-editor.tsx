import { type Block, type BlockContent, type TextContent, type IconContent } from '@/types/offer';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Plus, Trash, MoveUp, MoveDown, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { ImageUpload } from '@/components/ui/image-upload';

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

    // Handle props update for all block types
    const handlePropsUpdate = (property: string, value: any) => {
        onUpdate?.({
            ...block,
            props: {
                ...block.props,
                [property]: value
            }
        });
    };

    // Handle media upload for image blocks
    const handleMediaUpdate = (media: { id: number, url: string } | null) => {
        console.log('Media update received:', media);
        
        // If no media (image was removed), reset src to a placeholder
        const src = media?.url 
            ? media.url // Use the URL directly from the media object
            : 'https://place-hold.it/300x500';
            
        onUpdate?.({
            ...block,
            props: {
                ...block.props,
                src: src,
                mediaId: media?.id || null,
                // Store the entire media object reference for later use if needed
                media: media || undefined
            }
        });
    };

    // Handle detail list (dl) item updates
    const handleDlItemUpdate = (groupIndex: number, type: 'dt' | 'dd', content: string) => {
        if (!block.children) return;
        
        const newChildren = [...block.children];
        const group = { ...newChildren[groupIndex] };
        
        if (group.children) {
            const dtIndex = group.children.findIndex(child => child.type === type);
            if (dtIndex >= 0) {
                const updatedChild = { ...group.children[dtIndex] };
                
                if (type === 'dt') {
                    // Update the term directly
                    if (updatedChild.text && updatedChild.text[0]) {
                        updatedChild.text = [{
                            ...updatedChild.text[0],
                            props: {
                                ...updatedChild.text[0].props,
                                content
                            }
                        } as BlockContent];
                    }
                } else if (type === 'dd') {
                    // Update the description (assuming it has a paragraph child)
                    if (updatedChild.children && updatedChild.children[0]) {
                        const paragraph = { ...updatedChild.children[0] };
                        if (paragraph.text && paragraph.text[0]) {
                            paragraph.text = [{
                                ...paragraph.text[0],
                                props: {
                                    ...paragraph.text[0].props,
                                    content
                                }
                            } as BlockContent];
                            updatedChild.children = [paragraph];
                        }
                    }
                }
                
                group.children[dtIndex] = updatedChild;
            }
        }
        
        newChildren[groupIndex] = group;
        
        onUpdate?.({
            ...block,
            children: newChildren
        });
    };

    // Add a new item to the detail list
    const handleAddDlItem = () => {
        if (!block.children) {
            onUpdate?.({
                ...block,
                children: []
            });
            return;
        }
        
        const newItem: Block = {
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
                            content: 'New Label'
                        },
                        object: 'text'
                    } as BlockContent]
                } as Block,
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
                                content: 'New description'
                            },
                            object: 'text'
                        } as BlockContent]
                    } as Block]
                } as Block
            ]
        };
        
        onUpdate?.({
            ...block,
            children: [...block.children, newItem]
        });
    };

    // Remove an item from the detail list
    const handleRemoveDlItem = (index: number) => {
        if (!block.children) return;
        
        const newChildren = [...block.children];
        newChildren.splice(index, 1);
        
        onUpdate?.({
            ...block,
            children: newChildren
        });
    };

    // Move an item up or down in the detail list
    const handleMoveDlItem = (index: number, direction: 'up' | 'down') => {
        if (!block.children) return;
        
        const newChildren = [...block.children];
        const item = newChildren[index];
        
        if (direction === 'up' && index > 0) {
            newChildren.splice(index, 1);
            newChildren.splice(index - 1, 0, item);
        } else if (direction === 'down' && index < newChildren.length - 1) {
            newChildren.splice(index, 1);
            newChildren.splice(index + 1, 0, item);
        }
        
        onUpdate?.({
            ...block,
            children: newChildren
        });
    };

    return (
        <div className="space-y-6">
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

                {/* Image Block Editor */}
                {block.type === 'image' && (
                    <div className="space-y-4">
                        <Label>Image</Label>
                        <div className="space-y-4">
                            <ImageUpload
                                value={block.props?.mediaId || null}
                                onChange={handleMediaUpdate}
                                preview={block.props?.src || undefined}
                                onError={(error) => console.error('Image upload error:', error)}
                            />
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="image-alt">Alt Text</Label>
                                    <Input
                                        id="image-alt"
                                        value={block.props?.alt || ''}
                                        onChange={(e) => handlePropsUpdate('alt', e.target.value)}
                                        placeholder="Describe the image for accessibility"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="image-caption">Caption (optional)</Label>
                                    <Input
                                        id="image-caption"
                                        value={block.props?.caption || ''}
                                        onChange={(e) => handlePropsUpdate('caption', e.target.value)}
                                        placeholder="Add a caption to display below the image"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Custom Editor for Detail List (dl) blocks */}
                {block.type === 'dl' && block.children && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base">Detail List Items</Label>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex items-center gap-1"
                                onClick={handleAddDlItem}
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Item</span>
                            </Button>
                        </div>
                        
                        {block.children.map((group, groupIndex) => {
                            if (group.type !== 'dl-group' || !group.children) return null;
                            
                            const dtChild = group.children.find(child => child.type === 'dt');
                            const ddChild = group.children.find(child => child.type === 'dd');
                            
                            let dtContent = '';
                            let ddContent = '';
                            
                            if (dtChild?.text?.[0]?.props && 'content' in dtChild.text[0].props) {
                                dtContent = dtChild.text[0].props.content;
                            }
                            
                            if (ddChild?.children?.[0]?.text?.[0]?.props && 'content' in ddChild.children[0].text[0].props) {
                                ddContent = ddChild.children[0].text[0].props.content;
                            }
                            
                            return (
                                <div key={groupIndex} className="p-4 border border-border rounded-md space-y-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Item {groupIndex + 1}</span>
                                        <div className="flex items-center gap-1">
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                onClick={() => handleMoveDlItem(groupIndex, 'up')}
                                                disabled={groupIndex === 0}
                                                className="h-7 w-7"
                                            >
                                                <MoveUp className="w-4 h-4" />
                                            </Button>
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                onClick={() => handleMoveDlItem(groupIndex, 'down')}
                                                disabled={groupIndex === (block.children?.length || 0) - 1}
                                                className="h-7 w-7"
                                            >
                                                <MoveDown className="w-4 h-4" />
                                            </Button>
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                onClick={() => handleRemoveDlItem(groupIndex)}
                                                className="h-7 w-7 text-destructive hover:text-destructive"
                                            >
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <Label>Label</Label>
                                            <Input
                                                value={dtContent}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDlItemUpdate(groupIndex, 'dt', e.target.value)}
                                                placeholder="Enter label text"
                                            />
                                        </div>
                                        
                                        <div>
                                            <Label>Description</Label>
                                            <Textarea
                                                value={ddContent}
                                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleDlItemUpdate(groupIndex, 'dd', e.target.value)}
                                                placeholder="Enter description text"
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Regular Text Content Editor */}
                {block.text && block.type !== 'dl' && (
                    <div className="space-y-4">
                        <Label>Text Content</Label>
                        {block.text.map((content, index) => (
                            <div key={index} className="space-y-2">
                                {content.object === 'text' && (
                                    <div>
                                        <Input
                                            value={(content as TextContent).props.content}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTextContentUpdate(index, e.target.value)}
                                            placeholder="Enter text content"
                                        />
                                        <div className="flex gap-2 mt-1">
                                            {Object.entries((content as TextContent).annotations || {}).map(([key, value]) => (
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
                                            {(content as IconContent).props.icon}@{(content as IconContent).props.variant}
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
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleStyleUpdate(property, e.target.value)}
                                    placeholder={`Enter ${property}`}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {block.props && block.type !== 'image' && (
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