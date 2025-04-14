import { Template } from '@/types/template';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import { TemplatePreviewModal } from './template-preview-modal';
import { cn } from '@/lib/utils';

interface TemplateGridProps {
    templates: Template[];
    className?: string;
}

export function TemplateGrid({ templates, className }: TemplateGridProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleTemplateClick = (template: Template) => {
        setSelectedTemplate(template);
        setIsModalOpen(true);
    };

    return (
        <>
            <div className={cn(className)}>
                {templates.map((template) => (
                    <Card 
                        key={template.id} 
                        className="w-[300px] h-[300px] overflow-hidden py-0 rounded-sm flex flex-col gap-0 cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => handleTemplateClick(template)}
                    >
                        {/* Preview Image */}
                        <div className="h-[250px] relative overflow-hidden">
                            {template.preview_images?.[0] && (
                                <img
                                    src={template.preview_images[0]}
                                    alt={template.name}
                                    className="object-cover w-full h-full"
                                />
                            )}
                        </div>

                        <CardContent className="px-4 py-3 flex-1">
                            <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
                            {template.description && (
                                <p className="text-gray-600 text-sm line-clamp-2">
                                    {template.description}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <TemplatePreviewModal
                template={selectedTemplate}
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
            />
        </>
    );
} 