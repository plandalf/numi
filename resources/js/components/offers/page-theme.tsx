import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Theme } from '@/types/theme';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

import ThemePreviewCard from './theme-preview-card';
import SearchBar from './search-bar';
import { router, usePage } from '@inertiajs/react';
import { EditProps } from '@/pages/offers/edit';
import { useEditor } from '@/contexts/offer/editor-context';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { StyleEditor } from '../editor/style-editor';
import { StyleItem } from '../editor/style-editor';
import { Separator } from '../ui/separator';

export const colorFields = [
  {
    label: 'Core theme colors',
    items: [
      {
        name: 'primary_color',
        label: 'Primary',
        inspector: 'colorPicker',
        tooltip: 'Main brand/action color',
      },
      {
        name: 'primary_contrast_color',
        label: 'Primary Contrast',
        inspector: 'colorPicker',
        tooltip: 'Text/icon color on primary',
      },
      {
        name: 'secondary_color',
        label: 'Secondary',
        inspector: 'colorPicker',
        tooltip: 'Supporting color',
      },
      {
        name: 'secondary_contrast_color',
        label: 'Secondary Contrast',  
        inspector: 'colorPicker',
        tooltip: 'Text/icon color on secondary',
      },
    ] as StyleItem[]
  },
  {
    label: 'Backgrounds and surfaces',
    items: [
      {
        name: 'canvas_color',
        label: 'Canvas',
        inspector: 'colorPicker',
        tooltip: 'Section background',
      },
      {
        name: 'primary_surface_color',
        label: 'Primary Surface',
        inspector: 'colorPicker',
        tooltip: 'Containers, cards, tables',
      },
      {
        name: 'secondary_surface_color',
        label: 'Secondary Surface',
        inspector: 'colorPicker',
        tooltip: 'Input fields',
      },
    ] as StyleItem[]
  },

  {
    label: 'Borders and dividers',
    items: [
      {
        name: 'primary_border_color',
        label: 'Primary Border',
        inspector: 'colorPicker',
        tooltip: 'Prominent borders & dividers',
      },
      {
        name: 'secondary_border_color',
        label: 'Secondary Border',
        inspector: 'colorPicker',
        tooltip: 'Subtle borders & dividers',
      },
    ] as StyleItem[]
  },

  {
    label: 'Status',
    items: [
      {
        name: 'warning_color',
        label: 'Warning',
        inspector: 'colorPicker',
        tooltip: 'Warning/alert color',
      },
      {
        name: 'success_color',
        label: 'Success',
        inspector: 'colorPicker',
        tooltip: 'Success/confirmation color',
      },
      {
        name: 'highlight_color',
        label: 'Highlight',
        inspector: 'colorPicker',
        tooltip: 'Badges, discounts, etc.',
      },
    ] as StyleItem[]
  },
];

export const getThemeColors = (theme?: Theme | null) => {
  return colorFields.reduce((acc, f) => {
    return {
      ...acc,
      ...f.items.reduce((acc, i) => {
        return {
          ...acc,
          [i.name]: {
            value: theme?.[i.name as keyof Theme] as string ?? '',
            label: i.label,
          }
        };
      }, {})
    };
  }, {});
};

export const fontFields = [
];

export const typographyFields = [
  {
    label: 'Font',
    items: [
      {
        name: 'main_font',
        label: 'Main Font',
        inspector: 'fontFamilyPicker',
        tooltip: 'Font for all your content',
        config: {
          hideVerticalAlignment: true,
          hideHorizontalAlignment: true,
        }
      },
      { name: 'mono_font',
        label: 'Mono Font',
        inspector: 'fontFamilyPicker',
        tooltip: 'Mono spaced font for code blocks etc',
        config: {
          hideVerticalAlignment: true,
          hideHorizontalAlignment: true,
        }
      },
    ]
  },
  {
    label: 'Parent typography',
    items: [
      {
        name: 'label_typography',
        label: 'Label',
        inspector: 'fontPicker',
        tooltip: 'Section header',
        config: {
          hideVerticalAlignment: true,
          hideHorizontalAlignment: true,
        }
      },
      {
        name: 'body_typography',
        label: 'Body',
        inspector: 'fontPicker',
        tooltip: 'Body/subtitle text',
        config: {
          hideVerticalAlignment: true,
          hideHorizontalAlignment: true,
        }
      },
    ]
  },
  {
    label: 'Markdown typography',
    items: [
      {
        name: 'h1_typography',
        label: 'Heading 1',
        inspector: 'fontPicker',
        tooltip: 'Available in markdown',
        config: {
          hideVerticalAlignment: true,
          hideHorizontalAlignment: true,
        }
      },
      {
        name: 'h2_typography',
        label: 'Heading 2',
        inspector: 'fontPicker',
        tooltip: 'Available in markdown',
        config: {
          hideVerticalAlignment: true,
          hideHorizontalAlignment: true,
        }
      },
      {
        name: 'h3_typography',
        label: 'Heading 3',
        inspector: 'fontPicker',
        tooltip: 'Available in markdown',
        config: {
          hideVerticalAlignment: true,
          hideHorizontalAlignment: true,
        }
      },
      {
        name: 'h4_typography',
        label: 'Heading 4',
        inspector: 'fontPicker',
        tooltip: 'Available in markdown',
        config: {
          hideVerticalAlignment: true,
          hideHorizontalAlignment: true,
        }
      },
      {
        name: 'h5_typography',
        label: 'Heading 5',
        inspector: 'fontPicker',
        tooltip: 'Available in markdown',
        config: {
          hideVerticalAlignment: true,
          hideHorizontalAlignment: true,
        }
      },
    ]
  },
];

