import Numi, { Style } from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useMemo, useCallback, useRef } from "react";

function OptionSelectorComponent({ context }: { context: BlockContextType }) {
  const appearance = Numi.useStyle([
    Style.backgroundColor('activeBackgroundColor', 'Selected', {}, '#000000'),
    Style.backgroundColor('inactiveBackgroundColor', 'Unselected', {}, '#FFFFFF'),
  ]);

  const [items] = Numi.useStateJsonSchema({
    name: 'items',
    defaultValue: [{
      key: 'primary',
      label: 'Primary',
    }, {
      key: 'secondary',
      label: 'Secondary',
    }],
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

  const [selectedTab, setSelectedTab, updateSelectedTabHook] = Numi.useStateEnumeration({
    name: 'selectedTab',
    initialValue: items[0]?.key ?? undefined,
    options: Array.isArray(items) ? items?.filter((item) => item.key).map((item) => item.key) : [],
    inspector: 'select',
    label: 'Default (Selected Tab)',
  });

  const interactionElements = useMemo(() => {
    return Array.isArray(items) ? items.filter(item => item.key).map(item => ({ value: item.key, label: item.label })) : [];
  }, [items]);

  const { executeCallbacks } = Numi.useEventCallback({ name: 'onClick', elements: interactionElements });

  const handleTabChange = useCallback((value: string) => {
    setSelectedTab(value);
    executeCallbacks(value, 'onClick');
  }, [executeCallbacks]);

  useEffect(() => {
    executeCallbacks(selectedTab, 'onClick');
  }, []);

  const prevItemsRef = useRef(items);

  useEffect(() => {
    if (!Array.isArray(items) || items.length === 0) return;

    const itemKeys = items.filter(item => item.key).map(item => item.key);
    const prevItemKeys = prevItemsRef.current.filter(item => item.key).map(item => item.key);

    // Only update if the items have actually changed
    if (JSON.stringify(itemKeys) !== JSON.stringify(prevItemKeys)) {
      updateSelectedTabHook({ options: itemKeys });
      prevItemsRef.current = items;
    }
  }, [items, updateSelectedTabHook]);

  return (
    <div className="p-4">
      <Tabs defaultValue={selectedTab} onValueChange={handleTabChange} className="w-full">
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
