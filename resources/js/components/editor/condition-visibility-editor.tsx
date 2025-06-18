import React from 'react';
import { FieldsConditionEditor, RuleGroup } from './fields-condition-editor';
import { Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

const ACTION_OPTIONS = [
  { value: 'show', label: 'Show' },
  { value: 'hide', label: 'Hide' },
];

export const AddVisibilityCondition: React.FC<{
  value: RuleGroup | null,
  onChange: (value: RuleGroup) => void
}> = ({ value, onChange }) => {
  return (
    <FieldsConditionEditor
      value={value}
      onChange={onChange}
      actionOptions={ACTION_OPTIONS}
      dialogTitle="Edit Visibility Conditions"
      showLabel={true}
      labelText="Visibility Conditions"
      triggerComponent={
        <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
          <Eye className="w-4 h-4" />
          Visibility
          {value && value.rules?.length && value.rules.length > 0 && (
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              {value.rules.length}
            </Badge>
          )}
        </Button>
      }
    />
  );
};

export const ConditionVisibilityEditor = ({ value, onChange }: { value: RuleGroup | null, onChange: (value: RuleGroup) => void }) => {
  return <AddVisibilityCondition value={value} onChange={onChange} />;
};
