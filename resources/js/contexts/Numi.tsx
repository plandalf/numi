// Numi hooks

import { BlockConfig, BlockContextType } from "@/types/blocks";
import { createContext, useContext, useEffect, useState } from "react";
import get from "lodash/get";
import { CheckoutState, GlobalStateContext } from "@/pages/Checkout";

export const BlockContext = createContext<BlockContextType>({
  blockId: '',
  blockConfig: {} as BlockConfig,
  globalState: {
    fieldStates: {},
    updateFieldState: () => {},
    getFieldState: () => undefined,
    registerHook: () => {},
    hookUsage: {}
  },


  registerField: () => {},
  getFieldValue: () => undefined,
  setFieldValue: () => {},
  registerHook: () => {}
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

export const Appearance = {
  alignment: (options: string[] = ['left', 'center', 'right', 'expand']) => ({
    type: 'alignment',
    options,
    defaultValue: 'left'
  }),
  
  backgroundColor: (options: string[] = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark']) => ({
    type: 'backgroundColor',
    options,
    defaultValue: 'primary'
  }),
  textColor: (options: string[] = []) => ({
    type: 'textColor',
    options,
    defaultValue: 'primary'
  }),
  fontWeight: (options: string[] = ['normal', 'semibold', 'bold']) => ({
    type: 'fontWeight',
    options,
    defaultValue: 'normal'
  }),
  border: () => ({
    type: 'border',
    defaultValue: '1px solid #ccc',
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

  static useStateJsonSchema(props: { name: string; schema: { $schema: string; type: string; items: { type: string; properties: { key: { type: string; }; children: { type: string; items: { type: string; properties: { key: { type: string; }; label: { type: string; }; caption: { type: string; }; color: { type: string; }; prefixImage: { type: string; format: string; description: string; meta: { editor: string; }; }; prefixIcon: { type: string; description: string; meta: { editor: string; }; }; prefixText: { type: string; }; tooltip: { type: string; }; disabled: { type: string; }; hidden: { type: string; }; }; required: string[]; }; }; }; required: string[]; }; }}): Array<any> {

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

    useEffect(() => {
      // Cleanup function
      return () => {
        // Any cleanup needed
      };
    }, []);

    return {
      session,
    };
  }

  static useAppearance(appearanceProps: any[]): Record<string, any> {
    const blockContext = useContext(BlockContext);
    const [appearance, setAppearance] = useState<Record<string, any>>({});

    useEffect(() => {
      // Register each appearance property
      appearanceProps.forEach(prop => {
        if (prop.type) {
          // Get the value from block config or use default
          const value = blockContext.blockConfig.appearance?.[prop.type] || prop.defaultValue;
          
          // Update the appearance state
          setAppearance(prev => ({
            ...prev,
            [prop.type]: value
          }));
          
          // Register the hook
          blockContext.registerHook({
            name: prop.type,
            type: 'appearance',
            defaultValue: prop.defaultValue,
            options: prop.options,
            inspector: 'select',
            label: prop.type.charAt(0).toUpperCase() + prop.type.slice(1)
          });
        }
      });
    }, []);
    // }, [blockContext.blockId, appearanceProps]);

    return appearance;
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
    initialValue: string; 
    options: string[]; 
    labels: Record<string, string>;
    inspector: string; 
    label: string; 
    icons?: Record<string, React.ReactNode>;
  }): [any] {
    const blockContext = useContext(BlockContext);

    useEffect(() => {
      blockContext.registerHook({
        name: props.name,
        type: 'enumeration',
        defaultValue: props.initialValue,
        options: props.options,
        labels: props.labels,
        icons: props.icons,
        inspector: props.inspector,
        label: props.label,
      });
    }, []);

    const value = get(blockContext.blockConfig, `content.${props.name}`) ?? props.initialValue;

    return [value];
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

  static useStateString(props: { name: string; defaultValue: string; inspector?: string }): [string, (value: string) => void, string] {
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
    const format = get(blockContext.blockConfig, `content.format`) ?? 'plain';

    const setValue = (newValue: string) => {
      blockContext.setFieldValue(props.name, newValue);
    };

    return [value, setValue, format];
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
}

const NumiEditorContext = createContext<{
  blocks: BlockConfig[];
  selectedBlock: BlockConfig | null;
  setSelectedBlock: (block: BlockConfig | null) => void;
  updateBlock: (updatedBlock: BlockConfig) => void;
}>({
  blocks: [],
  selectedBlock: null,
  setSelectedBlock: () => {},
  updateBlock: () => {},
});

export default Numi;