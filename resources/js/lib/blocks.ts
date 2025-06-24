import { RuleGroup, VisibilityRule } from '@/components/editor/condition-visibility-editor';
import get from 'lodash/get';


export const hasVisibilityCondition = (visibility?: boolean | { conditional: RuleGroup }) => {

  if (typeof visibility === 'undefined') return false;

  if(typeof visibility === 'boolean') return true;

  return typeof visibility === 'object' && 'conditional' in visibility && visibility.conditional.rules.length > 0;
};

export const isEvaluatedVisible = (
  context: Record<string, unknown>,
  visibility?: boolean | { conditional: RuleGroup }
) => {
  if (typeof visibility === 'undefined' || visibility === true) return true;

  if (visibility === false) return false;

  // Handle conditional visibility
  if (typeof visibility === 'object' && 'conditional' in visibility) {
    const condition = visibility.conditional;

    if(condition.rules.length === 0 || Object.keys(context.fields ?? {}).length === 0) return true;
    // console.log('condition-visibility', condition, context);

    try {
      const result = evaluateRuleGroup(condition, context);
      // Evaluate the rule group
      return result;
    } catch (e) {
      console.log('Visibility evaluation error:', { visibility, context }, e);
      return false;
    }
  }

  return false;
};

/**
 * Evaluates a single rule group against the given context
 */
const evaluateRuleGroup = (group: RuleGroup, context: Record<string, unknown>): boolean => {
  if (!group.rules || group.rules.length === 0) return true;

  const isAnd = group.combinator === 'and';

  // Use every for AND logic (all must pass) or some for OR logic (at least one must pass)
  return isAnd
    ? group.rules.every(rule => evaluateRule(rule, context))
    : group.rules.some(rule => evaluateRule(rule, context));
};

/**
 * Evaluates a rule or nested rule group against the given context
 */
const evaluateRule = (
  rule: VisibilityRule | RuleGroup,
  context: Record<string, unknown>
): boolean => {
  // If it's a nested rule group
  if ('combinator' in rule && 'rules' in rule) {
    return evaluateRuleGroup(rule, context);
  }

  // It's a simple rule
  const criteria = (rule as VisibilityRule).field;
  const operator = (rule as VisibilityRule).operator;
  const expectedValue = (rule as VisibilityRule).value;

  const actualValue = get(context, criteria);

  // If no value found, the condition fails
  if (actualValue === undefined) return false;

  // Compare based on operator
  switch (operator) {
    case 'eq':
      return String(actualValue) === String(expectedValue);
    case 'neq':
      return String(actualValue) !== String(expectedValue);
    default:
      return false;
  }
};