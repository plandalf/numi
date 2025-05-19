import Numi, { Style, BlockContext, Appearance } from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useContext, useEffect, useMemo, useRef, useCallback } from "react";
import { get } from "lodash";
import { useEditor } from "@/contexts/offer/editor-context";
import { useDebounce } from "@/hooks/use-debounce";
import { useCheckoutState } from "@/pages/checkout-main";
// Define interfaces for the item structure
interface ItemType {
  key: string;
  label?: string;
}

function OptionSelectorComponent({ context }: { context: BlockContextType }) {

  const blockContext = useContext(BlockContext);
  const options = get(blockContext.blockConfig, `content.items`, {}) as ItemType[];

  const [selectedTab, setSelectedTab, updateSelectedTabHook] = Numi.useStateEnumeration({
    name: 'selectedTab',
    initialValue: options[0]?.key ?? undefined,
    options: Array.isArray(options) ? options?.filter((item) => item.key).map((item) => item.key) : [],
    inspector: 'select',
    label: 'Default (Selected Tab)',
  });
    
  const appearance = Numi.useAppearance([
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);
  
  const style = Numi.useStyle([
    Style.backgroundColor('activeBackgroundColor', 'Selected', {}, '#000000'),
    Style.backgroundColor('inactiveBackgroundColor', 'Unselected', {}, '#FFFFFF'),
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

  const interactionElements = useMemo(() => {
    return Array.isArray(items) ? items.filter(item => item.key).map(item => ({ value: item.key, label: item.label })) : [];
  }, [items]);

  const { callbacks: onClicks, updateHook: updateInteractionHook, executeCallbacks } = Numi.useEventCallback({ name: 'onClick', elements: interactionElements });

  const debouncedUpdate = useCallback(
    (items: ItemType[], currentInteraction: any) => {
      if (!Array.isArray(items) || items.length === 0) return;

      const itemKeys = items.filter(item => item.key).map(item => item.key);
      updateSelectedTabHook({ options: itemKeys });

      // Update the event elements options
      updateInteractionHook({
        options: items
          .filter(item => item.key)
          .map(item => ({
            value: item.key as string,
            label: item.label || item.key as string
          }))
      });

      // // Get existing onClick actions and filter out null actions
      // const existingOnClick = (currentInteraction?.onClick || [])
      //   .filter((action: { element: string; action: string; value: string } | null) => action)
      //   // Filter out actions whose elements don't exist in current items
      //   .filter((action: { element: string; action: string; value: string }) =>
      //     itemKeys.includes(action.element)
      //   );

      // // Create a map of existing actions by element
      // const existingActionsMap = new Map(
      //   existingOnClick.map((action: { element: string; action: string; value: string }) => [action.element, action])
      // );

      // // Create new actions for items that don't have them
      // const newActions = items
      //   .filter(item => item.key && !existingActionsMap.has(item.key))
      //   .map(item => ({ element: item.key, action: 'setItem', value: '' }));

      // // Combine existing and new actions
      // const updatedOnClick = [...existingOnClick, ...newActions];

      // const newInteraction = {
      //   onClick: updatedOnClick
      // };

      // console.log("newInteraction", newInteraction, JSON.stringify(newInteraction) !== JSON.stringify(currentInteraction));

      // if (JSON.stringify(newInteraction) !== JSON.stringify(currentInteraction)) {
      //   updateEventCallbackHook(newInteraction);
      // }
    },
    [updateSelectedTabHook, updateInteractionHook, blockContext.blockConfig]
  );

  /** @todo automatically create interaction elements based on number of tabs(items) */
  const debouncedItems = useDebounce(items, 300);
  const debouncedInteraction = useDebounce(blockContext.blockConfig.interaction, 300);
  useEffect(() => {
    debouncedUpdate(debouncedItems, debouncedInteraction);
  }, [debouncedItems, debouncedInteraction, debouncedUpdate]);

  const handleTabChange = useCallback((value: string) => {
    setSelectedTab(value);
    executeCallbacks(value, 'onClick');
  }, [executeCallbacks]);

  useEffect(() => {
    executeCallbacks(selectedTab, 'onClick');
  }, []);

  return (
    <div className="p-4">
      <Tabs defaultValue={selectedTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-2 h-auto p-0 w-full">
          {Array.isArray(items) && items.map((item) => (
            <TabsTrigger key={item.key} value={item.key} className="w-full h-10" style={{ backgroundColor: item.key === selectedTab ? style.activeBackgroundColor : style.inactiveBackgroundColor }}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}

export default OptionSelectorComponent;
