import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { ScrollArea } from './scroll-area';
import { Input } from './input';
import { Loader2, Search, ImageIcon, Check } from 'lucide-react';
import axios from 'axios';

interface Media {
    id: string;
    original_filename: string;
    url: string;
    path: string;
    created_at: string;
}

interface MediaPickerProps {
    open: boolean;
    onClose: () => void;
    onSelect: (media: { id: number; url: string }) => void;
    selectedUrl?: string;
}

export function MediaPicker({ open, onClose, onSelect, selectedUrl }: MediaPickerProps) {
    const [media, setMedia] = useState<Media[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

    const fetchMedia = async (searchQuery?: string) => {
        setLoading(true);
        try {
            const response = await axios.get(route('medias.index'), {
                params: {
                    search: searchQuery,
                    mime_type: 'image',
                },
            });
            setMedia(response.data.data);
        } catch (error) {
            console.error('Failed to fetch media:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchMedia();
        }
    }, [open]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            if (open) {
                fetchMedia(search);
            }
        }, 300);

        return () => clearTimeout(debounce);
    }, [search, open]);

    const handleSelect = () => {
        if (selectedMedia) {
            onSelect({
                id: parseInt(selectedMedia.id),
                url: selectedMedia.path,
            });
            onClose();
        }
    };

    const handleMediaClick = (mediaItem: Media) => {
        setSelectedMedia(mediaItem);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[600px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Select Media</DialogTitle>
                </DialogHeader>
                
                <div className="flex flex-col gap-4 flex-1 min-h-0">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="Search media..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Media Grid */}
                    <ScrollArea className="flex-1">
                        {loading ? (
                            <div className="flex items-center justify-center h-32">
                                <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                        ) : media.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                <ImageIcon className="w-12 h-12 mb-2" />
                                <p>No media found</p>
                                {search && (
                                    <p className="text-sm">Try a different search term</p>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-2">
                                {media.map((mediaItem) => (
                                    <div
                                        key={mediaItem.id}
                                        className={cn(
                                            "relative aspect-square rounded-lg border-2 overflow-hidden cursor-pointer transition-colors",
                                            selectedMedia?.id === mediaItem.id
                                                ? "border-primary bg-primary/10"
                                                : "border-border hover:border-primary/50",
                                            selectedUrl === mediaItem.path && "ring-2 ring-primary ring-offset-2"
                                        )}
                                        onClick={() => handleMediaClick(mediaItem)}
                                    >
                                        <img
                                            src={mediaItem.url}
                                            alt={mediaItem.original_filename}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                        {selectedMedia?.id === mediaItem.id && (
                                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                <div className="bg-primary text-primary-foreground rounded-full p-1">
                                                    <Check className="w-4 h-4" />
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                                            {mediaItem.original_filename}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            {selectedMedia ? `Selected: ${selectedMedia.original_filename}` : 'Select an image'}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleSelect} 
                                disabled={!selectedMedia}
                            >
                                Select
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 