import Numi, { Appearance } from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import cx from "classnames";

function DetailListBlockComponent({ context }: { context: BlockContextType }) {

  const [items] = Numi.useStateJsonSchema({
    name: 'items',
    schema: {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "array",
      items: {
        type: "object",
        properties: {
          key: {
            type: "string",
            meta: { editor: "hidden" }
          },
          children: {
            type: "array",
            items: {
              $ref: "#"
            }
          },
          label: {
            title: "Label",
            type: "string"
          },
          caption: {
            title: "Caption",
            type: "string"
          },
          color: {
            title: "Color",
            type: "string",
            description: "A file upload input for selecting an image.",
            meta: { editor: "colorSelector" }
          },
          prefixImage: {
            title: "Image",
            type: "string",
            format: "uri",
            description: "A file upload input for selecting an image.",
            meta: { editor: "fileUpload" }
          },
          prefixIcon: {
            title: "Icon",
            type: "string",
            description: "Select an icon from a predefined list.",
            meta: { editor: "iconSelector" }
          },
          prefixText: {
            title: "Text",
            type: "string"
          },
          tooltip: {
            title: "Tooltip",
            type: "string"
          },
          disabled: {
            title: "Disabled",
            type: "boolean"
          },
          hidden: {
            title: "Hidden",
            type: "boolean"
          }
        },
        required: ["key"]
      }
    }
  });

    
  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}),
    Appearance.spacing('spacing', 'Spacing', {}),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  // Recursively render a detail list item and its children
  const renderDetailItem = (item: any, depth = 0) => {
    if (!item || item.hidden) return null;

    // Don't render if item is disabled and we're showing only enabled items
    // This could be a filter toggle in the future

    return (
      <div
        key={item.key}
        className={cx(
          // "border-l-2 pl-3 py-2 my-1",
          {
            "border-blue-300": item.color === 'blue',
            "border-green-300": item.color === 'green',
            "border-red-300": item.color === 'red',
            "border-yellow-300": item.color === 'yellow',
            "border-gray-300": !item.color || item.color === 'gray',
            "opacity-50": item.disabled
          }
        )}
        style={{ marginLeft: `${depth * 16}px` }}
      >
        <div className="flex items-center space-x-2">
          {/* Prefix elements */}
          {item.prefixImage && (
            <img
              src={item.prefixImage}
              alt=""
              className="h-6 w-6 object-cover rounded"
            />
          )}

          {item.prefixIcon && (
            <span className="text-gray-500">
              {/* This would be a real icon component in production */}
              {item.prefixIcon === 'star' && '★'}
              {item.prefixIcon === 'heart' && '❤️'}
              {item.prefixIcon === 'circle' && '●'}
              {item.prefixIcon === 'square' && '■'}
              {item.prefixIcon === 'triangle' && '▲'}
            </span>
          )}

          {item.prefixText && (
            <span className="text-gray-500 text-sm">{item.prefixText}</span>
          )}

          {/* Main content */}
          <div className="flex-1">
            <div className="flex items-center">
              <span className="font-medium">
                {item.label || `Item ${item.key}`}
              </span>

              {item.tooltip && (
                <div className="ml-1 text-gray-500 cursor-help" title={item.tooltip}>
                  ⓘ
                </div>
              )}
            </div>

            {item.caption && (
              <div className="text-sm text-gray-500">{item.caption}</div>
            )}
          </div>
        </div>

        {/* Recursively render children */}
        {item.children && item.children.length > 0 && (
          <div className="ml-4 mt-2 space-y-1">
            {item.children.map((child: any) => renderDetailItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const dataToRender = items && items.length > 0 ? items : [];

  return (
    <div className="border">
      {dataToRender && dataToRender.length > 0 && (
        <div className="space-y-1">
          {dataToRender.map((item: any) => renderDetailItem(item))}
        </div>
      )}

      {(!dataToRender || dataToRender.length === 0) && (
        <div className="text-xs text-gray-500 mt-2 p-1 bg-gray-50 rounded">
          Note: Showing sample data. Edit in the JSONSchema editor to customize.
        </div>
      )}
    </div>
  );
}

export default DetailListBlockComponent;
