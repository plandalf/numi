// Numi hooks

import { BlockConfig, BlockContextType, HookUsage } from "@/types/blocks";
import { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from "react";
import get from "lodash/get";
import debounce from "lodash/debounce";
import { Theme } from "@/types/theme";
import { GlobalState, GlobalStateContext } from '@/pages/checkout-main';
import { CallbackType, Event } from "@/components/editor/interaction-event-editor";

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
      | "paymentFormBackgroundColor"
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
    config: {
      ...args.config,
      supportsGradients: true, // Enable gradient support
    }
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

  useCheckout(options: CheckoutOptions = {}): GlobalState {
    const checkout = useContext(GlobalStateContext);

    if (!checkout) {
      throw new Error('useCheckout must be used within a GlobalStateProvider');
    }

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
    const { session, isEditor, updateSessionProperties } = Numi.useCheckout();

    // Get session value directly - simplified and more robust
    const sessionValue = (() => {
      try {
        // Skip session retrieval if in editor mode
        if (isEditor) return null;
        
        // Check if session and properties exist
        if (!session?.properties) return null;
        
        const blockData = session.properties[blockContext.blockId];
        if (blockData === undefined) return null;
        
        // Handle both old format (direct value) and new format (object with field names)
        if (typeof blockData === 'object' && blockData !== null && !Array.isArray(blockData)) {
          return blockData[props.name] ?? null;
        }
        
        // Old format - direct value (for backward compatibility)
        return blockData;
      } catch (error) {
        console.error('Error retrieving session value:', error);
        return null;
      }
    })();

    // If use as state, prioritize getting the field value from the global state
    const defaultValue = props.asState
      ? (sessionValue !== null ? sessionValue : (blockContext.getFieldValue(props.name) ?? get(blockContext.blockConfig, `content.${props.name}`) ?? props.initialValue))
      : (get(blockContext.blockConfig, `content.${props.name}`) ?? props.initialValue);

    const [value, setValue] = useState(defaultValue);

    // Update the value if the block config is changed (On the builder) or if session value changes
    useEffect(() => {
      try {
        if(isEditor && blockContext.blockConfig.content[props.name]){
          setValue(blockContext.blockConfig.content[props.name]);
        } else if (!isEditor && sessionValue !== null) {
          // In runtime, prioritize session value
          setValue(sessionValue);
        } else {
          // Ensure we have a valid value even if session is empty
          setValue(props.initialValue);
        }
      } catch (error) {
        console.error('Error updating value in useEffect for', props.name, ':', error);
        setValue(props.initialValue); // Fallback to default
      }
    }, [blockContext.blockConfig.content[props.name], sessionValue, isEditor, props.initialValue, props.name]);

    const [hook, setHook] = useState<HookUsage>({
      name: props.name,
      type: 'enumeration',
      defaultValue: defaultValue,
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
      blockContext.registerField('value', defaultValue);
    }, [hook]);

    const setFieldValue = (newValue: any) => {
      try {
        blockContext.setFieldValue('value', newValue);
        setValue(newValue);
        
        // If asState is true, update session properties
        if (props.asState) {
          try {
            // Ensure session and updateSessionProperties exist
            if (!session || !updateSessionProperties) {
              console.warn('Session or updateSessionProperties not available');
              return;
            }

            // Get existing session properties for this block
            const existingBlockData = session.properties?.[blockContext.blockId];
            let existingProperties = {};
            
            // Handle both old format (direct value) and new format (object with field names)
            if (typeof existingBlockData === 'object' && existingBlockData !== null && !Array.isArray(existingBlockData)) {
              existingProperties = existingBlockData;
            }
            
            const updatedProperties = {
              ...existingProperties,
              [props.name]: newValue
            };
            
            // Update session properties
            updateSessionProperties(blockContext.blockId, updatedProperties);
          } catch (sessionError) {
            console.error('Error updating session properties:', sessionError);
          }
        }
      } catch (error) {
        console.error('Error in setFieldValue:', error);
      }
    };

    const updateHook = useCallback((newHook: Partial<HookUsage>) => {
      if (debouncedUpdateRef.current) {
        debouncedUpdateRef.current(newHook);
      }
    }, []);

    return [value, setFieldValue, updateHook];
  },

  useStateBoolean({ name, defaultValue: initialDefaultValue, label, inspector, group, asState }: { name: string; defaultValue: boolean; label?: string; inspector?: string, group?: string; asState?: boolean; }): [boolean, (value: boolean) => void, boolean] {
    const blockContext = useContext(BlockContext);
    const { session, isEditor, updateSessionProperties } = Numi.useCheckout();

    // Get session value directly - simplified and more robust
    const sessionValue = (() => {
      try {
        // Skip session retrieval if in editor mode
        if (isEditor) return null;
        
        // Check if session and properties exist
        if (!session?.properties) return null;
        
        const blockData = session.properties[blockContext.blockId];
        if (blockData === undefined) return null;
        
        // Handle both old format (direct value) and new format (object with field names)
        if (typeof blockData === 'object' && blockData !== null && !Array.isArray(blockData)) {
          return blockData[name] ?? null;
        }
        
        // Old format - direct value (for backward compatibility)
        return blockData;
      } catch (error) {
        console.error('Error retrieving session value:', error);
        return null;
      }
    })();

    const defaultValue = sessionValue !== null ? sessionValue : (blockContext.blockConfig.content[name] ?? blockContext.getFieldValue(name) ?? initialDefaultValue);
    const [value, setValue] = useState(defaultValue);

    // Update the value if the block config is changed (On the builder) or if session value changes
    useEffect(() => {
      try {
        if (isEditor) {
          const editorValue = blockContext.blockConfig.content[name] ?? blockContext.getFieldValue(name);
          if (editorValue !== undefined) {
            setValue(editorValue);
          }
        } else if (sessionValue !== null) {
          // In runtime, prioritize session value
          setValue(sessionValue);
        } else {
          // Ensure we have a valid value even if session is empty
          setValue(initialDefaultValue);
        }
      } catch (error) {
        console.error('Error updating value in useEffect for', name, ':', error);
        setValue(initialDefaultValue); // Fallback to default
      }
    }, [blockContext.blockConfig.content[name], sessionValue, isEditor, initialDefaultValue, name]);

    useEffect(() => {
      blockContext.registerHook({
        name: name,
        type: 'boolean',
        defaultValue: defaultValue,
        inspector: inspector ?? 'checkbox',
        label: label,
        group: group,
      });

      blockContext.registerField('value', defaultValue);

      const existingState = blockContext.globalState.getFieldState(
        blockContext.blockId,
        name
      );

      if (!existingState) {
        // Use block config value as initial value if it exists
        const initialValue = blockContext.blockConfig.content[name] ?? defaultValue;
        blockContext.globalState.updateFieldState(
          blockContext.blockId,
          name,
          initialValue
        );
      }
    }, [blockContext.blockId, name]);

    // Ensure field state is synchronized with session value
    useEffect(() => {
      if (asState && sessionValue !== null) {
        blockContext.globalState.updateFieldState(
          blockContext.blockId,
          name,
          sessionValue
        );
      }
    }, [sessionValue, asState, blockContext.blockId, name]);

    const setFieldValue = (newValue: boolean) => {
      try {
        blockContext.setFieldValue(name, newValue);
        setValue(newValue);
        
        // If asState is true, update session properties
        if (asState) {
          try {
            // Ensure session and updateSessionProperties exist
            if (!session || !updateSessionProperties) {
              console.warn('Session or updateSessionProperties not available');
              return;
            }

            // Get existing session properties for this block
            const existingBlockData = session.properties?.[blockContext.blockId];
            let existingProperties = {};
            
            // Handle both old format (direct value) and new format (object with field names)
            if (typeof existingBlockData === 'object' && existingBlockData !== null && !Array.isArray(existingBlockData)) {
              existingProperties = existingBlockData;
            }
            
            const updatedProperties = {
              ...existingProperties,
              [name]: newValue
            };
            
            // Update session properties
            updateSessionProperties(blockContext.blockId, updatedProperties);
          } catch (sessionError) {
            console.error('Error updating session properties:', sessionError);
          }
        }
      } catch (error) {
        console.error('Error in setFieldValue:', error);
      }
    };

    return [value, setFieldValue, sessionValue];
  },

  useStateString(props: { label: string; name: string; defaultValue: string; inspector?: string, format?: string, config?: Record<string, any>, group?: string; asState?: boolean; }): [string, (value: string) => void, string] {
    const blockContext = useContext(BlockContext);
    const { session, isEditor, updateSessionProperties } = Numi.useCheckout();

    // Get session value directly - simplified and more robust
    const sessionValue = (() => {
      try {
        // Skip session retrieval if in editor mode
        if (isEditor) return null;
        
        // Check if session and properties exist
        if (!session?.properties) return null;
        
        const blockData = session.properties[blockContext.blockId];
        if (blockData === undefined) return null;
        
        // Handle both old format (direct value) and new format (object with field names)
        if (typeof blockData === 'object' && blockData !== null && !Array.isArray(blockData)) {
          return blockData[props.name] ?? null;
        }
        
        // Old format - direct value (for backward compatibility)
        return blockData;
      } catch (error) {
        console.error('Error retrieving session value:', error);
        return null;
      }
    })();

    // Determine the default value based on the context
    let defaultValue: string;
    
    if (props.asState) {
      // For runtime state fields, prioritize session value, then field state, then block config
      defaultValue = sessionValue !== null 
        ? sessionValue 
        : (blockContext.getFieldValue(props.name) ?? get(blockContext.blockConfig, `content.${props.name}`) ?? props.defaultValue);
    } else {
      // For editor-configurable fields, prioritize block config, then session value, then default
      defaultValue = get(blockContext.blockConfig, `content.${props.name}`) ?? 
                    (sessionValue !== null ? sessionValue : props.defaultValue);
    }

    const [value, setValue] = useState(defaultValue);

    // Update the value if the block config is changed (On the builder) or if session value changes
    useEffect(() => {
      try {
        if (props.asState) {
          // For runtime state fields, prioritize session value
          if (sessionValue !== null) {
            setValue(sessionValue);
          } else if (blockContext.getFieldValue(props.name)) {
            setValue(blockContext.getFieldValue(props.name));
          }
        } else {
          // For editor-configurable fields, prioritize block config
          if (blockContext.blockConfig.content[props.name] !== undefined) {
            setValue(blockContext.blockConfig.content[props.name]);
          } else if (sessionValue !== null) {
            setValue(sessionValue);
          } else {
            setValue(props.defaultValue);
          }
        }
      } catch (error) {
        console.error('Error updating value in useEffect for', props.name, ':', error);
        setValue(props.defaultValue); // Fallback to default
      }
    }, [blockContext.blockConfig.content[props.name], sessionValue, props.asState, props.defaultValue, props.name, blockContext]);

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

    const format = get(blockContext.blockConfig, `content.format`) ?? props.format ?? 'plain';

    const setFieldValue = (newValue: string) => {
      try {
        blockContext.setFieldValue(props.name, newValue);
        setValue(newValue);
        
        // If asState is true, update session properties
        if (props.asState) {
          try {
            // Ensure session and updateSessionProperties exist
            if (!session || !updateSessionProperties) {
              console.warn('Session or updateSessionProperties not available');
              return;
            }

            // Get existing session properties for this block
            const existingBlockData = session.properties?.[blockContext.blockId];
            let existingProperties = {};
            
            // Handle both old format (direct value) and new format (object with field names)
            if (typeof existingBlockData === 'object' && existingBlockData !== null && !Array.isArray(existingBlockData)) {
              existingProperties = existingBlockData;
            }
            
            const updatedProperties = {
              ...existingProperties,
              [props.name]: newValue
            };
            
            // Update session properties
            updateSessionProperties(blockContext.blockId, updatedProperties);
          } catch (sessionError) {
            console.error('Error updating session properties:', sessionError);
          }
        }
      } catch (error) {
        console.error('Error in setFieldValue:', error);
      }
    };

    return [value, setFieldValue, format];
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
      blockContext.setFieldValue('value', newValue);
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
    validateField: (value: any, fieldName?: string) => string[];
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

    const validateField = (value: any, fieldName?: string): string[] => {
      const newErrors: string[] = [];
      const rules = props.rules;

      // Required validation
      if (rules.isRequired && (value === undefined || value === null || value === '' || (Array.isArray(value) && (!value || value.length === 0)))) {
        const label = blockContext.blockConfig.content?.label || fieldName || 'This field';
        newErrors.push(`${label} is required`);
      }

      // Only validate other rules if value exists and is not empty
      if (value !== undefined && value !== null && value !== '') {
        // Email validation
        if (rules.email && typeof value === 'string') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            newErrors.push('Please enter a valid email address');
          }
        }

        // Pattern validation
        if (rules.pattern && typeof value === 'string') {
          try {
            const regex = new RegExp(rules.pattern);
            if (!regex.test(value)) {
              newErrors.push(rules.patternMessage || 'Invalid format');
            }
          } catch (error) {
            console.error('Invalid regex pattern:', rules.pattern);
          }
        }

        // Min length validation
        if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
          newErrors.push(`Must be at least ${rules.minLength} characters`);
        }

        // Max length validation
        if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
          newErrors.push(`Must be no more than ${rules.maxLength} characters`);
        }

        // Min value validation (for numbers)
        if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
          newErrors.push(`Value must be at least ${rules.min}`);
        }

        // Max value validation (for numbers)
        if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
          newErrors.push(`Value must be no more than ${rules.max}`);
        }

        // Custom validation function
        if (rules.custom && typeof rules.custom === 'function') {
          try {
            const customResult = rules.custom(value);
            if (customResult !== true) {
              newErrors.push(typeof customResult === 'string' ? customResult : 'Invalid value');
            }
          } catch (error) {
            console.error('Custom validation error:', error);
          }
        }
      }

      return newErrors;
    };

    const validate = (value: any) => {
      const newErrors = validateField(value);
      setErrors(newErrors);
      setIsValid(newErrors.length === 0);
      return newErrors.length === 0;
    };

    return {
      isValid,
      errors,
      validate,
      validateField
    };
  },

  // New comprehensive validation function for page-level validation
  usePageValidation() {
    const blockContext = useContext(BlockContext);
    const { fieldStates, setErrors, clearErrors } = Numi.useCheckout();

    const validatePage = useCallback((pageBlocks: any[]): Record<string, string[]> => {
      const pageErrors: Record<string, string[]> = {};
      
      // Helper to collect all blocks from a page
      const collectBlocks = (blocks: any[] = []): any[] => {
        const allBlocks: any[] = [];
        blocks.forEach(block => {
          allBlocks.push(block);
          if (block.children) {
            allBlocks.push(...collectBlocks(block.children));
          }
        });
        return allBlocks;
      };

      const allBlocks = collectBlocks(pageBlocks);

      // Validate each block that has validation rules
      allBlocks.forEach(block => {
        if (!block.validation) return;

        // Get the field value for this block
        const fieldState = fieldStates[`${block.id}:value`] || fieldStates[block.id];
        const value = fieldState?.value;

        // Check if block has validation rules
        const hasValidationRules = block.validation.isRequired || 
                                  block.validation.email || 
                                  block.validation.pattern || 
                                  block.validation.minLength || 
                                  block.validation.maxLength ||
                                  block.validation.min !== undefined ||
                                  block.validation.max !== undefined;

        if (hasValidationRules) {
          const errors: string[] = [];

          // Required validation
          if (block.validation.isRequired && (value === undefined || value === null || value === '' || (Array.isArray(value) && (!value || value.length === 0)))) {
            const label = block.content?.label || block.content?.title || 'This field';
            errors.push(`${label} is required`);
          }

          // Only validate other rules if value exists and is not empty
          if (value !== undefined && value !== null && value !== '') {
            // Email validation
            if (block.validation.email && typeof value === 'string') {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(value)) {
                errors.push('Please enter a valid email address');
              }
            }

            // Pattern validation
            if (block.validation.pattern && typeof value === 'string') {
              try {
                const regex = new RegExp(block.validation.pattern);
                if (!regex.test(value)) {
                  errors.push(block.validation.patternMessage || 'Invalid format');
                }
              } catch (error) {
                console.error('Invalid regex pattern:', block.validation.pattern);
              }
            }

            // Min length validation
            if (block.validation.minLength && typeof value === 'string' && value.length < block.validation.minLength) {
              errors.push(`Must be at least ${block.validation.minLength} characters`);
            }

            // Max length validation
            if (block.validation.maxLength && typeof value === 'string' && value.length > block.validation.maxLength) {
              errors.push(`Must be no more than ${block.validation.maxLength} characters`);
            }

            // Min value validation (for numbers)
            if (block.validation.min !== undefined && typeof value === 'number' && value < block.validation.min) {
              errors.push(`Value must be at least ${block.validation.min}`);
            }

            // Max value validation (for numbers)
            if (block.validation.max !== undefined && typeof value === 'number' && value > block.validation.max) {
              errors.push(`Value must be no more than ${block.validation.max}`);
            }
          }

          // Add errors to page errors if any exist
          if (errors.length > 0) {
            pageErrors[block.id] = errors;
          }
        }
      });

      return pageErrors;
    }, [fieldStates]);

    const validateAndSetErrors = useCallback((pageBlocks: any[]): boolean => {
      const errors = validatePage(pageBlocks);
      
      if (Object.keys(errors).length > 0) {
        setErrors(errors);
        return false;
      } else {
        clearErrors();
        return true;
      }
    }, [validatePage, setErrors, clearErrors]);

    return {
      validatePage,
      validateAndSetErrors
    };
  },

  useTheme(): Theme | undefined {
    const blockContext = useContext(BlockContext);
    return blockContext.theme;
  },
}

export default Numi;
