import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save } from 'lucide-react';
import { showToast } from '@/lib/notifications';
import { Theme, ThemeProperty, Element } from '@/types/theme';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
    theme: Theme;
    properties: ThemeProperty[];
    fonts: string[];
    weights: string[];
    returnUrl?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Theme settings',
        href: '/settings/themes',
    },
    {
        title: 'Edit Theme',
        href: '/settings/themes',
    },
];

export default function Edit({ theme, properties, fonts, weights }: Props) {

    const [activeTab, setActiveTab] = useState('color');
    const [themeData, setThemeData] = useState<Theme>(theme);
    const [themeName, setThemeName] = useState(theme.name);

    const handleSave = () => {
        // Convert complex objects to JSON strings for form submission
        router.put(route('themes.update', theme.id), {
            name: themeName ?? null,
            color: themeData.color,
            typography: themeData.typography,
            components: themeData.components,
        }, {
            onSuccess: () => {
                showToast('Theme updated successfully', 'success');
            },
            onError: (errors) => {
                showToast('Failed to update theme. ' + Object.values(errors).flat().join(', '), 'error');
            }
        });
    };

    const handleBack = () => {
        history.back();
    };

    // Generic update function for any property
    const updateProperty = (path: string[], value: string) => {
        setThemeData(prev => {
            const newTheme = { ...prev };
            let current: any = newTheme;
            
            // Navigate to the nested property
            for (let i = 0; i < path.length - 1; i++) {
                if (!current[path[i]]) {
                    current[path[i]] = {};
                }
                current = current[path[i]];
            }
            
            // Set the value
            current[path[path.length - 1]] = value;
            
            return newTheme;
        });
    };

    // Get the current value for a property
    const getPropertyValue = (path: string[]): string => {
        let current: any = themeData;
        
        // Navigate to the nested property
        for (let i = 0; i < path.length; i++) {
            if (!current || !current[path[i]]) {
                return '';
            }
            current = current[path[i]];
        }
        
        return current || '';
    };

    // Render a field based on its type
    const renderField = (property: ThemeProperty, path: string[] = []) => {
        const { name, type, default: defaultValue, properties } = property;
        const currentPath = [...path, name];
        const value = getPropertyValue(currentPath);
        
        // For object types, render a section with nested properties
        if (type === Element.Object && properties) {
            return (
                <div key={name} className="space-y-4">
                    <h3 className="text-lg font-medium">{name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {properties.map(prop => renderField(prop, currentPath))}
                    </div>
                </div>
            );
        }
        
        // For color types, render a color picker
        if (type === Element.Color) {
            return (
                <div key={name} className="space-y-2">
                    <Label htmlFor={currentPath.join('-')}>{name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                    <div className="flex gap-2">
                        <Input 
                            id={currentPath.join('-')}
                            type="color" 
                            value={value || defaultValue || '#000000'} 
                            onChange={(e) => updateProperty(currentPath, e.target.value)}
                            className="w-12 h-10 p-1"
                        />
                        <Input 
                            type="text" 
                            value={value || defaultValue || '#000000'} 
                            onChange={(e) => updateProperty(currentPath, e.target.value)}
                            className="flex-1"
                        />
                    </div>
                </div>
            );
        }
        
        // For font types, render a font selector
        if (type === Element.Font) {

            return (
                <div key={name} className="space-y-2">
                    <Label htmlFor={currentPath.join('-')}>{name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                    <Select 
                        value={value || defaultValue || ''} 
                        onValueChange={(newValue) => updateProperty(currentPath, newValue)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={`Select ${name}`} />
                        </SelectTrigger>
                        <SelectContent>
                            {fonts.map(font => (
                                <SelectItem key={font} value={font}>{font}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            );
        }
        
        // For weight types, render a weight selector
        if (type === Element.Weight) {
            return (
                <div key={name} className="space-y-2">
                    <Label htmlFor={currentPath.join('-')}>{name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                    <Select 
                        value={value || defaultValue || ''} 
                        onValueChange={(newValue) => updateProperty(currentPath, newValue)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={`Select ${name}`} />
                        </SelectTrigger>
                        <SelectContent>
                            {weights.map(weight => (
                                <SelectItem key={weight} value={weight}>{weight}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            );
        }
        
        // Default case: render a text input
        return (
            <div key={name} className="space-y-2">
                <Label htmlFor={currentPath.join('-')}>{name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                <Input 
                    id={currentPath.join('-')}
                    value={value || defaultValue || ''} 
                    onChange={(e) => updateProperty(currentPath, e.target.value)}
                />
            </div>
        );
    };

    // Render a section based on the property structure
    const renderSection = (section: ThemeProperty) => {
        return (
            <div key={section.name} className="space-y-6">
                {renderField(section)}
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Theme Editor" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={handleBack}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <Input 
                                value={themeName}
                                onChange={(e) => setThemeName(e.target.value)}
                                className="text-2xl font-bold h-10 border-none bg-transparent p-0 focus-visible:ring-0"
                                placeholder="Untitled theme"
                            />
                            <p className="text-muted-foreground">Customize the theme settings</p>
                        </div>
                    </div>
                    <Button onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                    </Button>
                </div>

                <Card className="border-0 shadow-none">
                    <CardContent className="p-0">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-4">
                                {properties.map(section => (
                                    <TabsTrigger key={section.name} value={section.name}>
                                        {section.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            {properties.map(section => (
                                <TabsContent key={section.name} value={section.name} className="mt-0">
                                    {renderSection(section)}
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}