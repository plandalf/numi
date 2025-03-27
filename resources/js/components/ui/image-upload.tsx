import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Page } from '@inertiajs/core';
import axios from 'axios';

interface Media {
    id: number;
    url: string;
    filename?: string;
    mime_type?: string;
    size?: number;
}

interface UploadUrlResponse {
    media_id: number;
    upload_url: string;
}

interface PageProps {
    media: UploadUrlResponse;
}

interface Props {
    className?: string;
    value?: number | null;
    onChange?: (media: Media | null) => void;
    onError?: (error: string) => void;
    maxSize?: number; // in bytes
    preview?: string | null;
    disabled?: boolean;
}

export function ImageUpload({
    className,
    value,
    onChange,
    onError,
    maxSize = 10 * 1024 * 1024, // 10MB default
    preview,
    disabled = false,
}: Props) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(preview || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Log when preview URL changes
    useEffect(() => {
        console.log('Preview URL updated:', previewUrl);
    }, [previewUrl]);

    // Log when the preview prop changes from parent
    useEffect(() => {
        console.log('Preview prop changed:', preview);
        if (preview && preview !== previewUrl) {
            setPreviewUrl(preview);
        }
    }, [preview]);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            onError?.('Please select an image file');
            return;
        }

        // Validate file size
        if (file.size > maxSize) {
            setError(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
            onError?.(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
            return;
        }

        try {
            setIsUploading(true);
            setError(null);

            const { data } = await axios.post(route('medias.upload-url'), {
                filename: file.name,
                contentType: file.type,
                size: file.size,
                mime_type: file.type,
            });
            console.log({ data });

            const uploadResponse = await axios.put(data.uploadUrl, file, {
                headers: {
                    'Content-Type': file.type,
                    ...data.headers
                },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round(
                        (progressEvent.loaded * 100) / (progressEvent.total || file.size)
                    );
                    console.log('progress: ', progressEvent);
                }
            });

            // 3. Finalize the upload
            await axios.post(route('medias.finalize', { media: data.media_id }))
                .then(res => {
                    const responseData = res.data;
                    console.log('onSuccess', responseData);
                    
                    // Use the actual media URL from the server response instead of creating a temporary object URL
                    if (responseData.media && responseData.media.url) {
                        setPreviewUrl(responseData.media.url);
                        // Pass entire media object to parent
                        onChange?.(responseData.media);
                    } else {
                        // Fallback to object URL if server doesn't return a URL (shouldn't happen)
                        const objectUrl = URL.createObjectURL(file);
                        setPreviewUrl(objectUrl);
                        onChange?.(responseData.media);
                    }
                });

        } catch (error) {
            console.error('Upload failed:', error);
            const message = error instanceof Error ? error.message : 'Upload failed. Please try again.';
            setError(message);
            onError?.(message);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleClear = () => {
        setPreviewUrl(null);
        onChange?.(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={cn('relative', className)}>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={disabled || isUploading}
            />

            {previewUrl ? (
                <div className="relative w-full overflow-hidden rounded-lg border">
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className=" w-auto h-[250px]"
                    />
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2"
                        onClick={handleClear}
                        disabled={disabled || isUploading}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        'group relative aspect-square w-full overflow-hidden rounded-lg border-2 border-dashed',
                        isUploading && 'cursor-not-allowed opacity-50',
                        error && 'border-destructive'
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isUploading}
                >
                    {isUploading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                        <Upload className="h-6 w-6 transition-transform group-hover:scale-110" />
                    )}
                </Button>
            )}

            {error && (
                <p className="mt-2 text-sm text-destructive">{error}</p>
            )}
        </div>
    );
}
