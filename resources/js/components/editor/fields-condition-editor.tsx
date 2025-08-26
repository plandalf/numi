import { Label } from '../ui/label';
import React, { useContext, useMemo, useState, useEffect } from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from '../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu';
import { GlobalStateContext } from '@/pages/client/checkout-main';
import { QueryBuilder, RuleGroupType } from 'react-querybuilder';
import 'react-querybuilder/dist/query-builder.css';
import { Trash2, ChevronDown } from 'lucide-react';
import { Combobox } from '../combobox';
import { Badge } from '../ui/badge';
import { useEditor } from '@/contexts/offer/editor-context';
import { useDebounce } from '@/hooks/use-debounce';

export enum Operator {
  EQUAL = 'eq',
  NOT_EQUAL = 'neq'
}

export interface VisibilityRule {
  field: string;
  value: string;
  operator: string;
}

export interface RuleGroup {
  combinator: 'and' | 'or';
  rules: (VisibilityRule | RuleGroup)[];
  action?: string;
}

export interface ActionOption {
  value: string;
  label: string;
}

export interface FieldsConditionEditorProps {
  value: RuleGroup | null;
  onChange: (value: RuleGroup) => void;
  actionOptions: ActionOption[];
  dialogTitle: string;
  triggerComponent: React.ReactNode;
  showLabel?: boolean;
  labelText?: string;
}

// Convert our RuleGroup to QueryBuilder's RuleGroupType
const mapRuleGroupToQueryBuilderFormat = (ruleGroup: RuleGroup | null): RuleGroupType => {
  if (!ruleGroup || !ruleGroup.rules) {
    return {
      combinator: 'and',
      rules: [],
    };
  }

  return {
    combinator: ruleGroup.combinator || 'and',
    rules: ruleGroup.rules
      .filter((rule): rule is (VisibilityRule | RuleGroup) => rule !== null && rule !== undefined)
      .map(rule => {
        if ('field' in rule) {
          // It's a VisibilityRule
          return {
            field: rule.field,
            operator: rule.operator,
            value: rule.value,
          };
        } else {
          // It's a nested RuleGroup
          return mapRuleGroupToQueryBuilderFormat(rule);
        }
      }),
  };
};

// Convert QueryBuilder's RuleGroupType back to our RuleGroup
const mapQueryBuilderToRuleGroup = (queryRules: RuleGroupType, action: string): RuleGroup => {
  return {
    combinator: queryRules.combinator as 'and' | 'or',
    rules: queryRules.rules.map(rule => {
      if ('rules' in rule) {
        // It's a nested rule group
        return mapQueryBuilderToRuleGroup(rule as RuleGroupType, action);
      } else {
        // It's a rule
        return {
          field: rule.field || '',
          operator: rule.operator || Operator.EQUAL,
          value: rule.value?.toString() || '',
        };
      }
    }),
    action,
  };
};

// Helper function to count the total number of rules in a RuleGroup
export const countRules = (ruleGroup: RuleGroup | null): number => {
  if (!ruleGroup || !ruleGroup.rules) return 0;

  return ruleGroup.rules.reduce((count, rule) => {
    if ('field' in rule) {
      // It's a simple rule
      return count + 1;
    } else {
      // It's a nested rule group
      return count + countRules(rule);
    }
  }, 0);
};

