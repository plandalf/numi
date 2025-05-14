import { useEditor } from "@/contexts/offer/editor-context";
import { ColorPickerEditor } from "../editor/color-picker-editor";
import { getThemeColors } from "./page-theme";
import { StyleEditor, type StyleItem } from "../editor/style-editor";
import { Style } from "@/contexts/Numi";

interface SectionInspectorProps {
  sectionId: string;
  onClose: () => void;
}

export function SectionInspector({ sectionId, onClose }: SectionInspectorProps) {
  const { data, selectedPage, updateSection } = useEditor();
  const page = data.view.pages[selectedPage];
  const section = page.view[sectionId];

  if (!section) return null;
  const themeColors = getThemeColors(data.theme);

  const handleStyleChange = (key: string, value: string | boolean) => {
    updateSection(sectionId, {
      ...section,
      style: {
        ...section.style,
        [key]: value
      }
    });
  };

  const handleStyleDelete = (key: string) => {
    const newStyle = { ...section.style };
    delete newStyle[key];
    updateSection(sectionId, {
      ...section,
      style: newStyle
    });
  };

  const styleItems: StyleItem[] = [
    Style.backgroundColor('Background Color', 'backgroundColor', {}, '#FFFFFF'),
  ].map(style => ({
    name: style.type,
    label: style.label,
    value: section.style?.[style.type],
    defaultValue: style.defaultValue,
    inspector: style.inspector as StyleItem['inspector'],
    options: style.options
  }));

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          <div className="space-y-2">
            <StyleEditor
              items={styleItems}
              onChange={handleStyleChange}
              onDelete={handleStyleDelete}
              themeColors={themeColors}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 