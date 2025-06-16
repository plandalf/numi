import { BlockContext } from '@/contexts/Numi';
import { isBlockVisible } from '@/lib/blocks';
import { cn } from '@/lib/utils';
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

  const isVisible = useMemo(() => {
    const visibility = block.appearance?.visibility;

    return isBlockVisible({ fields: globalStateContext.fields }, visibility);
  }, [block, globalStateContext]);

  const blockContext: BlockContextType = {
    theme: globalStateContext.theme,
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
    },
    hidden: !isVisible,
  };

  return (
    <BlockContext.Provider value={blockContext}>
      <div className={cn({
        '!hidden': !isVisible,
      })}>{children(blockContext)}</div>
    </BlockContext.Provider>
  );
}
