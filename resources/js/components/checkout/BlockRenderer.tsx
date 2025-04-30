import { GlobalStateContext, useCheckoutState } from '@/contexts/GlobalStateProvider';
import { BlockContext } from '@/contexts/Numi';
import { BlockConfig, HookUsage } from '@/types/blocks';
import { useContext, useMemo } from 'react';
import Mustache from 'mustache';
import { isBlockVisible } from '@/lib/utils';

export interface BlockContextType {
  blockId: string;
}

// Stubbed out BlockRenderer component that doesn't render anything
// Block Renderer
export function BlockRenderer({ block, children }: {
  block: BlockConfig,
  children: (props: BlockContextType) => React.ReactNode,
}) {
  const globalStateContext = useContext(GlobalStateContext);
  if (!globalStateContext) {
    throw new Error('BlockRenderer must be used within a GlobalStateProvider');
  }

  const { fields } = useCheckoutState();

  const isVisible = useMemo(() => {
    const visibility = block.appearance?.visibility;

   return isBlockVisible({ fields }, visibility?.fn);
  }, [block, fields]);

  const blockContext: BlockContextType = {
    blockId: block.id,
    blockConfig: block,
    globalState: globalStateContext,
    registerField: (fieldName, defaultValue) => {
      if (!globalStateContext.getFieldState(block.id, fieldName)) {
        globalStateContext.updateFieldState(block.id, fieldName, defaultValue);
      }
    },
    getFieldValue: (fieldName) => {
      return globalStateContext.getFieldState(block.id, fieldName)?.value;
    },
    setFieldValue: (fieldName, value) => {
      globalStateContext.updateFieldState(block.id, fieldName, value);
    },
    registerHook: (hook: HookUsage) => {
      globalStateContext.registerHook(block, hook);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <BlockContext.Provider value={blockContext}>
      {children(blockContext)}
    </BlockContext.Provider>
  );
}


