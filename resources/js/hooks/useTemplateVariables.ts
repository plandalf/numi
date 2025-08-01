import { useMemo } from 'react';

interface TemplateVariable {
  key: string;
  label: string;
  description?: string;
  example?: string;
  category: 'trigger' | 'action';
  actionId?: number;
}

interface TriggerData {
  id: number;
  name?: string;
  trigger_key?: string;
  test_result?: Record<string, any>;
  app?: {
    name: string;
  };
}

interface ActionData {
  id: number;
  name?: string;
  action_key?: string;
  test_result?: Record<string, any>;
  app?: {
    name: string;
  };
}

interface UseTemplateVariablesOptions {
  triggers?: TriggerData[];
  actions?: ActionData[];
  currentActionId?: number; // Exclude actions after this one
}

export function useTemplateVariables({
  triggers = [],
  actions = [],
  currentActionId
}: UseTemplateVariablesOptions): TemplateVariable[] {

  return useMemo(() => {
    const variables: TemplateVariable[] = [];

    // Generate trigger variables - only from actual test results
    triggers.forEach((trigger) => {
      if (trigger.test_result && typeof trigger.test_result === 'object') {
        // Generate variables from actual test result data only
        generateVariablesFromObject(trigger.test_result, 'trigger', variables, {
          appName: trigger.app?.name || 'Trigger',
          triggerName: trigger.name
        });
      }
    });

    // Generate action variables - only from actual test results (only for actions before the current one)
    const availableActions = currentActionId
      ? actions.filter(action => action.id < currentActionId)
      : actions;

    availableActions.forEach((action, index) => {
      const actionNumber = index + 1; // Actions are numbered from 1

      if (action.test_result && typeof action.test_result === 'object') {
        // Generate variables from actual test result data only
        generateVariablesFromObject(action.test_result, 'action', variables, {
          actionId: actionNumber,
          actionName: action.name,
          appName: action.app?.name
        });
      }
    });

    return variables;
  }, [triggers, actions, currentActionId]);
}

function generateVariablesFromObject(
  data: Record<string, any>,
  category: 'trigger' | 'action',
  variables: TemplateVariable[],
  context: {
    actionId?: number;
    actionName?: string;
    appName?: string;
    triggerName?: string;
  },
  prefix = '',
  maxDepth = 3,
  currentDepth = 0
) {
  if (currentDepth >= maxDepth) return;

  Object.entries(data).forEach(([key, value]) => {
    const variableKey = prefix ? `${prefix}.${key}` : key;
    const fullKey = category === 'trigger'
      ? `trigger.${variableKey}`
      : `action_${context.actionId}.${variableKey}`;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recurse into nested objects
      generateVariablesFromObject(
        value,
        category,
        variables,
        context,
        variableKey,
        maxDepth,
        currentDepth + 1
      );
    } else {
      // Create variable for primitive values
      const label = formatLabel(key);
      const description = category === 'trigger'
        ? `${label} from ${context.appName || 'trigger'}`
        : `${label} from ${context.actionName || `Action ${context.actionId}`}`;

      let example = '';
      if (typeof value === 'string') {
        example = value.length > 50 ? `${value.slice(0, 50)}...` : value;
      } else if (typeof value === 'number') {
        example = String(value);
      } else if (typeof value === 'boolean') {
        example = String(value);
      } else if (Array.isArray(value) && value.length > 0) {
        example = `Array with ${value.length} items`;
      }

      variables.push({
        key: fullKey,
        label,
        description,
        example: example || undefined,
        category,
        actionId: context.actionId
      });
    }
  });
}

// Remove the common/schema variable functions since we only want actual test data

function formatLabel(key: string): string {
  return key
    .split(/[_\-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
