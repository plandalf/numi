import { BlockContext } from '@/contexts/Numi';
import { isEvaluatedVisible } from '@/lib/blocks';
import { cn } from '@/lib/utils';
import { GlobalStateContext } from '@/pages/client/checkout-main';
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

    if (Object.keys(globalStateContext.fields).length === 0 && visibility) {
      return false;
    }

    return isEvaluatedVisible({ fields: globalStateContext.fields }, visibility);
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
      <div style={{ visibility: isVisible ? 'visible' : 'collapse'}} className={cn('m-0 p-0', {
        '!hidden': !isVisible,
      })}>{children(blockContext)}</div>
    </BlockContext.Provider>
  );
}
