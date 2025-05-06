import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TemplateRequestBanner } from '@/components/templates/template-request-banner';
import { TemplateCategories } from '@/components/templates/template-categories';
import { TemplateGrid } from '@/components/templates/template-grid';
import { TemplateSelectorModal } from '@/components/templates/template-selector-modal';
import AppLayout from '@/layouts/app-layout';
import { Template } from '@/types/template';

interface Props {
    globalTemplates: Template[];
    organizationTemplates: Template[];
    categories: string[];
}

export default function Templates({ globalTemplates, organizationTemplates, categories }: Props) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    const templates = [...organizationTemplates, ...globalTemplates];

    const filteredTemplates = templates.filter(template => {
        const matchesCategory = !selectedCategory || template.category === selectedCategory;
        return matchesCategory;
    });

    return (
        <AppLayout>
            <Head title="Templates" />
            
            <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                            Template
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Choose a template to customize for your business
                        </p>
                    </div>
                    <div className="flex flex-row gap-2">
                        <Button onClick={() => setIsSelectorOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create new experience
                        </Button>
                    </div>
                </div>

                {/* Banner */}
                <div className="mb-8">
                    <TemplateRequestBanner />
                </div>

                {/* Main Content */}
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <div className="w-64 flex-shrink-0">
                        <TemplateCategories
                            categories={categories}
                            selectedCategory={selectedCategory}
                            onCategorySelect={setSelectedCategory}
                        />
                    </div>

                    {/* Template Grid */}
                    <div className="flex-1">
                        <TemplateGrid
                            templates={filteredTemplates}
                            className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6"
                        />
                    </div>
                </div>

                {/* Template Selector Modal */}
                <TemplateSelectorModal
                    open={isSelectorOpen}
                    onOpenChange={setIsSelectorOpen}
                    templates={templates}
                    categories={categories}
                />
            </div>
        </AppLayout>
    );
} 