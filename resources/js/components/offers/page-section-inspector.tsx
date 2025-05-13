import { useEditor } from "@/contexts/offer/editor-context";
import { ColorPickerEditor } from "../editor/color-picker-editor";
import { getThemeColors } from "./page-theme";

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

  const handleBackgroundColorChange = (color: string) => {
    updateSection(sectionId, {
      ...section,
      style: {
        ...section.style,
        backgroundColor: color
      }
    });
  };

  return (
    <div className="flex flex-col h-full">

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          <div className="space-y-2">
            <ColorPickerEditor
              value={section.style?.backgroundColor ?? '#FFFFFF'}
              onChange={handleBackgroundColorChange}
              themeColors={themeColors}
              label="Background Color"
              type="advanced"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 