import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save } from 'lucide-react';
import { showToast } from '@/lib/notifications';
import { Theme, FieldType } from '@/types/theme';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
    theme: Theme;
    fonts: string[];
    weights: string[];
    returnUrl?: string;
}

interface Field {
    key: keyof Theme;
    type: FieldType;
    label?: string;
}

const colorFields: Field[] = [
    { key: 'primary_color', type: FieldType.Color, label: 'Primary' },
    { key: 'secondary_color', type: FieldType.Color, label: 'Secondary' },
    { key: 'canvas_color', type: FieldType.Color, label: 'Canvas' },
    { key: 'primary_surface_color', type: FieldType.Color, label: 'Primary Surface' },
    { key: 'secondary_surface_color', type: FieldType.Color, label: 'Secondary Surface' },
    { key: 'primary_border_color', type: FieldType.Color, label: 'Primary Border' },
    { key: 'secondary_border_color', type: FieldType.Color, label: 'Secondary Border' },
    { key: 'light_text_color', type: FieldType.Color, label: 'Light Text' },
    { key: 'dark_text_color', type: FieldType.Color, label: 'Dark Text' },
    { key: 'danger_color', type: FieldType.Color, label: 'Danger' },
    { key: 'info_color', type: FieldType.Color, label: 'Info' },
    { key: 'warning_color', type: FieldType.Color, label: 'Warning' },
    { key: 'success_color', type: FieldType.Color, label: 'Success' },
    { key: 'highlight_color', type: FieldType.Color, label: 'Highlight' },
];

const typographyFields: Field[] = [
    { key: 'main_font', type: FieldType.Font },
    { key: 'mono_font', type: FieldType.Font },
    { key: 'h1_typography', type: FieldType.Typography, label: 'Heading 1' },
    { key: 'h2_typography', type: FieldType.Typography, label: 'Heading 2' },
    { key: 'h3_typography', type: FieldType.Typography, label: 'Heading 3' },
    { key: 'h4_typography', type: FieldType.Typography, label: 'Heading 4' },
    { key: 'h5_typography', type: FieldType.Typography, label: 'Heading 5' },
    { key: 'h6_typography', type: FieldType.Typography, label: 'Heading 6' },
    { key: 'label_typography', type: FieldType.Typography, label: 'Label' },
    { key: 'body_typography', type: FieldType.Typography, label: 'Body' },
];

const componentFields: Field[] = [
    { key: 'border_radius', type: FieldType.Size },
    { key: 'shadow_sm', type: FieldType.Shadow, label: 'Shadow (Small)' },
    { key: 'shadow_md', type: FieldType.Shadow, label: 'Shadow (Medium)' },
    { key: 'shadow_lg', type: FieldType.Shadow, label: 'Shadow (Large)' },
];

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

const getReadableFieldName = (field: string): string => {
    return field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function Edit({ theme, fonts, weights }: Props) {
    const [activeTab, setActiveTab] = useState('color');
    const [themeData, setThemeData] = useState<Theme>(theme);
    const [themeName, setThemeName] = useState(theme.name);

    const handleSave = () => {
        router.put(route('themes.update', theme.id), {
            ...themeData,
            name: themeName ?? null,
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

    const handleFieldChange = (key: keyof Theme, value: any) => {
        setThemeData(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const renderField = (field: Field) => {
        const value = themeData[field.key];
        const label = field.label || getReadableFieldName(field.key);

        switch (field.type) {
            case FieldType.Color:
                return (
                    <div key={field.key} className="space-y-2">
                        <Label htmlFor={field.key}>{label}</Label>
                        <div className="flex gap-2">
                            <Input 
                                id={field.key}
                                type="color" 
                                value={value as string || '#000000'} 
                                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                className="w-12 h-10 p-1"
                            />
                            <Input 
                                type="text" 
                                value={value as string || '#000000'} 
                                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                className="flex-1"
                            />
                        </div>
                    </div>
                );

            case FieldType.Font:
                return (
                    <div key={field.key} className="space-y-2">
                        <Label htmlFor={field.key}>{label}</Label>
                        <Select 
                            value={value as string || ''} 
                            onValueChange={(newValue) => handleFieldChange(field.key, newValue)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={`Select ${label}`} />
                            </SelectTrigger>
                            <SelectContent>
                                {fonts.map(font => (
                                    <SelectItem key={font} value={font}>{font}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );

            case FieldType.Typography: {
                console.log(value);
                let size = '', font = '', weight = '';
                if (Array.isArray(value)) {
                    [size = '', font = '', weight = ''] = value;
                }
                return (
                    <div key={field.key} className="space-y-4">
                        <Label>{label}</Label>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor={`${field.key}-size`}>Size</Label>
                                <Input 
                                    id={`${field.key}-size`}
                                    value={size}
                                    onChange={(e) => handleFieldChange(field.key, [e.target.value, font, weight])}
                                    placeholder="e.g., 16px"
                                />
                            </div>
                            <div>
                                <Label htmlFor={`${field.key}-font`}>Font</Label>
                                <Select 
                                    value={font} 
                                    onValueChange={(newValue) => handleFieldChange(field.key, [size, newValue, weight])}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select font" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {fonts.map(f => (
                                            <SelectItem key={f} value={f}>{f}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor={`${field.key}-weight`}>Weight</Label>
                                <Select 
                                    value={weight} 
                                    onValueChange={(newValue) => handleFieldChange(field.key, [size, font, newValue])}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select weight" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {weights.map(w => (
                                            <SelectItem key={w} value={w}>{w}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                );
            }

            case FieldType.Size:
            case FieldType.Shadow:
                return (
                    <div key={field.key} className="space-y-2">
                        <Label htmlFor={field.key}>{label}</Label>
                        <Input 
                            id={field.key}
                            value={value as string || ''} 
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            placeholder={field.type === FieldType.Size ? "e.g., 4px" : "e.g., 0 1px 2px rgba(0,0,0,0.1)"}
                        />
                    </div>
                );
        }
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
                                <TabsTrigger value="color">Colors</TabsTrigger>
                                <TabsTrigger value="typography">Typography</TabsTrigger>
                                <TabsTrigger value="components">Components</TabsTrigger>
                            </TabsList>

                            <TabsContent value="color" className="mt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {colorFields.map(field => renderField(field))}
                                </div>
                            </TabsContent>

                            <TabsContent value="typography" className="mt-0">
                                <div className="space-y-6">
                                    {typographyFields.map(field => renderField(field))}
                                </div>
                            </TabsContent>

                            <TabsContent value="components" className="mt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {componentFields.map(field => renderField(field))}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}