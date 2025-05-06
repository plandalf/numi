import { Template } from '@/types/template';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';

interface TemplatePreviewModalProps {
    template: Template | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TemplatePreviewModal({ template, open, onOpenChange }: TemplatePreviewModalProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const handleOpenChange = (open: boolean) => {
        setCurrentImageIndex(0);
        onOpenChange(open);
    };

    if (!template) return null;

    const handlePrevious = () => {
        setCurrentImageIndex((prev) => 
            prev === 0 ? template.preview_images.length - 1 : prev - 1
        );
    };

    const handleNext = () => {
        setCurrentImageIndex((prev) => 
            prev === template.preview_images.length - 1 ? 0 : prev + 1
        );
    };

    const handleUseTemplate = () => {
        setIsLoading(true);
        router.post(`/templates/${template.id}/use`, {}, {
            onFinish: () => setIsLoading(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="!max-w-5xl p-0 bg-blue-950 border-teal-950 text-white">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>{template.name}</DialogTitle>
                    {template.description && (
                        <p className="text-white">{template.description}</p>
                    )}
                </DialogHeader>

                <div className="relative aspect-[16/9] ">
                    {/* Carousel */}
                    <div className="relative h-full">
                        {template?.preview_images?.map((image, index) => (
                            <div
                                key={index}
                                className={cn(
                                    'absolute inset-0 transition-opacity duration-300',
                                    index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                                )}
                            >
                                <img
                                    src={image}
                                    alt={`${template.name} preview ${index + 1}`}
                                    className="object-contain w-full h-full"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Navigation Buttons */}
                    {template?.preview_images?.length > 1 && (
                        <>
                            <button
                                onClick={handlePrevious}
                                className="absolute left-4 cursor-pointer top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2"
                            >
                                <ArrowLeft className="h-6 w-6 text-black" />
                            </button>
                            <button
                                onClick={handleNext}
                                className="absolute right-4 cursor-pointer top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2"
                            >
                                <ArrowRight className="h-6 w-6 text-black" />
                            </button>
                        </>
                    )}
                </div>

                <div className="pb-4 flex justify-center">
                    <Button 
                        className="cursor-pointer"
                        variant="secondary"
                        size="lg" 
                        onClick={handleUseTemplate}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating...' : 'Use Template'}
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
} 