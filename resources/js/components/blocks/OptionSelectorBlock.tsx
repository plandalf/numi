import Numi, { Appearance } from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEffect, useRef } from "react";

function OptionSelectorComponent({ context }: { context: BlockContextType }) {
  const appearance = Numi.useAppearance([
    Appearance.backgroundColor('activeBackgroundColor', 'Selected'),
    Appearance.backgroundColor('inactiveBackgroundColor', 'Unselected'),
  ]);

  const [items] = Numi.useStateJsonSchema({
    name: 'items',
    schema: {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "array",
      items: {
        type: "object",
        properties: {
          key: {
            title: "Key",
            type: "string",
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
          appearance: {
            meta: { editor: "appearanceEditor" },
            visibility: {
              meta: { editor: "visibilityEditor" },
              conditional: {
                rules: [],
                action: 'show'
              }
            }
          }
        },
        required: ["key"]
      }
    }
  });

  const prevItemsKeyRef = useRef("");
  const [selectedTab, setSelectedTab, updateHook] = Numi.useStateEnumeration({
    name: 'selectedTab',
    initialValue: items[0]?.key ?? undefined,
    options: Array.isArray(items) ? items?.map((item) => item.key) : [],
    inspector: 'hidden',
    label: 'Selected Tab',
  });

  // fix circular dependency
  useEffect(() => {
    if (!Array.isArray(items) || items.length === 0) return;

    const itemsKeyString = items.map(item => item.key).join(',');

    if (prevItemsKeyRef.current !== itemsKeyString) {
      prevItemsKeyRef.current = itemsKeyString;

      const itemKeys = items.map(item => item.key);
      updateHook({ options: itemKeys });

      setSelectedTab(itemKeys[0]);
    }
  }, [items]);

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