export const componentFields = [
  {
    label: 'Borders',
    items: [
      {
        name: 'border_radius',
        label: 'Border Radius',
        inspector: 'borderRadiusPicker',
        tooltip: 'Component radius for rounded corners',
      },
    ]
  },
  {
    label: 'Shadows',
    items: [
      {
        name: 'shadow',
        label: 'Shadow',
        inspector: 'shadowPicker',
        tooltip: 'Drop shadows for containers, cards, etc.',
      },
    ]
  },
  {
    label: 'Others',
    items: [
      {
        name: 'padding',
        label: 'Padding',
        inspector: 'spacingPicker',
        tooltip: 'Padding for components',
        config: {
          hideTabs: true,
        }
      },
      {
        name: 'spacing',
        label: 'Spacing',
        inspector: 'spacingPicker',
        tooltip: 'Spacing between components',
        config: {
          hideTabs: true,
        }
      },
      {
        name: 'margin',
        label: 'Margin',
        inspector: 'spacingPicker',
        tooltip: 'Margin for components',
        config: {
          hideTabs: true,
        }
      },
    ]
  },
];

export const PageTheme: React.FC = () => {

  const { organizationThemes, globalThemes, data, setData, theme, setTheme, offer } = useEditor();
  const { fonts } = usePage<EditProps>().props;
  const [showThemeSelector, setShowThemeSelector] = useState(data?.theme_id === undefined);
  const [originalTheme, setOriginalTheme] = useState<Theme | null>(theme);

  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Update parent on local theme change
  const handleThemeChange = (key: keyof Theme, value: any) => {
    const updated = { ...theme, [key]: value };
    setTheme(updated as Theme);
  };

  const onThemeSelect = (selectedTheme: Theme) => {

    if(selectedTheme.id == data?.theme_id) {
      setShowThemeSelector(false);
      return;
    }

    setTheme(selectedTheme);
    setOriginalTheme(selectedTheme);
    setShowThemeSelector(false);

    router.put(route('offers.update', offer.id), {
      theme_id: selectedTheme.id,
    }, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        setData({ ...data, theme_id: selectedTheme.id });
      },
    });
  };

  // Filter themes by search
  const filteredThemes = [...organizationThemes, ...globalThemes].filter(t =>
    (t.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const isThemeChanged = JSON.stringify(theme) !== JSON.stringify(originalTheme);

  const handleSaveTheme = () => {
    setShowSaveDialog(false);
    setSaving(true);
    router.put(route('organizations.themes.update', theme?.id), theme as Record<string, any>, {
      onSuccess: () => {
        setSaving(false);
        setOriginalTheme(theme);
      },
      onError: () => setSaving(false),
    });
  };

  const fields = {
    'Colors': colorFields,
    'Typography': typographyFields,
    'Components': componentFields,
  }

  if(!showThemeSelector && theme?.id) {
    return (
      <div className="flex flex-col h-full p-4 w-full">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 justify-between w-full">
            <div className="flex items-center gap-4 ">
              <ChevronLeft className="size-6 cursor-pointer" onClick={() => setShowThemeSelector(true)} />
              <span className="text-xl font-bold">{theme?.name ?? 'Untitled Theme'}</span>
            </div>

            {isThemeChanged && (
              <Button
                variant="outline"
                size="sm"
                className="text-sm"
                onClick={() => setShowSaveDialog(true)}
                disabled={!isThemeChanged}
              >
                Save
              </Button>
            )}
          </div>

          {Object.entries(fields).map(([key, value]) => (
            <div key={key} className="flex flex-col gap-4">
              <Separator />
              <span className="text-lg font-bold">{key}</span>
              {value.map(f => {
                return (
                  <div
                    key={f.label}
                    className="flex flex-col gap-2"
                  >
                    <span className="text-base">{f.label}</span>
                    <StyleEditor
                      items={
                        f.items.map(i => ({
                          ...i,
                          value: theme?.[i.name as keyof Theme] as string ?? '',
                          config: i.config ?? {},
                        })) as StyleItem[]
                      }
                      onChange={(key, value) => handleThemeChange(key as keyof Theme, value)}
                      fonts={fonts}
                    />
                  </div>
                )
              })}
            </div>
          ))}

          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogContent className="!w-[400px]">
              <DialogHeader>
                <DialogTitle>Save Theme Changes</DialogTitle>
                <DialogDescription className="text-sm">
                  You've made changes to the theme. Clicking save will update this theme and other offers using this theme.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex items-center justify-end gap-2">
                <Button onClick={handleSaveTheme} className="w-full" disabled={saving}>
                  {saving ? 'Saving...' : 'Continue'}
                  {saving && <Loader2 className="ml-2 size-4 animate-spin" />}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 space-y-2 p-4">
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
          selected={t.id == data?.theme_id}
        />
      ))}
    </div>
  );
};

export default PageTheme;