import { Label } from '../ui/label';
import React, { useContext, useMemo } from 'react';
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
import { GlobalStateContext } from '@/pages/checkout-main';
import { QueryBuilder, RuleGroupType } from 'react-querybuilder';
import 'react-querybuilder/dist/query-builder.css';
import { Trash2, ChevronDown, Eye } from 'lucide-react';
import { Combobox } from '../combobox';
import { Badge } from '../ui/badge';

const ACTION_OPTIONS = [
  { value: 'show', label: 'Show' },
  { value: 'hide', label: 'Hide' },
];

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
const countRules = (ruleGroup: RuleGroup | null): number => {
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

export const AddVisibilityCondition: React.FC<{
  value: RuleGroup | null,
  onChange: (value: RuleGroup) => void
}> = ({ value, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const [action, setAction] = React.useState<string>(value?.action || 'show');

  // Convert our rule group to QueryBuilder format
  const [query, setQuery] = React.useState<RuleGroupType>(
    mapRuleGroupToQueryBuilderFormat(value)
  );

  const context = useContext(GlobalStateContext);
  const fieldStates = context?.fieldStates ?? {};
  const hookUsage = context?.hookUsage ?? {};

  console.log('query', query, context);

  const fields = useMemo(() => {
    return Object.values(fieldStates).map(field => ({
      name: `fields['${field.blockId}'].value`,
      label: `${field.blockId}.${field.fieldName}`,
      blockId: field.blockId,
      fieldName: field.fieldName,
    }));
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
        name: opt,
        label: fieldHook.labels?.[opt] || opt,
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

    return [
      { name: true, label: 'Active' },
      { name: false, label: 'Inactive' },
    ];
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

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-32 flex-shrink-0 justify-between"
          >
            <span className="truncate">
              {valueOptions.find(op => op.name === props.value)?.label || 'Select value'}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {valueOptions.map(option => (
            <DropdownMenuItem
              key={option.name}
              onClick={() => props.handleOnChange(option.name)}
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

  // Count the number of conditions
  const conditionCount = countRules(value);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
          <Eye className="w-4 h-4" />
          Visibility
          {conditionCount > 0 && (
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              {conditionCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Visibility Conditions</DialogTitle>
        </DialogHeader>

        <div className="mb-2">
          <Label className="block">Visibility Conditions</Label>
        </div>

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
                  {ACTION_OPTIONS.find(opt => opt.value === action)?.label || 'Action...'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {ACTION_OPTIONS.map(opt => (
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

export const ConditionVisibilityEditor = ({ value, onChange }: { value: RuleGroup | null, onChange: (value: RuleGroup) => void }) => {
  return <AddVisibilityCondition value={value} onChange={onChange} />;
};
