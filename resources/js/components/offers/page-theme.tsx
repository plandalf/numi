import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Theme } from '@/types/theme';
import { ColorPickerEditor } from '../editor/color-picker-editor';
import { EnumerationEditor } from '../editor/enumeration-editor';
import { ShadowPickerEditor } from '../editor/shadow-picker-editor';
import { StringEditor } from '../editor/string-editor';
import { TypographyEditor } from '../editor/typography-editor';
import { Accordion, AccordionContent, AccordionTrigger } from '@radix-ui/react-accordion';
import { cn } from '@/lib/utils';
import { AccordionItem } from '../ui/accordion';
import ThemePreviewCard from './theme-preview-card';
import SearchBar from './search-bar';
import { router, usePage } from '@inertiajs/react';
import { EditProps } from '@/pages/offers/edit';
import { useEditor } from '@/contexts/offer/editor-context';

export const colorFields = [
  { key: 'primary_color', label: 'Primary' },
  { key: 'secondary_color', label: 'Secondary' },
  { key: 'canvas_color', label: 'Canvas' },
  { key: 'primary_surface_color', label: 'Primary Surface' },
  { key: 'secondary_surface_color', label: 'Secondary Surface' },
  { key: 'primary_border_color', label: 'Primary Border' },
  { key: 'secondary_border_color', label: 'Secondary Border' },
  { key: 'light_text_color', label: 'Light Text' },
  { key: 'dark_text_color', label: 'Dark Text' },
  { key: 'danger_color', label: 'Danger' },
  { key: 'info_color', label: 'Info' },
  { key: 'warning_color', label: 'Warning' },
  { key: 'success_color', label: 'Success' },
  { key: 'highlight_color', label: 'Highlight' },
];

export const getThemeColors = (theme: Theme) => {
  return colorFields.reduce((acc, f) => ({
    ...acc,
    [f.label]: theme?.[f.key as keyof Theme] as string ?? ''
  }), {});
};

export const typographyFields = [
  { key: 'main_font', label: 'Main Font', type: 'font' },
  { key: 'mono_font', label: 'Mono Font', type: 'font' },
  { key: 'h1_typography', label: 'Heading 1', type: 'typography' },
  { key: 'h2_typography', label: 'Heading 2', type: 'typography' },
  { key: 'h3_typography', label: 'Heading 3', type: 'typography' },
  { key: 'h4_typography', label: 'Heading 4', type: 'typography' },
  { key: 'h5_typography', label: 'Heading 5', type: 'typography' },
  { key: 'h6_typography', label: 'Heading 6', type: 'typography' },
  { key: 'label_typography', label: 'Label', type: 'typography' },
  { key: 'body_typography', label: 'Body', type: 'typography' },
];

export const componentFields = [
  { key: 'border_radius', label: 'Border Radius', type: 'border' },
  { key: 'shadow_sm', label: 'Shadow (Small)', type: 'shadow' },
  { key: 'shadow_md', label: 'Shadow (Medium)', type: 'shadow' },
  { key: 'shadow_lg', label: 'Shadow (Large)', type: 'shadow' },
];

