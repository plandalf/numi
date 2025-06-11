// Numi hooks

import { BlockConfig, BlockContextType, HookUsage } from "@/types/blocks";
import { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from "react";
import get from "lodash/get";
import debounce from "lodash/debounce";
import { Theme } from "@/types/theme";
import { CheckoutState, GlobalStateContext } from '@/pages/checkout-main';
import { CallbackType, Event } from "@/components/editor/interaction-event-editor";
import { resolveThemeValue } from "@/lib/theme";

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

export interface HookArgs {
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
  color?: string;
}

export interface DimensionValue {
  width?: string;
  height?: string;
}

export interface BorderValue {
  width?: string;
  style?: string;
}

export interface JSONSchemaValue {
  $schema: string;
  type: string;
  items?: {
    type: string;
    properties: {
      key: { title: string; type: string; };
      value: { title: string; type: string; };
      children: {
        type: string;
        items: {
          type: string;
          properties: {
            key: { type: string; };
            label: { type: string; };
            caption: { type: string; };
            color: { type: string; };
            prefixImage: {
              type: string;
              format: string;
              description: string;
              meta: { editor: string; };
            };
            prefixIcon: {
              type: string;
              description: string;
              meta: { editor: string; };
            };
            prefixText: { type: string; };
            tooltip: { type: string; };
            disabled: { type: string; };
            hidden: { type: string; };
          };
          required: string[];
        };
      };
    };
    required: string[];
  };
  meta?: { editor: string; };
  properties?: Record<string, any>;
  required?: string[];
};

export interface IconValue {
  icon?: string | null;
  emoji?: string | null;
  url?: string | null;
}

export type SpacingValue = 'default' | null | string;

export const Appearance = {
  padding: (
    type: string = 'padding',
    label: string = 'Padding',
    args: HookArgs,
    defaultValue: SpacingValue = '',
  ) => ({
    type,
    label,
    defaultValue,
    inspector: args?.inspector ?? 'spacingPicker',
    options: args?.options ?? {},
    config: args?.config ?? {},
  }),

  margin: (
    type: string = 'margin',
    label: string = 'Margin',
    args: HookArgs,
    defaultValue: SpacingValue = '',
  ) => ({
    type,
    label,
    defaultValue,
    inspector: args?.inspector ?? 'spacingPicker',
    options: args?.options ?? {},
    config: args?.config ?? {},
  }),

  spacing: (
    type: string = 'spacing',
    label: string = 'Spacing',
    args: HookArgs,
    defaultValue: SpacingValue = '',
  ) => ({
    type,
    label,
    defaultValue,
    inspector: args?.inspector ?? 'spacingPicker',
    options: args?.options ?? {},
    config: args?.config ?? {},
  }),

  visibility: (
    type: string = 'visibility',
    label: string = 'Visibility',
    args: HookArgs,
    defaultValue?: any,
  ) => ({
    label,
    type,
    options: [],
    defaultValue,
    inspector: args?.inspector ?? 'visibilityPicker',
    config: args?.config ?? {}
  }),

  alignment: (
    type: string = 'alignment',
    label: string = 'Alignment',
    args: HookArgs,
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
}

export const Style = {
  alignment: (
    type: string = 'alignment',
    label: string = 'Alignment',
    args: HookArgs,
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
    config: args.config ?? {},
  }),

  image: (
    type: "image" | "backgroundImage" =  "image",
    label: string = 'Image',
    args: HookArgs,
    defaultValue: string | null = null,
  ) => ({
    label,
    type,
    options: args.options,
    defaultValue,
    inspector: args.inspector ?? 'imagePicker',
  }),

  backgroundColor: (
    type:
      "backgroundColor"
      | "dividerColor"
      | "iconColor"
      | "imageBackgroundColor"
      | "badgeBackgroundColor"
      | "errorBackgroundColor"
      | "warningBackgroundColor"
      | "inputBackgroundColor"
      | "buttonBackgroundColor"
      | "activeBackgroundColor"
      | "inactiveBackgroundColor"
      | "checkboxActiveBackgroundColor"
      | "checkboxInactiveBackgroundColor" = "backgroundColor",
    label: string = 'Background Color',
    args: HookArgs,
    defaultValue: string | null = null,
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
    args: HookArgs,
    defaultValue: string | null = null,
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
    args: HookArgs,
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
    args: HookArgs,
    defaultValue?: FontValue,
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
    args: HookArgs,
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
    args: HookArgs,
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
    args: HookArgs,
    defaultValue: string = '',
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
    args: HookArgs,
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
    args: HookArgs,
    defaultValue: boolean = false,
  ) => ({
    label,
    type,
    options: [],
    defaultValue,
    inspector: args.inspector ?? 'checkbox',
  }),
}

export const Conditions = {
  onClickEvent: () => ({
    type: 'onClickEvent',
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

const Numi = {

  useEventCallback(
    props: {
      name: string;
      elements?: Record<'value' | 'label', string>[],
      events?: { label: string; events: Event[], required?: boolean }[],
      interaction?: Record<string, any>
    }
  ) {
    const checkout = Numi.useCheckout();
    const blockContext = useContext(BlockContext);
    const [hook, setHook] = useState<HookUsage>({
      name: props.name,
      type: 'eventCallback',
      defaultValue: null,
      options: props.elements,
      events: props.events ?? [],
    });

    // Create a ref to hold the debounced function
    const debouncedUpdateRef = useRef<ReturnType<typeof debounce> | null>(null);

    // Initialize the debounced function on first render
    useEffect(() => {
      debouncedUpdateRef.current = debounce((newHook: Partial<HookUsage>) => {
        setHook(prevHook => ({ ...prevHook, ...newHook }));
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

    const executeCallbacks = useCallback((type: Event, element?: string) => {
      if (blockContext.blockConfig.interaction?.[type]) {
        const callbacks = element
          ? blockContext.blockConfig.interaction[type].filter((callback: { element?: string }) => callback?.element === element)
          : blockContext.blockConfig.interaction[type];

        for (const callback of callbacks) {
          switch (callback.action) {
            case 'setSlot':
              // checkout.setSlot(callback.slot, callback.price);
              break;
            case 'setLineItemQuantity':
            case 'changeLineItemPrice':
            case 'deactivateLineItem':
            case 'activateLineItem':
            case 'setItem':
              checkout.updateLineItem(callback.value);
              break;
            case 'redirect':
              window.open(callback.value, '_blank');
              break;
          }
        }
      }
    }, [blockContext]);

    const updateHook = useCallback((newHook: Partial<HookUsage>) => {
      if (debouncedUpdateRef.current) {
        debouncedUpdateRef.current(newHook);
      }
    }, []);

    return {
      interaction: blockContext.blockConfig.interaction,
      executeCallbacks,
      updateHook
    };
  },

  useStateJsonSchema(props: {
    name: string;
    label: string;
    schema: JSONSchemaValue,
    defaultValue: any,
    group?: string,
  }): Array<any> {

    const blockContext = useContext(BlockContext);

    useEffect(() => {
      blockContext.registerHook({
        name: props.name,
        label: props.label,
        type: 'jsonSchema',
        schema: props.schema,
        defaultValue: props.defaultValue || {},
        group: props.group,
      });
    }, [blockContext.blockId, props.name]);

    const data = get(blockContext.blockConfig, `content.${props.name}`, props.defaultValue || {});

    return [data];
  },

  useCheckout(options: CheckoutOptions = {}): CheckoutState {
    const checkout = useContext(GlobalStateContext);

    // useEffect(() => {
    //   // Cleanup function
    //   return () => {
    //     // Any cleanup needed
    //   };
    // }, []);

    return checkout;
  },

  useAppearance(appearanceProps: any[]) {
    const blockContext = useContext(BlockContext);
    const [registered, setRegistered] = useState(false);

    // Register hooks only once
    useEffect(() => {
      if (registered) return;

      // Register each appearance property
      appearanceProps.forEach(prop => {
        if (prop.type) {
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

      setRegistered(true);
    }, [blockContext.blockId, appearanceProps]);


    // Calculate appearance using useMemo to prevent unnecessary recalculations
    return useMemo(() => {
      const appearance: Record<string, any> = {};

      // Get the value from block config or use default
      appearanceProps.forEach(prop => {
        if (prop.type) {

          const value = blockContext.blockConfig.appearance?.[prop.type] || prop.defaultValue
          appearance[prop.type] = value;
        }
      });

      return appearance;
    }, [blockContext.blockConfig.appearance, blockContext.blockId, appearanceProps]);
  },

  useStyle(styleProps: any[]): Record<string, any> {
    const blockContext = useContext(BlockContext);
    const [registered, setRegistered] = useState(false);

    // Register hooks only once
    useEffect(() => {
      if (registered) return;

      // Register each style property
      styleProps.forEach(prop => {
        if (prop.type) {
          blockContext.registerHook({
            name: prop.type,
            type: 'style',
            defaultValue: prop.defaultValue,
            options: prop.options,
            inspector: prop.inspector,
            label: prop.label || prop.type.charAt(0).toUpperCase() + prop.type.slice(1),
            config: prop.config ?? {}
          });
        }
      });

      setRegistered(true);
    }, [blockContext.blockId, styleProps]);

    // Calculate styles using useMemo to prevent unnecessary recalculations
    return useMemo(() => {
      const style: Record<string, any> = {};



      // Get the value from block config or use default
      styleProps.forEach(prop => {
        if (prop.type) {
          style[prop.type] = blockContext.blockConfig.style?.[prop.type]
          || prop.defaultValue;
        }
      });

      return style;
    }, [blockContext.blockConfig.style, blockContext.blockId, styleProps]);
  },

  useInteraction(): { isDisabled: any; updateHook: (hook: Partial<HookUsage>) => void } {
    const blockContext = useContext(BlockContext);
    const [hook, setHook] = useState<HookUsage>({
      name: 'interaction',
      type: 'interaction',
      defaultValue: false,
    });

    // Create a ref to hold the debounced function
    const debouncedUpdateRef = useRef<ReturnType<typeof debounce> | null>(null);

    // Initialize the debounced function on first render
    useEffect(() => {
      debouncedUpdateRef.current = debounce((newHook: Partial<HookUsage>) => {
        setHook(prevHook => ({ ...prevHook, ...newHook }));
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

    const updateHook = useCallback((newHook: Partial<HookUsage>) => {
      if (debouncedUpdateRef.current) {
        debouncedUpdateRef.current(newHook);
      }
    }, []);

    return {
      isDisabled: blockContext.blockConfig.interaction?.isDisabled ?? false,
      updateHook
    }
  },

  useStateEnumeration(props: {
    name: string;
    initialValue?: string;
    options: string[];
    labels?: Record<string, string>;
    inspector: string;
    label: string;
    icons?: Record<string, React.ReactNode>;
    asState?: boolean;
    group?: string;
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
      group: props.group,
    });

    // Create a ref to hold the debounced function
    const debouncedUpdateRef = useRef<ReturnType<typeof debounce> | null>(null);

    // Initialize the debounced function on first render
    useEffect(() => {
      debouncedUpdateRef.current = debounce((newHook: Partial<HookUsage>) => {
        setHook(prevHook => ({ ...prevHook, ...newHook }));
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

    // If use as state, prioritize getting the field value from the global state
    const defaultValue = get(blockContext.blockConfig, `content.${props.name}`) ?? props.initialValue;
    const value = props.asState
      ? blockContext.getFieldValue(props.name) ?? defaultValue
      : defaultValue;

    useEffect(() => {
      setValue(value);
    }, []);

    const setValue = (newValue: any) => {
      blockContext.setFieldValue(props.name, newValue);
    };

    const updateHook = useCallback((newHook: Partial<HookUsage>) => {
      if (debouncedUpdateRef.current) {
        debouncedUpdateRef.current(newHook);
      }
    }, []);


    return [value, setValue, updateHook];
  },

  useStateBoolean(props: { name: string; defaultValue: boolean; label?: string; inspector?: string, group?: string }): [boolean, (value: boolean) => void] {
    const blockContext = useContext(BlockContext);

    useEffect(() => {
      blockContext.registerHook({
        name: props.name,
        type: 'boolean',
        defaultValue: props.defaultValue,
        inspector: props.inspector ?? 'checkbox',
        label: props.label,
        group: props.group,
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


    const value = blockContext.blockConfig.content[props.name] ?? blockContext.getFieldValue(props.name) ?? props.defaultValue;

    const setValue = (newValue: boolean) => {
      blockContext.setFieldValue(props.name, newValue);
    };

    return [value, setValue];
  },

  useStateString(props: { label: string; name: string; defaultValue: string; inspector?: string, format?: string, config?: Record<string, any>, group?: string }): [string, (value: string) => void, string] {
    const blockContext = useContext(BlockContext);

    useEffect(() => {
      blockContext.registerHook({
        label: props.label,
        name: props.name,
        type: 'string',
        defaultValue: props.defaultValue,
        inspector: props.inspector ?? 'text',
        config: props.config ?? {},
        group: props.group,
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
  },

  useStateNumber(props: {
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
  },

  useRuntimeString(props: { name: string; defaultValue: string }): [string, (value: string) => void] {
    const blockContext = useContext(BlockContext);

    const value = props.name in blockContext.blockConfig.content
      ? blockContext.blockConfig.content[props.name]
      : blockContext.getFieldValue(props.name) ?? props.defaultValue;

    const setValue = (newValue: string) => {
      blockContext.setFieldValue(props.name, newValue);
    };

    return [value, setValue];
  },

  useValidation(props: { rules: Record<string, any> }): {
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
  },

  useTheme(): Theme | undefined {
    const blockContext = useContext(BlockContext);
    return blockContext.theme;
  },
}

export default Numi;
