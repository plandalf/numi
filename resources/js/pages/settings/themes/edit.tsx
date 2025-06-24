import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { showToast } from '@/lib/notifications';
import { Theme, FieldType } from '@/types/theme';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FontValue } from '@/contexts/Numi';

interface Props {
    theme: Theme;
    fonts: string[];
    weights: string[];
    returnUrl?: string;
}

interface Field {
    key: keyof Theme;
    description?: string;
    group?: string;
    default?: string | string[] | undefined;
    type: FieldType;
    label?: string;
}


const colorFields: Field[] = [
    { key: 'primary_color', group: 'Core', default: '#355dfb', description: 'Default accent color used by the majority of components.', type: FieldType.Color, label: 'Primary' },
    { key: 'primary_contrast_color', group: 'Core', default: '#52525d', description: 'Optional secondary color, available as a swatch in the component Style editor. Components won\'t use this color by default.', type: FieldType.Color, label: 'Secondary' },
    { key: 'secondary_color', group: 'Core', default: '#52525d', description: 'Optional secondary color, available as a swatch in the component Style editor. Components won\'t use this color by default.', type: FieldType.Color, label: 'Secondary' },
    { key: 'secondary_contrast_color', group: 'Core', default: '#52525d', description: 'Optional secondary color, available as a swatch in the component Style editor. Components won\'t use this color by default.', type: FieldType.Color, label: 'Secondary' },

    { key: 'canvas_color', group: 'Core', default: '#ffffff', description: 'Default background color for the entire app.', type: FieldType.Color, label: 'Canvas' },
    { key: 'primary_surface_color', group: 'Core', default: '#ffffff', description: 'Default background color for Containers and Tables.', type: FieldType.Color, label: 'Primary Surface' },
    { key: 'secondary_surface_color', group: 'Core', default: '#ffffff', description: 'Default background color for Inputs.', type: FieldType.Color, label: 'Secondary Surface' },

    { key: 'primary_border_color', group: 'Core', default: '#dadada', description: 'Default border color for Containers and Tables.', type: FieldType.Color, label: 'Primary Border' },
    { key: 'secondary_border_color', group: 'Core', default: '#dadada', description: 'Default border color for Inputs.', type: FieldType.Color, label: 'Secondary Border' },

    { key: 'warning_color', group: 'Status', default: '#fab900', description: 'Default color used to indicate a warning.', type: FieldType.Color, label: 'Warning' },
    { key: 'success_color', group: 'Status', default: '#12a63e', description: 'Default color used to indicate success and positive trends.', type: FieldType.Color, label: 'Success' },
    { key: 'highlight_color', group: 'Status', default: '#d8f1fe', description: 'Default color for highlighting matches in a searchable list.', type: FieldType.Color, label: 'Highlight' },
];

const typographyFields: Field[] = [
    { key: 'main_font', group: 'Fonts', type: FieldType.Font },
    { key: 'mono_font', group: 'Fonts', type: FieldType.Font },
    { key: 'h1_typography', group: 'Type Style', type: FieldType.Typography, label: 'Heading 1' },
    { key: 'h2_typography', group: 'Type Style', type: FieldType.Typography, label: 'Heading 2' },
    { key: 'h3_typography', group: 'Type Style', type: FieldType.Typography, label: 'Heading 3' },
    { key: 'h4_typography', group: 'Type Style', type: FieldType.Typography, label: 'Heading 4' },
    { key: 'h5_typography', group: 'Type Style', type: FieldType.Typography, label: 'Heading 5' },
    { key: 'label_typography', group: 'Type Style', type: FieldType.Typography, label: 'Label' },
    { key: 'body_typography', group: 'Type Style', type: FieldType.Typography, label: 'Body' },
];

