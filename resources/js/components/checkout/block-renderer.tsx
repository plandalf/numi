import { BlockContext } from '@/contexts/Numi';
import { isBlockVisible } from '@/lib/utils';
import { GlobalStateContext } from '@/pages/checkout-main';
import { BlockConfig, BlockContextType, FieldState, HookUsage } from '@/types/blocks';
import { useContext, useMemo } from 'react';

export function BlockRenderer({ block, children }: {
  block: BlockConfig,
  children: (props: BlockContextType) => React.ReactNode
}) {
  const globalStateContext = useContext(GlobalStateContext);
  if (!globalStateContext) {
    throw new Error('BlockRenderer must be used within a GlobalStateProvider');
  }

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

  const isVisible = useMemo(() => {
    const visibility = block.appearance?.visibility;

    return isBlockVisible({ fields: globalStateContext.fields }, visibility?.fn);
  }, [block, globalStateContext]);

  if (!isVisible) {
    return null;
  }


  return (
    <BlockContext.Provider value={blockContext}>
      {children(blockContext)}
    </BlockContext.Provider>
  );
}