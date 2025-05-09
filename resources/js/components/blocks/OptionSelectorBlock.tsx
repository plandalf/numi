import Numi, { Appearance, BlockContext } from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useContext, useEffect, useRef } from "react";
import { get } from "lodash";

// Define interfaces for the item structure
interface ItemType {
  key: string;
  label?: string;
}

function OptionSelectorComponent({ context }: { context: BlockContextType }) {
  const blockContext = useContext(BlockContext);
  const options = get(blockContext.blockConfig, `content.items`, {}) as ItemType[];

  const [selectedTab, setSelectedTab, updateHook] = Numi.useStateEnumeration({
    name: 'selectedTab',
    initialValue: options[0]?.key ?? undefined,
    options: Array.isArray(options) ? options?.filter((item) => item.key).map((item) => item.key) : [],
    inspector: 'select',
    label: 'Default (Selected Tab)',
  });


  const [items] = Numi.useStateJsonSchema({
    name: 'items',
    schema: {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "array",
      items: {
        type: "object",
        properties: {
          key: {
            title: "Value",
            type: "string",
          },
          children: {
            type: "array",
            items: {
              type: "object"
            }
          },
          label: {
            title: "Label",
            type: "string"
          }
        },
        required: ["key"]
      }
    }
  });

  const appearance = Numi.useAppearance([
    Appearance.backgroundColor('activeBackgroundColor', 'Selected'),
    Appearance.backgroundColor('inactiveBackgroundColor', 'Unselected'),
    Appearance.visibility(),
  ]);

  useEffect(() => {
    if (!Array.isArray(items) || items.length === 0) return;

    const itemKeys = items.filter(item => item.key).map(item => item.key);
    updateHook({ options: itemKeys });

  }, [options]);

  const { isDisabled } = Numi.useInteraction();

  return (
    <div className="p-4">
      <Tabs defaultValue={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="mb-2 h-auto p-0 w-full">
          {Array.isArray(items) && items.map((item) => (
            <TabsTrigger key={item.key} value={item.key} className="w-full h-10" style={{ backgroundColor: item.key === selectedTab ? appearance.activeBackgroundColor : appearance.inactiveBackgroundColor }}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}

export default OptionSelectorComponent;
