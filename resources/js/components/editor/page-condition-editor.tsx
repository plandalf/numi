import React from 'react';
import { FieldsConditionEditor, RuleGroup, countRules } from './fields-condition-editor';
import { Badge } from '../ui/badge';

const ACTION_OPTIONS = [
  { value: 'show', label: 'Show' },
];

export const PageConditionEditor = ({ value, onChange }: { value: RuleGroup | null, onChange: (value: RuleGroup) => void }) => {
  const conditionCount = countRules(value);
  return (
    <FieldsConditionEditor
      value={value}
      onChange={onChange}
      actionOptions={ACTION_OPTIONS}
      dialogTitle="Page Conditions"
      triggerComponent={
        <div className="cursor-pointer hover:text-black/50 mr-2">
          <span className="text-muted-foreground flex items-center gap-2">
            {conditionCount > 0 && (
              <Badge variant="default" className="text-xs">
                {conditionCount}
              </Badge>
            )}
            <span className="text-xs">
              {conditionCount > 0 ? 'Edit conditions' : 'Add conditions'}
            </span>
          </span>
        </div>
      }
    />
  );
};
