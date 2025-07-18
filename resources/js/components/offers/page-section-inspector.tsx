import { useEditor } from "@/contexts/offer/editor-context";
import { getThemeColors } from "./page-theme";
import { StyleEditor, type StyleItem } from "../editor/style-editor";
import Numi, { Appearance, Style } from '@/contexts/Numi';
import { SpacingEditor } from "../editor/spacing-editor";
import { resolveThemeValue } from "@/lib/theme";
import { Theme } from "@/types/theme";

interface SectionInspectorProps {
  sectionId: string;
  onClose?: () => void;
}

export function SectionInspector({ sectionId /*, onClose */ }: SectionInspectorProps) {
  const { data, selectedPage, updateSection, theme } = useEditor();
  const page = data.view.pages[selectedPage];
  const section = page.view[sectionId];

  if (!section) return null;
  const themeColors = getThemeColors(theme);

  const handleStyleChange = (key: string, value: string | boolean) => {
    updateSection(sectionId, {
      ...section,
      style: {
        ...section.style,
        [key]: value
      }
    });
  };

  const handleAppearanceChange = (key: string, value: string | null) => {
    updateSection(sectionId, {
      ...section,
      appearance: {
        ...section.appearance,
        [key]: value
      }
    });
  }

  const handleStyleDelete = (key: string) => {
    const newStyle = { ...section.style };
    delete newStyle[key];
    updateSection(sectionId, {
      ...section,
      style: newStyle
    });
  };

  const styleItems: StyleItem[] = [
    Style.alignment('alignment', 'Alignment', {
      options: {
        start: 'Start',
        center: 'Center',
        end: 'End',
      },
      config: {
        orientation: 'horizontal'
      }
    }, 'start'),
    Style.image('backgroundImage', 'Background Image', {}, ''),
    Style.backgroundColor('backgroundColor', 'Background Color', {}, theme?.canvas_color),
    Style.borderRadius('borderRadius', 'Border Radius', {}, '12px'),
    Style.hidden('hidden', 'Hidden', {}, false),
  ].map(style => ({
    name: style.type,
    label: style.label,
    value: section.style?.[style.type],
    defaultValue: style.defaultValue,
    inspector: style.inspector as StyleItem['inspector'],
    options: style.options,
    config: style.config
  }));


  const appearanceItems = [
    Appearance.padding('padding', 'Padding', {}, '0px'),
    Appearance.margin('margin', 'Margin', {}),
    Appearance.spacing('spacing', 'Spacing', { config: { format: 'single' } }),
  ].map(appearance => ({
    name: appearance.type,
    label: appearance.label,
    value: section.appearance?.[appearance.type],
    defaultValue: appearance.defaultValue,
    inspector: appearance.inspector,
    options: appearance.options
  }));

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-2 mb-6 overflow-y-auto p-4">
        <h3 className="font-semibold">Appearance</h3>
          {appearanceItems.map((item) => (
            (item.inspector === 'spacingPicker' ?(
              <SpacingEditor
                key={item.name}
                label={item.label}
                value={section.appearance?.[item.name]}
                defaultValue={item.defaultValue}
                onChangeProperty={(newValue) => handleAppearanceChange(item.name, newValue)}
                config={{
                  hideTabs: true
                }}
              />
              ) : null
            )
        ))}

        <h3 className="font-semibold">Styles</h3>
        {/*<Label className="text-sm">Styles</Label>*/}
          <StyleEditor
            items={styleItems}
            onChange={handleStyleChange}
            onDelete={handleStyleDelete}
            themeColors={themeColors}
          />
        </div>
    </div>
  );
}