export const PageTheme: React.FC = () => {

  const { organizationThemes, globalThemes, data, setData } = useEditor();
  const { fonts, weights } = usePage<EditProps>().props;
  const [tab, setTab] = useState<'all' | 'custom'>('all');
  const [theme, setTheme] = useState<Theme>(data.theme);
  const [openSection, setOpenSection] = useState<string>('colors');
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [themeSettingTab, setThemeSettingTab] = useState<'new' | 'saved'>('new');
  const [selectedThemeId, setSelectedThemeId] = useState<string>('');
  const [selectThemeError, setSelectThemeError] = useState<string | null>(null);

  const onThemeChange = (theme: Theme) => setData({ ...data, theme });

  // Update parent on local theme change
  const handleThemeChange = (key: keyof Theme, value: any) => {
    const updated = { ...theme, [key]: value };
    setTheme(updated);
    onThemeChange(updated);
  };

  const onThemeSelect = (selectedTheme: Theme) => {
    // Create a new theme object with all fields
    const newTheme = {
      ...theme,
      // Colors
      ...colorFields.reduce((acc, field) => ({
        ...acc,
        [field.key]: selectedTheme[field.key as keyof Theme] ?? ''
      }), {}),
      // Typography
      ...typographyFields.reduce((acc, field) => ({
        ...acc,
        [field.key]: selectedTheme[field.key as keyof Theme] ?? ''
      }), {}),
      // Components
      ...componentFields.reduce((acc, field) => ({
        ...acc,
        [field.key]: selectedTheme[field.key as keyof Theme] ?? ''
      }), {})
    };

    setTheme(newTheme);
    onThemeChange(newTheme);
    setTab('custom');
  };

  // Filter themes by search
  const filteredThemes = [...organizationThemes, ...globalThemes].filter(t =>
    (t.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveTheme = () => {
    if (!selectedThemeId) {
      setSelectThemeError('Please select a theme to update to.');
      return;
    }

    setSelectThemeError(null);
    setSaving(true);

    const { name, ...payload } = theme;
    router.put(route('themes.update', selectedThemeId), payload, {
      onSuccess: () => {
        setSaving(false);
      },
      onError: () => setSaving(false),
    });
  };

  const handleCreateTheme = () => {
    if (!name.trim()) {
      setNameError('Theme name is required.');
      return;
    }

    setNameError(null);
    setSaving(true);

    const payload = { ...theme, name };

    router.post(route('themes.store'), payload, {
      onSuccess: () => {
        setSaving(false);
        setName('');
      },
      onError: () => setSaving(false),
    });
  }

  
  return (
    <div className="flex flex-col h-full p-4">
      <Tabs value={tab} onValueChange={v => setTab(v as 'all' | 'custom')} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="all">All Themes</TabsTrigger>
          <TabsTrigger value="custom">Custom Theme</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <SearchBar 
            placeholder="Search themes" 
            value={search}
            onChange={setSearch}
          />
          {filteredThemes.map(t => (
            <ThemePreviewCard
              key={t.id}
              theme={t}
              onClick={() => onThemeSelect(t)}
            />
          ))}
        </TabsContent>
        <TabsContent value="custom">
          <div className="flex flex-col gap-6">
            <Accordion
              type="single"
              collapsible
              className="rounded-xl space-y-2"
              value={openSection}
              onValueChange={setOpenSection}
            >
              {/* Colors */}
              <AccordionItem
                value="colors"
                className="rounded-lg border-none shadow-none"
              >
                <AccordionTrigger 
                  className={cn(
                    'flex items-center justify-between w-full p-4 py-3',
                    'rounded-lg transition-colors group cursor-pointer',
                    'no-underline hover:no-underline bg-gray-200 text-muted-foreground',
                    openSection === 'colors' && 'bg-teal-600 text-white'
                  )}
                >
                  <span className="font-medium text-sm text-left">Colors</span>
                </AccordionTrigger>
                <AccordionContent className="bg-white rounded-b-lg px-2 pt-2 space-y-3">
                  {colorFields.map(f => (
                    <ColorPickerEditor
                      key={f.key}
                      label={f.label}
                      value={theme?.[f.key as keyof Theme] as string ?? ''}
                      onChange={v => handleThemeChange(f.key as keyof Theme, v)}
                      type='advanced'
                    />
                  ))}
                </AccordionContent>
              </AccordionItem>


              {/* Typography */}
              <AccordionItem
                value="typography"
                className="rounded-lg border-none shadow-none"
              >
                <AccordionTrigger 
                  className={cn(
                    'flex items-center justify-between w-full px-4 py-3 mb-2',
                    'rounded-lg transition-colors group cursor-pointer',
                    'no-underline hover:no-underline bg-gray-200 text-muted-foreground',
                    openSection === 'typography' && 'bg-teal-600 text-white'
                  )}
                >
                  <span className="font-medium text-sm text-left">Typography</span>
                </AccordionTrigger>
                <AccordionContent className="bg-white rounded-b-lg space-y-3">
                  {typographyFields.map(f => {
                    if (f.type === 'font') {
                      return (
                        <EnumerationEditor
                          key={f.key}
                          label={f.label}
                          value={theme?.[f.key as keyof Theme] as string ?? ''}
                          onChange={v => handleThemeChange(f.key as keyof Theme, v)}
                          options={fonts}
                        />
                      );
                    }
                    if (f.type === 'typography') {
                      return (
                        <TypographyEditor
                          key={f.key}
                          label={f.label}
                          value={theme?.[f.key as keyof Theme] as string[] ?? ['', '', '']}
                          onChange={v => handleThemeChange(f.key as keyof Theme, v)}
                          fonts={fonts}
                          weights={weights}
                        />
                      );
                    }
                    return null;
                  })}
                </AccordionContent>
              </AccordionItem>



              {/* Components */}
              <AccordionItem
                value="components"
                className="rounded-lg border-none shadow-none"
              >
                <AccordionTrigger 
                  className={cn(
                    'flex items-center justify-between w-full px-4 py-3 mb-2',
                    'rounded-lg transition-colors group cursor-pointer',
                    'no-underline hover:no-underline bg-gray-200 text-muted-foreground',
                    openSection === 'components' && 'bg-teal-600 text-white'
                  )}
                >
                  <span className="font-medium text-sm text-left">Components</span>
                </AccordionTrigger>
                <AccordionContent className="bg-white rounded-b-lg space-y-3">
                  {componentFields.map(f => {
                    if (f.type === 'border') {
                      return (
                        <EnumerationEditor
                          key={f.key}
                          label={f.label}
                          value={theme?.[f.key as keyof Theme] as string ?? ''}
                          onChange={v => handleThemeChange(f.key as keyof Theme, v)}
                          options={[ '0px', '4px', '8px', '12px', '16px', '24px', '32px' ]}
                        />
                      );
                    }
                    if (f.type === 'shadow') {
                      let label = f.label;
                      let key = f.key;
                      return (
                        <ShadowPickerEditor
                          key={key}
                          label={label}
                          value={theme?.[key as keyof Theme] as string}
                          onChange={v => handleThemeChange(key as keyof Theme, v)}
                        />
                      );
                    }
                    return null;
                  })}
                </AccordionContent>
              </AccordionItem>


              {/* Theme Settings */}
              <AccordionItem
                value="theme-settings"
                className="rounded-lg border-none shadow-none"
              >
                <AccordionTrigger 
                  className={cn(
                    'flex items-center justify-between w-full px-4 py-3 mb-2',
                    'rounded-lg transition-colors group cursor-pointer',
                    'no-underline hover:no-underline bg-gray-200 text-muted-foreground',
                    openSection === 'theme-settings' && 'bg-teal-600 text-white'
                  )}
                >
                  <span className="font-medium text-sm text-left">Theme Settings</span>
                </AccordionTrigger>
                <AccordionContent className="bg-white rounded-b-lg flex flex-col gap-2">
                  <Tabs value={themeSettingTab} onValueChange={v => setThemeSettingTab(v as 'new' | 'saved')} className="w-full">
                    <TabsList className="grid grid-cols-2">
                      <TabsTrigger value="new" disabled={saving}>Create new theme</TabsTrigger>
                      <TabsTrigger value="saved" disabled={saving}>Update to existing</TabsTrigger>
                    </TabsList>
                    <TabsContent value="new" className="space-y-3">
                      <StringEditor
                        value={name}
                        onChange={v => setName(v)}
                        placeholder="e.g. My Theme"
                      />
                      {nameError && <div className="text-xs text-red-500">{nameError}</div>}
                      <Button
                        className="w-full mb-2"
                        onClick={handleCreateTheme}
                        disabled={saving}
                      >
                        {saving 
                          ? 'Creating...' 
                          : 'Create Theme'
                        }
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        Save this theme to use it on other experiences.
                      </div>
                    </TabsContent>
                    <TabsContent value="saved" className="space-y-3">
                      <EnumerationEditor
                        placeholder="Select a theme"
                        value={selectedThemeId}
                        onChange={setSelectedThemeId}
                        options={organizationThemes.map(t => t.id)}
                        labels={organizationThemes.reduce((acc, t) => ({
                          ...acc,
                          [t.id]: t.name ?? 'Untitled theme'
                        }), {})}
                      />
                      {selectThemeError && <div className="text-xs text-red-500">{selectThemeError}</div>}
                      <Button
                        className="w-full mb-2"
                        onClick={handleSaveTheme}
                        disabled={saving}
                      >
                        {saving 
                          ? 'Updating...' 
                          : 'Update Theme'
                        }
                      </Button>
                    </TabsContent>
                  </Tabs>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PageTheme; 