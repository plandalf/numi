import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TemplateCategoriesProps {
    categories: string[];
    selectedCategory: string | null;
    onCategorySelect: (category: string | null) => void;
}

export function TemplateCategories({ categories, selectedCategory, onCategorySelect }: TemplateCategoriesProps) {
    return (
        <div className="space-y-2">
            <h3 className="font-semibold mb-4">Categories</h3>
            <Button
                variant="ghost"
                className={cn(
                    'w-full justify-start',
                    !selectedCategory && 'bg-blue-50 text-blue-600'
                )}
                onClick={() => onCategorySelect(null)}
            >
                All
            </Button>
            {categories.map((category) => (
                <Button
                    key={category}
                    variant="ghost"
                    className={cn(
                        'w-full justify-start',
                        selectedCategory === category && 'bg-blue-50 text-blue-600'
                    )}
                    onClick={() => onCategorySelect(category)}
                >
                    {category}
                </Button>
            ))}
        </div>
    );
} 