const componentFields: Field[] = [
    { key: 'border_radius', group: 'Box', type: FieldType.Size },
    { key: 'padding', group: 'Spacing', type: FieldType.Size, label: 'Padding' },
    { key: 'spacing', group: 'Spacing', type: FieldType.Size, label: 'Spacing' },
    { key: 'margin', group: 'Spacing', type: FieldType.Size, label: 'Margin' },
    { key: 'shadow', group: 'Shadow', type: FieldType.Shadow, label: 'Shadow' },
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

const getDefaultThemeData = (fieldsArrays: Field[][]): Partial<Theme> => {
    const defaults: Partial<Theme> = {};
    fieldsArrays.forEach(fields => {
        fields.forEach(field => {
            if (field.default !== undefined) {
                // @ts-expect-error - We know key is a valid Theme key
                defaults[field.key] = field.default;
            }
        });
    });
    return defaults;
};

const getReadableFieldName = (field: string): string => {
    return field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function Edit({ theme, fonts, weights }: Props) {
    const [activeTab, setActiveTab] = useState('color');
    const initialThemeData = {
        ...getDefaultThemeData([colorFields, typographyFields, componentFields]),
        ...theme,
    };
    const [themeData, setThemeData] = useState<Theme>(initialThemeData);
    const [themeName, setThemeName] = useState(theme.name);

    const handleSave = () => {
        router.put(route('organizations.themes.update', theme.id), {
            ...themeData,
            name: themeName ?? null,
        }, {
            onSuccess: () => {
                // showToast('Theme updated successfully', 'success');
            },
            onError: (errors) => {
                showToast('Failed to update theme. ' + Object.values(errors).flat().join(', '), 'error');
            }
        });
    };

    const handleReset = () => {
        const defaultTheme = getDefaultThemeData([colorFields, typographyFields, componentFields]);
        // We need to ensure all keys from the original theme prop are present,
        // even if they didn't have a default, but set them to undefined or their default.
        // The simplest way to ensure the full theme structure is to merge defaults into a clear structure based on initialThemeData.
        const resetData = { ...initialThemeData }; // Start with the full structure
        for (const key in resetData) {
            // @ts-expect-error - key is a valid Theme key
            resetData[key] = defaultTheme[key] !== undefined ? defaultTheme[key] : initialThemeData[key];
        }
        setThemeData(resetData);
        showToast('Theme has been reset to default values.', 'info');
    };

    const handleBack = () => {
        history.back();
    };

    const handleFieldChange = (key: keyof Theme, value: string | string[] | undefined) => {
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
                    <div key={field.key} className="grid grid-cols-4 items-center">
                        <div className="col-span-3">
                          <Label htmlFor={field.key}>{label}</Label>
                          <div className="text-gray-600 text-sm">{field.description}</div>
                        </div>
                        <div className="flex gap-2 h-8 ">
                            <div className="border rounded-lg flex items-center pl-1">
                              <Input
                                id={field.key}
                                type="color"
                                value={value as string || '#000000'}
                                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                className="w-6 h-6 aspect-square p-0 border-none "
                              />
                              <Input
                                type="text"
                                value={value as string || '#000000'}
                                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                className="flex-1 text-sm p-2 border-none"
                              />
                            </div>
                        </div>
                    </div>
                );

            case FieldType.Font:
                return (
                    <div key={field.key} className="grid grid-cols-4 items-center">
                        <div className="col-span-1">
                            <Label htmlFor={field.key}>{label}</Label>
                        </div>
                        <div className="col-span-3">     
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
                    </div>
                );

            case FieldType.Typography: {
                const { size = '', font = '', weight = '' } = (value as FontValue) || {};
                console.log(size, font, weight);
                return (
                    <div key={field.key} className="grid grid-cols-4 items-center">
                        <div className="col-span-1 flex items-center">
                            <Label htmlFor={field.key}>{label}</Label>
                        </div>
                        <div className="col-span-3 grid grid-cols-3 gap-2">
                            <div>
                                <Label htmlFor={`${field.key}-size`}>Size</Label>
                                <Input
                                    id={`${field.key}-size`}
                                    value={size}
                                    onChange={(e) => handleFieldChange(field.key, [e.target.value, font, weight])}
                                    placeholder="e.g., 16px"
                                />
                            </div>
                            <div className="">
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

    const renderFieldsWithInternalGroups = (fields: Field[]) => {
        const groups = fields.reduce((acc, field) => {
            const groupKey = field.group || 'Unknown';
            if (!acc[groupKey]) {
                acc[groupKey] = [];
            }
            acc[groupKey].push(field);
            return acc;
        }, {} as Record<string, Field[]>);

        return Object.entries(groups).map(([groupName, groupFields], index) => (
            <div key={groupName} className={index > 0 ? "space-y-4 mt-6" : "space-y-4"}>
                <h3 className="text-lg font-medium">{groupName}</h3>
                <div className={"space-y-4"}>
                    {groupFields.map(field => renderField(field))}
                </div>
            </div>
        ));
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
                                placeholder="Untitled theme"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleReset} variant="outline">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset
                        </Button>
                        <Button onClick={handleSave}>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </Button>
                    </div>
                </div>

                <div className="">
                    <CardContent className="p-0">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-4">
                                <TabsTrigger value="color">Color</TabsTrigger>
                                <TabsTrigger value="typography">Typography</TabsTrigger>
                                <TabsTrigger value="components">Components</TabsTrigger>
                            </TabsList>

                            <TabsContent value="color" className="mt-0">
                                {renderFieldsWithInternalGroups(colorFields)}
                            </TabsContent>

                            <TabsContent value="typography" className="mt-0">
                                {renderFieldsWithInternalGroups(typographyFields)}
                            </TabsContent>

                            <TabsContent value="components" className="mt-0">
                                {renderFieldsWithInternalGroups(componentFields)}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </div>
            </div>
        </AppLayout>
    );
}