export const FieldsConditionEditor: React.FC<FieldsConditionEditorProps> = ({
  value,
  onChange,
  actionOptions,
  dialogTitle,
  triggerComponent,
  showLabel = false,
  labelText = 'Conditions'
}) => {
  const [open, setOpen] = React.useState(false);
  const [action, setAction] = React.useState<string>(value?.action || actionOptions[0].value);
  const { getBlock } = useEditor();
  // Convert our rule group to QueryBuilder format
  const [query, setQuery] = React.useState<RuleGroupType>(
    mapRuleGroupToQueryBuilderFormat(value)
  );

  const context = useContext(GlobalStateContext);
  const fieldStates = context?.fields ?? {};
  const hookUsage = context?.hookUsage ?? {};

  const fields = useMemo(() => {
    return Object.values(fieldStates).map(field => {
      if (field.fieldName !== 'value') {
        return null;
      }

      const block = getBlock(field.blockId);
      if (!block) return null;

      return ({
        name: `fields['${field.blockId}'].value`,
        label: `${block.name || field.blockId}.${field.fieldName}`,
        blockId: field.blockId,
        fieldName: field.fieldName,
      })
    }).filter((fields) => fields !== null);
  }, [fieldStates]);

  const operators = [
    { name: Operator.EQUAL, label: 'is' },
    { name: Operator.NOT_EQUAL, label: 'is not' },
  ];

  // Get value options for a field
  const getValueOptions = (fieldName?: string) => {
    if (!fieldName) return [];
    const field = fields.find(f => f.name === fieldName);
    if (!field) return [];

    const { blockId, fieldName: name } = field;
    const hooks = hookUsage[blockId] || [];
    const fieldHook = hooks.find(hook => hook.name === name);

    if (fieldHook && fieldHook.type === 'enumeration' && Array.isArray(fieldHook.options)) {
      return fieldHook.options.map(opt => ({
        name: opt as string,
        label: (fieldHook.labels as Record<string, string>)?.[opt as string] || opt,
      }));
    }

    if (fieldHook && fieldHook.type === 'jsonSchema') {
      return fieldHook.items?.map(opt => ({
        name: opt.key,
        label: opt.label,
      })) || [];
    }

    if (fieldHook && fieldHook.type === 'boolean') {
      return [
        { name: 'true', label: 'True' },
        { name: 'false', label: 'False' },
      ];
    }

    return [];
  };

  const handleQueryChange = (queryRules: RuleGroupType) => {
    setQuery(queryRules);

    // Convert back to our format and trigger onChange
    const updatedRuleGroup = mapQueryBuilderToRuleGroup(queryRules, action);
    onChange(updatedRuleGroup);
  };

  const handleActionChange = (newAction: string) => {
    setAction(newAction);

    // Update the rule group with the new action
    if (query.rules.length > 0) {
      const updatedRuleGroup = mapQueryBuilderToRuleGroup(query, newAction);
      onChange(updatedRuleGroup);
    }
  };

  const CustomValueEditor = (props: any) => {
    const valueOptions = getValueOptions(props.field);
    const [localValue, setLocalValue] = useState(props.value || '');
    const debouncedValue = useDebounce(localValue, 500);

    useEffect(() => {
      if (debouncedValue !== props.value) {
        props.handleOnChange(debouncedValue);
      }
    }, [debouncedValue, props.handleOnChange]);

    useEffect(() => {
      if (props.value !== localValue) {
        setLocalValue(props.value || '');
      }
    }, [props.value]);

    if (valueOptions.length === 0) {
      return (
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter value..."
        />
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-32 flex-shrink-0 justify-between"
          >
            <span className="truncate">
              {valueOptions.find(op => op.name === localValue)?.label || 'Select value'}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {valueOptions.map(option => (
            <DropdownMenuItem
              key={option.name}
              onClick={() => setLocalValue(option.name)}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const CustomRemoveRuleAction = (props: any) => {
    return (
      <Button
        {...props}
        variant="ghost"
        size="icon"
        className="hover:bg-transparent hover:text-red-500 border-none ml-2"
        aria-label="Delete action"
        onClick={props.handleOnClick}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    );
  };

  const CustomAddRuleAction = (props: any) => {
    return (
      <Button
        {...props}
        variant="outline"
        className="cursor-pointer"
        onClick={props.handleOnClick}>
        {props.title}
      </Button>
    );
  };

  const CustomFieldSelector = (props: any) => {
    const fieldOptions = fields.map(field => ({
      value: field.name,
      label: field.label
    }));

    return (
      <Combobox
        items={fieldOptions}
        selected={props.value}
        onSelect={(value) => props.handleOnChange(value as string)}
        placeholder="Select field"
        className="max-w-[150px]"
        popoverClassName="!w-full"
      />
    );
  };

  const CustomOperatorSelector = (props: any) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-20 justify-between"
          >
            <span className="truncate">
              {operators.find(op => op.name === props.value)?.label || 'Operator'}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {operators.map(operator => (
            <DropdownMenuItem
              key={operator.name}
              onClick={() => props.handleOnChange(operator.name)}
            >
              {operator.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const CustomCombinatorSelector = (props: any) => {
    const combinators = [
      { name: 'and', label: 'AND' },
      { name: 'or', label: 'OR' }
    ];

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-24 justify-between"
          >
            <span className="truncate">
              {combinators.find(c => c.name === props.value)?.label || 'Combinator'}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {combinators.map(combinator => (
            <DropdownMenuItem
              key={combinator.name}
              onClick={() => props.handleOnChange(combinator.name)}
            >
              {combinator.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const conditionCount = countRules(value);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerComponent}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        {showLabel && (
          <div className="mb-2">
            <Label className="block">{labelText}</Label>
          </div>
        )}

        <div className="overflow-y-auto overflow-x-hidden flex-1">
          <QueryBuilder
            fields={fields}
            operators={operators}
            query={query}
            onQueryChange={handleQueryChange}
            controlElements={{
              valueEditor: CustomValueEditor,
              removeGroupAction: CustomRemoveRuleAction,
              removeRuleAction: CustomRemoveRuleAction,
              addGroupAction: CustomAddRuleAction,
              addRuleAction: CustomAddRuleAction,
              fieldSelector: CustomFieldSelector,
              operatorSelector: CustomOperatorSelector,
              combinatorSelector: CustomCombinatorSelector,
            }}
            controlClassnames={{
              queryBuilder: "p-2 border rounded-md bg-white queryBuilder-branches",
              ruleGroup: "p-3 rounded-md mb-3",
              combinators: "w-24",
              fields: "min-w-[120px]",
              operators: "w-20",
            }}
          />
        </div>

        <div className="mt-4">
          <div className="flex flex-row gap-2 items-center p-4 border rounded-md">
            <span className="text-sm font-medium">Then</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-32">
                  {actionOptions.find(opt => opt.value === action)?.label || 'Action...'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {actionOptions.map(opt => (
                  <DropdownMenuItem key={opt.value} onClick={() => handleActionChange(opt.value)}>
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline" className="w-full">Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
