// Numi hooks

import { BlockConfig, BlockContextType, HookUsage } from "@/types/blocks";
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
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



export const Appearance = {
  alignment: (options: string[] = ['left', 'center', 'right', 'expand']) => ({
    type: 'alignment',
    options,
    defaultValue: 'left'
  }),

  backgroundColor: (type: "backgroundColor" | "activeBackgroundColor" | "inactiveBackgroundColor" = "backgroundColor", label: string = 'Background Color', options: string[] = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark']) => ({
    type,
    options,
    defaultValue: 'primary',
    label
  }),
  textColor: (options: string[] = []) => ({
    type: 'textColor',
    options,
    defaultValue: 'primary',
    label: 'Text Color'
  }),
  fontWeight: (options: string[] = ['normal', 'semibold', 'bold']) => ({
    type: 'fontWeight',
    options,
    defaultValue: 'normal'
  }),
  border: () => ({
    type: 'border',
    defaultValue: '1px',
  }),
  borderColor: () => ({
    type: 'borderColor',
    defaultValue: '#ccc',
  }),
  hidden: () => ({
    type: 'hidden',
    defaultValue: false,
  }),
  visibility: () => ({
    type: 'visibility',
    defaultValue: {
      conditional: []
    }
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

// Convert class to const object with hooks
const Numi = {
  useEventCallback(props: { name: string; }) {
    const blockContext = useContext(BlockContext);

    useEffect(() => {
      blockContext.registerHook({
        name: props.name,
        type: 'eventCallback',
        defaultValue: null,
      });
    }, []);

    return () => {
      if (blockContext.blockConfig.interaction?.onClick) {
        for (const callback of blockContext.blockConfig.interaction.onClick) {
          switch (callback.action) {
            case 'setSlot':
              break;
            case 'setField':
              blockContext.setFieldValue(callback.field, callback.value);
              break;
          }
        }
      }
    };
  },

  useStateJsonSchema(props: { name: string; schema: { $schema: string; type: string; items: { type: string; properties: { key: { title: string; type: string; }; value: { title: string; type: string; }; children: { type: string; items: { type: string; properties: { key: { type: string; }; label: { type: string; }; caption: { type: string; }; color: { type: string; }; prefixImage: { type: string; format: string; description: string; meta: { editor: string; }; }; prefixIcon: { type: string; description: string; meta: { editor: string; }; }; prefixText: { type: string; }; tooltip: { type: string; }; disabled: { type: string; }; hidden: { type: string; }; }; required: string[]; }; }; }; required: string[]; }; }}): Array<any> {
    const blockContext = useContext(BlockContext);

    useEffect(() => {
      blockContext.registerHook({
        name: props.name,
        type: 'jsonSchema',
        schema: props.schema,
        defaultValue: {}
      });
    }, []);

    const data = get(blockContext.blockConfig, `content.${props.name}`, {});
    return [data];
  },

  useCheckout(options: CheckoutOptions = {}): CheckoutState {
    const globalState = useContext(GlobalStateContext);
    const session = globalState?.session ?? null;

    return {
      session,
      currentPageId: '',
      pageHistory: [],
      completedPages: [],
      formData: {},
      errors: {},
      isValid: true,
      isSubmitting: false,
      isSubmitted: false,
      isDirty: false,
      isPristine: true,
      isTouched: false,
      isUntouched: true,
      isFocused: false,
      isBlurred: true,
    };
  },

  useAppearance(appearanceProps: any[]): Record<string, any> {
    const blockContext = useContext(BlockContext);
    const [appearance, setAppearance] = useState<Record<string, any>>({});

    useEffect(() => {
      appearanceProps.forEach(prop => {
        if (prop.type) {
          const value = blockContext.blockConfig.appearance?.[prop.type] || prop.defaultValue;

          setAppearance(prev => ({
            ...prev,
            [prop.type]: value
          }));

          blockContext.registerHook({
            name: prop.type,
            type: 'appearance',
            defaultValue: prop.defaultValue,
            options: prop.options,
            inspector: 'select',
            label: prop.label || prop.type.charAt(0).toUpperCase() + prop.type.slice(1)
          });
        }
      });
    }, []);

    return appearance;
  },

  useInteraction(): { isDisabled: boolean } {
    const blockContext = useContext(BlockContext);

    useEffect(() => {
      blockContext.registerHook({
        name: 'interaction',
        type: 'interaction',
        defaultValue: false
      });
    }, []);

    return {
      isDisabled: blockContext.blockConfig.interaction?.isDisabled ?? false,
    };
  },

  useStateEnumeration(props: {
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
      inspector: props.inspector,
      label: props.label,
    });

    const debouncedUpdateRef = useRef<ReturnType<typeof debounce> | null>(null);

    useEffect(() => {
      debouncedUpdateRef.current = debounce((newHook: Partial<HookUsage>) => {
        setHook(prevHook => ({...prevHook, ...newHook}));
      }, 300);

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
  },

  useStateBoolean(props: { name: string; defaultValue: boolean; label?: string; inspector?: string }): [boolean, (value: boolean) => void] {
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
        const initialValue = blockContext.blockConfig.content[props.name] ?? props.defaultValue;
        blockContext.globalState.updateFieldState(
          blockContext.blockId,
          props.name,
          initialValue
        );
      }
    }, [blockContext.blockId, props.name]);

    const value = props.inspector === 'checkbox'
      ? blockContext.blockConfig.content[props.name] ?? blockContext.getFieldValue(props.name) ?? props.defaultValue
      : blockContext.getFieldValue(props.name) ?? blockContext.blockConfig.content[props.name] ?? props.defaultValue;

    const setValue = (newValue: boolean) => {
      blockContext.setFieldValue(props.name, newValue);
    };

    return [value, setValue];
  },

  useStateString(props: { name: string; defaultValue: string; inspector?: string, format?: string }): [string, (value: string) => void, string] {
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
        const initialValue = blockContext.blockConfig.content[props.name] ?? props.defaultValue;
        blockContext.globalState.updateFieldState(
          blockContext.blockId,
          props.name,
          initialValue
        );
      }
    }, [blockContext.blockId, props.name]);

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
        const initialValue = blockContext.blockConfig.content[props.name] ?? props.defaultValue;
        blockContext.globalState.updateFieldState(
          blockContext.blockId,
          props.name,
          initialValue
        );
      }
    }, [blockContext.blockId, props.name]);

    const value = props.inspector !== 'hidden'
      ? Number(get(blockContext.blockConfig, `content.${props.name}`)) || Number(blockContext.getFieldValue(props.name)) || props.defaultValue
      : Number(blockContext.getFieldValue(props.name)) || Number(get(blockContext.blockConfig, `content.${props.name}`)) || props.defaultValue;

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
    isRequired: boolean;
  } {
    const blockContext = useContext(BlockContext);
    const [isValid, setIsValid] = useState(true);
    const [errors, setErrors] = useState<string[]>([]);

    useEffect(() => {
      blockContext.registerHook({
        name: 'validation',
        type: 'validation',
        defaultValue: null,
        rules: props.rules,
      });
    }, []);

    const validate = (value: any) => {
      const newErrors: string[] = [];

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
  }
};

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
