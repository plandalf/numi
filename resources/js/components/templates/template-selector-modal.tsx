import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { useState } from 'react';
import { TemplateRequestBanner } from './template-request-banner';
import { TemplateCategories } from './template-categories';
import { TemplateGrid } from './template-grid';
import { Template } from '@/types/template';
import { Button } from '../ui/button';

interface TemplateSelectorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    templates: Template[];
    categories: string[];
    onCreateNew?: () => void;
}

export function TemplateSelectorModal({ 
    open, 
    onOpenChange,
    templates: initialTemplates,
    categories,
    onCreateNew,
}: TemplateSelectorModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [templates] = useState(initialTemplates);

    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || template.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-7xl max-h-[90vh] p-0 border-none">
                <DialogHeader className="px-6 pt-6 flex flex-row items-center justify-between">
                    <DialogTitle className="text-2xl flex flex-row items-center gap-2">
                        Pick a template
                    </DialogTitle>
                    {onCreateNew && (
                        <Button className="mr-5" variant="default" size="sm" onClick={onCreateNew}>
                            Create from scratch
                        </Button>
                    )}
                    
                </DialogHeader>

                <div className="flex justify-center items-center px-6">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                        <Input
                            type="text"
                            placeholder="What would you like to create?"
                            className="pl-10 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="px-6 flex-1 overflow-hidden">
                    <div className="flex gap-8 h-full">
                        {/* Sidebar */}
                        <div className="w-64 flex-shrink-0">
                            <TemplateCategories
                                categories={categories}
                                selectedCategory={selectedCategory}
                                onCategorySelect={setSelectedCategory}
                            />
                        </div>

                        {/* Template Grid with Scroll */}
                        <div className="flex-1 overflow-y-auto pb-6 max-h-[60vh]">
                            <TemplateGrid
                                templates={filteredTemplates}
                                className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 mb-20"
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <TemplateRequestBanner className="border-none rounded-t-none rounded-b-lg absolute bottom-0 left-0 right-0" />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 