// Numi hooks

import { BlockConfig, BlockContextType, HookUsage } from "@/types/blocks";
import { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from "react";
import get from "lodash/get";
import debounce from "lodash/debounce";
import { Theme } from "@/types/theme";
import { CheckoutState, GlobalStateContext } from '@/pages/checkout-main';

export const BlockContext = createContext<BlockContextType>({
  blockId: '',
  blockConfig: {} as BlockConfig,
  globalState: {
    fieldStates: {},
    updateFieldState: () => { },
    getFieldState: () => undefined,
    registerHook: () => { },
    hookUsage: {}
  },


  registerField: () => { },
  getFieldValue: () => undefined,
  setFieldValue: () => { },
  registerHook: () => { },
  theme: undefined
});



// adding an item
function TestComponent() {

  // modifying:

  const {
    addItem// checkout.items.add ->
  } = Numi.useCheckout();
  // returns some kind of modification promise?
  // setModifying(addItem().then(() => {
  // setModifying(null)
  // }))

  // need "loading" state for adding an item
  // need validation
  // need errors

  return (
    <div>
      <button onClick={() => addItem({
        name: 'Test Item',
        price: 100,
        quantity: 1,
        image: 'https://placehold.co/60x60.png',
      })}>Add Item</button>
    </div>
  )
}

export interface StyleArgs {
  options?: Record<string, string>;
  config?: Record<string, any>;
  inspector?: string;
}

export interface FontValue {
  font?: string;
  weight?: string;
  size?: string;
  lineHeight?: string;
  letterSpacing?: string;
  alignmentHorizontal?: string;
  alignmentVertical?: string;
}

export interface DimensionValue {
  width?: string;
  height?: string;
}

export interface BorderValue {
  width?: string;
  style?: string;
}

export const Style = {
  alignment: (
    type: string = 'alignment',
    label: string = 'Alignment',
    args: StyleArgs,
    defaultValue: string = 'left',
  ) => ({
    label,
    type,
    options: args.options ?? {
      left: 'Left',
      center: 'Center',
      right: 'Right',
      expand: 'Expand',
    } as Record<string, string>,
    defaultValue,
    inspector: args.inspector ?? 'alignmentPicker',
  }),

  backgroundColor: (
    type: "backgroundColor" | "activeBackgroundColor" | "inactiveBackgroundColor" = "backgroundColor",
    label: string = 'Background Color',
    args: StyleArgs,
    defaultValue: string,
  ) => ({
    label,
    type,
    options: args.options,
    defaultValue,
    inspector: args.inspector ?? 'colorPicker',
  }),
  textColor: (
    type: string = 'textColor',
    label: string = 'Text Color',
    args: StyleArgs,
    defaultValue: string,
  ) => ({
    label,
    type,
    options: [],
    defaultValue,
    inspector: args.inspector ?? 'colorPicker',
  }),

  dimensions: (
    type: string = 'dimensions',
    label: string = 'Dimensions',
    args: StyleArgs,
    defaultValue: DimensionValue,
  ) => ({
    label,
    type,
    options: [],
    defaultValue,
    inspector: args.inspector ?? 'dimensionPicker',
    config: args.config ?? {}
  }),

  font: (
    type: string = 'font',
    label: string = 'Font',
    args: StyleArgs,
    defaultValue: FontValue,
  ) => ({
    label,
    type,
    options: [],
    defaultValue,
    inspector: args.inspector ?? 'fontPicker',
    config: args.config ?? {}
  }),


  border: (
    type: string = 'border',
    label: string = 'Border',
    args: StyleArgs,
    defaultValue: BorderValue,
  ) => ({
    label,
    type,
    options: [],
    defaultValue,
    inspector: args.inspector ?? 'borderPicker',
  }),

  borderRadius: (
    type: string = 'borderRadius',
    label: string = 'Border Radius',
    args: StyleArgs,
    defaultValue: string = '1px',
  ) => ({
    label,
    type,
    options: [],
    defaultValue,
    inspector: args.inspector ?? 'borderRadiusPicker',
  }),

  borderColor: (
    type: string = 'borderColor',
    label: string = 'Border Color',
    args: StyleArgs,
    defaultValue: string = '#FFFFFF',
  ) => ({
    label,
    type,
    options: [],
    defaultValue,
    inspector: args.inspector ?? 'colorPicker',
  }),

  shadow: (
    type: string = 'shadow',
    label: string = 'Shadow',
    args: StyleArgs,
    defaultValue: string = '0px 0px 0px 0px #000000',
  ) => ({
    label,
    type,
    options: [],
    defaultValue,
    inspector: args.inspector ?? 'shadowPicker',
  }),
  
  hidden: (
    type: string = 'hidden',
    label: string = 'Hidden',
    args: StyleArgs,
    defaultValue: boolean = false,
  ) => ({
    label,
    type,
    options: [],
    defaultValue,
    inspector: args.inspector ?? 'checkbox',
  }),
  visibility: (
    type: string = 'visibility',
    label: string = 'Visibility',
    args: StyleArgs,
    defaultValue: {
      conditional: []
    }
  ) => ({
    label,
    type,
    options: [],
    defaultValue,
    inspector: args.inspector ?? 'visibility',
  }),
}

export const Conditions = {
  onClickEvent: () => ({
    type: 'onClickEvent',
  }),

  visibility: () => ({
    type: 'visibility',
  }),
}


// Add these interfaces before the Numi class
interface CheckoutOptions {
  initialState?: {
    items?: Array<{
      name: string;
      price: number;
      quantity: number;
      image: string;
    }>;
  };
}

class CheckoutSDK {
  private items: Array<{
    name: string;
    price: number;
    quantity: number;
    image: string;
  }> = [];

  constructor(options: CheckoutOptions = {}) {
    if (options.initialState?.items) {
      this.items = [...options.initialState.items];
    }
  }

  addItem(item: {
    name: string;
    price: number;
    quantity: number;
    image: string;
  }) {
    this.items.push(item);
  }
}

class Numi {

  // get static checkout ?
  // static useCheckout(options: CheckoutOptions = {}): CheckoutSDK {
  //   const [checkout] = useState(() => {
  //     // Create a checkout instance with provided options
  //     const instance = new CheckoutSDK(options);

  //     return instance;
  //   });

  //   return checkout;
  // }

  static useEventCallback(props: { name: string; }) {
    const blockContext = useContext(BlockContext);

    useEffect(() => {
      blockContext.registerHook({
        name: props.name,
        type: 'eventCallback',
        defaultValue: null,
      });
    }, []);

    // allow calling something event is called
    // const checkout = Numi.useCheckout();

    return () => {
      // "on click happened, basically"
      // run the actions set up for this block
      if (blockContext.blockConfig.interaction?.onClick) {
        for (const callback of blockContext.blockConfig.interaction.onClick) {
          // this will only be a "named" action
          switch (callback.action) {
            case 'setSlot':
              // checkout.setSlot(callback.slot, callback.price); // todo: other options too?!
              break;
            case 'setField':
              blockContext.setFieldValue(callback.field, callback.value);
              break;
          }
          // action();//
        }
      }
      // Hook was called!
    };
  }

  static useStateJsonSchema(props: { name: string; schema: { $schema: string; type: string; items: { type: string; properties: { key: { title: string; type: string; }; value: { title: string; type: string; }; children: { type: string; items: { type: string; properties: { key: { type: string; }; label: { type: string; }; caption: { type: string; }; color: { type: string; }; prefixImage: { type: string; format: string; description: string; meta: { editor: string; }; }; prefixIcon: { type: string; description: string; meta: { editor: string; }; }; prefixText: { type: string; }; tooltip: { type: string; }; disabled: { type: string; }; hidden: { type: string; }; }; required: string[]; }; }; }; required: string[]; }; }}): Array<any> {

    const blockContext = useContext(BlockContext);

    useEffect(() => {
      blockContext.registerHook({
        name: props.name,
        type: 'jsonSchema',
        schema: props.schema,
        defaultValue: {}
      });
    }, []);

    // options list data must match
    const data = get(blockContext.blockConfig, `content.${props.name}`, {});

    // return options
    return [data];
  }

  static useCheckout(options: CheckoutOptions = {}): CheckoutState {
    const {
      session
    } = useContext(GlobalStateContext);

    // useEffect(() => {
    //   // Cleanup function
    //   return () => {
    //     // Any cleanup needed
    //   };
    // }, []);

    return {
      session,
    };
  }

  static useStyle(appearanceProps: any[]): Record<string, any> {
    const blockContext = useContext(BlockContext);

    return useMemo(() => {
      const appearance: Record<string, any> = {};
      
      // Register each appearance property
      appearanceProps.forEach(prop => {
        if (prop.type) {
          // Get the value from block config or use default
          appearance[prop.type] = blockContext.blockConfig.appearance?.[prop.type];

          // Register the hook
          blockContext.registerHook({
            name: prop.type,
            type: 'appearance',
            defaultValue: prop.defaultValue,
            options: prop.options,
            inspector: prop.inspector,
            label: prop.label || prop.type.charAt(0).toUpperCase() + prop.type.slice(1),
            config: prop.config ?? {}
          });
        }
      });

      return appearance;
    }, [blockContext.blockConfig.appearance, blockContext.blockId]);
  }

  static useInteraction(): { isDisabled: any; } {
    const blockContext = useContext(BlockContext);

    useEffect(() => {
      // blockContext.registerHook('interaction', {
      //   // args?
      // });
      blockContext.registerHook({
        type: 'interaction',
      });
    }, []);

    return {
      isDisabled: blockContext.blockConfig.interaction?.isDisabled ?? false,
    }
  }

  static useStateEnumeration(props: {
    name: string;
    initialValue?: string;
    options: string[];
    labels?: Record<string, string>;
    inspector: string;
    label: string;
    icons?: Record<string, React.ReactNode>;
  }): [any, (newValue: any) => void, (hook: Partial<HookUsage>) => void] {
    const blockContext = useContext(BlockContext);
    const [hook, setHook] = useState<HookUsage>({
      name: props.name,
      type: 'enumeration',
      defaultValue: props.initialValue,
      options: props.options,
      labels: props.labels,
      icons: props.icons,
      inspector: props.inspector,
      label: props.label,
    });

    // Create a ref to hold the debounced function
    const debouncedUpdateRef = useRef<ReturnType<typeof debounce> | null>(null);

    // Initialize the debounced function on first render
    useEffect(() => {
      debouncedUpdateRef.current = debounce((newHook: Partial<HookUsage>) => {
        setHook(prevHook => ({...prevHook, ...newHook}));
      }, 300); // 300ms delay

      // Cleanup function to cancel pending debounced calls
      return () => {
        if (debouncedUpdateRef.current) {
          debouncedUpdateRef.current.cancel();
        }
      };
    }, []);

    useEffect(() => {
      blockContext.registerHook(hook);
    }, [hook]);

    const value = get(blockContext.blockConfig, `content.${props.name}`) ?? props.initialValue;
    const setValue = (newValue: any) => {
      blockContext.setFieldValue(props.name, newValue);
    };

    const updateHook = useCallback((newHook: Partial<HookUsage>) => {
      if (debouncedUpdateRef.current) {
        debouncedUpdateRef.current(newHook);
      }
    }, []);

    return [value, setValue, updateHook];
  }

  static useStateBoolean(props: { name: string; defaultValue: boolean; label?: string; inspector?: string }): [boolean, (value: boolean) => void] {
    const blockContext = useContext(BlockContext);

    useEffect(() => {
      blockContext.registerHook({
        name: props.name,
        type: 'boolean',
        defaultValue: props.defaultValue,
        inspector: props.inspector ?? 'checkbox',
        label: props.label,
      });

      const existingState = blockContext.globalState.getFieldState(
        blockContext.blockId,
        props.name
      );

      if (!existingState) {
        // Use block config value as initial value if it exists
        const initialValue = blockContext.blockConfig.content[props.name] ?? props.defaultValue;
        blockContext.globalState.updateFieldState(
          blockContext.blockId,
          props.name,
          initialValue
        );
      }
    }, [blockContext.blockId, props.name]);

    // For editor-editable values (checkbox inspector), prioritize block config
    // Otherwise, use field state for runtime values
    const value = props.inspector === 'checkbox'
      ? blockContext.blockConfig.content[props.name] ?? blockContext.getFieldValue(props.name) ?? props.defaultValue
      : blockContext.getFieldValue(props.name) ?? blockContext.blockConfig.content[props.name] ?? props.defaultValue;

    const setValue = (newValue: boolean) => {
      blockContext.setFieldValue(props.name, newValue);
    };

    return [value, setValue];
  }

  static useStateString(props: { name: string; defaultValue: string; inspector?: string, format?: string }): [string, (value: string) => void, string] {
    const blockContext = useContext(BlockContext);


    useEffect(() => {
      blockContext.registerHook({
        name: props.name,
        type: 'string',
        defaultValue: props.defaultValue,
        inspector: props.inspector ?? 'text',
      });

      const existingState = blockContext.globalState.getFieldState(
        blockContext.blockId,
        props.name
      );

      if (!existingState) {
        // Use block config value as initial value if it exists
        const initialValue = blockContext.blockConfig.content[props.name] ?? props.defaultValue;
        blockContext.globalState.updateFieldState(
          blockContext.blockId,
          props.name,
          initialValue
        );
      }
    }, [blockContext.blockId, props.name]);

    // For editor-editable values (not hidden), prioritize block config
    // For runtime-editable values (hidden), prioritize field state
    const value = props.inspector !== 'hidden'
      ? get(blockContext.blockConfig, `content.${props.name}`) ?? blockContext.getFieldValue(props.name) ?? props.defaultValue
      : blockContext.getFieldValue(props.name) ?? get(blockContext.blockConfig, `content.${props.name}`) ?? props.defaultValue;
    const format = get(blockContext.blockConfig, `content.format`) ?? props.format ?? 'plain';

    const setValue = (newValue: string) => {
      blockContext.setFieldValue(props.name, newValue);
    };

    return [value, setValue, format];
  }

  static useStateNumber(props: {
    name: string;
    defaultValue: number;
    min?: number;
    max?: number;
    label?: string;
    inspector?: string;
  }): [number, (value: number) => void] {
    const blockContext = useContext(BlockContext);

    useEffect(() => {
      blockContext.registerHook({
        name: props.name,
        type: 'number',
        defaultValue: props.defaultValue,
        min: props.min,
        max: props.max,
        inspector: props.inspector ?? 'slider',
        label: props.label,
      });

      const existingState = blockContext.globalState.getFieldState(
        blockContext.blockId,
        props.name
      );

      if (!existingState) {
        // Use block config value as initial value if it exists
        const initialValue = blockContext.blockConfig.content[props.name] ?? props.defaultValue;
        blockContext.globalState.updateFieldState(
          blockContext.blockId,
          props.name,
          initialValue
        );
      }
    }, [blockContext.blockId, props.name]);

    // For editor-editable values (not hidden), prioritize block config
    // For runtime-editable values (hidden), prioritize field state
    const value = props.inspector !== 'hidden'
      ? Number(get(blockContext.blockConfig, `content.${props.name}`)) ?? Number(blockContext.getFieldValue(props.name)) ?? props.defaultValue
      : Number(blockContext.getFieldValue(props.name)) ?? Number(get(blockContext.blockConfig, `content.${props.name}`)) ?? props.defaultValue;

    const setValue = (newValue: number) => {
      blockContext.setFieldValue(props.name, newValue);
    };

    return [value, setValue];
  }

  static useRuntimeString(props: { name: string; defaultValue: string }): [string, (value: string) => void] {
    const blockContext = useContext(BlockContext);

    const value = props.name in blockContext.blockConfig.content
      ? blockContext.blockConfig.content[props.name]
      : blockContext.getFieldValue(props.name) ?? props.defaultValue;

    const setValue = (newValue: string) => {
      blockContext.setFieldValue(props.name, newValue);
    };

    return [value, setValue];
  }

  static useValidation(props: { rules: Record<string, any> }): {
    isValid: boolean;
    errors: string[];
    validate: (value: any) => boolean;
  } {
    const blockContext = useContext(BlockContext);
    const [isValid, setIsValid] = useState(true);
    const [errors, setErrors] = useState<string[]>([]);

    useEffect(() => {
      blockContext.registerHook({
        type: 'validation',
        rules: props.rules,
      });
    }, []);

    const validate = (value: any) => {
      const newErrors: string[] = [];

      // Check required validation
      if (props.rules.isRequired && (!value || value === '')) {
        newErrors.push('This field is required');
      }

      setErrors(newErrors);
      setIsValid(newErrors.length === 0);
      return newErrors.length === 0;
    };

    return {
      isValid,
      errors,
      validate,
      isRequired: blockContext.blockConfig.validation?.isRequired ?? false
    };
  }

  static useTheme(): Theme | undefined {
    const blockContext = useContext(BlockContext);
    return blockContext.theme;
  }
}

const NumiEditorContext = createContext<{
  blocks: BlockConfig[];
  selectedBlock: BlockConfig | null;
  setSelectedBlock: (block: BlockConfig | null) => void;
  updateBlock: (updatedBlock: BlockConfig) => void;
}>({
  blocks: [],
  selectedBlock: null,
  setSelectedBlock: () => { },
  updateBlock: () => { },
});

export default Numi;
