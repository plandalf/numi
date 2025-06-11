import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '../ui/dialog';
import { CircleAlert, MousePointerClick, Trash2 } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { EditProps } from '@/pages/offers/edit';
import { Combobox } from '../combobox';
import SetItemAction, { SetItemActionValue } from '../actions/set-item-action';
import { Separator } from '../ui/separator';
import RedirectToUrl from '../actions/redirect-to-url';

const ACTION_OPTIONS = [
  { value: 'changeLineItemPrice', label: 'Change line item price' },
  { value: 'setLineItemQuantity', label: 'Set line item quantity' },
  { value: 'deactivateLineItem', label: 'Deactivate line item' },
  { value: 'activateLineItem', label: 'Activate line item' },
  { value: 'setItem', label: 'Set line item (advanced)' },
  { value: 'redirect', label: 'Redirect to URL' },
];

export enum Event {
  onClick = 'onClick',
  onSelect = 'onSelect',
  onUnSelect = 'onUnSelect',
}

export const EVENT_LABEL_MAP = {
  [Event.onClick]: 'Add On Click Action',
  [Event.onSelect]: 'Choose Select/Unselect Action',
  [Event.onUnSelect]: 'Choose Select/Unselect Action',
}

export const EVENTS = [
  {
    value: Event.onClick,
    label: 'On Click'
  },
  {
    value: Event.onSelect,
    label: 'On Select'
  },
  {
    value: Event.onUnSelect,
    label: 'On Unselect'
  },
]
type EventValue = SetItemActionValue | string;
export interface EventAction {
  event: Event;
  action: string;
  element: string;
  value: EventValue;
}

export type GroupedEventActions = {
  [key in Event]?: EventAction[];
};

interface ActionEditorProps {
  label: string;
  value: GroupedEventActions;
  onChange: (value: GroupedEventActions) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  elementOptions?: Record<'value' | 'label', string>[];
  events?: Record<'value' | 'label', string>[];
  event?: Event;
  required?: boolean;
}

interface ActionSelectorProps {
  action: string;
  value: EventValue;
  onChange: (value: EventValue) => void;
}

function ActionSelector({ action, value, onChange }: ActionSelectorProps) {
  switch (action) {
    case 'setLineItemQuantity':
    case 'changeLineItemPrice':
    case 'deactivateLineItem':
    case 'activateLineItem':
    case 'setItem':
      return <SetItemAction value={value as SetItemActionValue} onChange={onChange} action={action} />;
    case 'redirect':
      return <RedirectToUrl value={value as string} onChange={onChange} />;
    default:
      return null;
  }
}

export const AddActionDialog: React.FC<ActionEditorProps> = ({ label, value, onChange, open, onOpenChange, elementOptions, events }) => {
  const getDefaultElement = () => {
    if (elementOptions && elementOptions.length === 1) return elementOptions[0].value;

    return '';
  };

  const emptyAction: EventAction = { event: events?.[0]?.value as Event || Event.onClick, action: '', element: getDefaultElement(), value: '' };

  // Flatten the grouped actions into an array for the dialog
  const flattenedActions = Object.values(value || {}).flat().filter(v => v);
  const defaultValue = flattenedActions.length > 0
    ? flattenedActions.map(v => ({
      ...v,
      event: v.event || events?.[0]?.value || Event.onClick,
      action: v.action,
      element: elementOptions?.some(opt => opt.value === v.element) ? v.element : getDefaultElement()
    }))
    : [emptyAction];

  const [actions, setActions] = useState<EventAction[]>(defaultValue);

  const handleFieldChange = (idx: number, field: keyof EventAction, fieldValue: EventValue) => {
    const updated = actions.map((item, i) =>
      i === idx ? { ...item, [field]: fieldValue } : item
    );

    setActions(updated);
  };

  const handleAdd = () => {
    const updated = [...actions, emptyAction];
    setActions(updated);
  };

  const handleDelete = (idx: number) => {
    const updated = actions.filter((_, i) => i !== idx);
    setActions(updated);
  };

  const handleSave = () => {
    // Group actions by event
    const groupedActions = actions.reduce((acc, action) => {
      const event = action.event;
      if (!acc[event]) {
        acc[event] = [];
      }
      acc[event].push(action);
      return acc;
    }, {} as GroupedEventActions);

    // Ensure all events have at least an empty array
    const eventsWithEmptyArrays = (events || EVENTS).reduce((acc, event) => {
      acc[event.value as Event] = groupedActions[event.value as Event] || [];
      return acc;
    }, {} as GroupedEventActions);

    onChange(eventsWithEmptyArrays);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:min-w-[600px] flex flex-col max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Edit {label} Actions</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto pr-2">
          {actions.map((act, idx) => (
            <div key={idx} className="flex flex-col items-center ">
              <div className="flex flex-col border-b gap-2 p-4 mb-4 bg-[#F7F9FF] w-full rounded-md border">
                <div className="flex flex-row justify-between w-full">
                  <div className="flex flex-row flex-wrap gap-2 items-center w-full">
                    <Combobox
                      items={events ?? []}
                      selected={act.event}
                      className="flex-1 min-w-[200px]"
                      onSelect={(selected) => handleFieldChange(idx, 'event', selected as Event)}
                      placeholder="Event..."
                      hideSearch
                      disabled={events?.length === 1}
                    />
                    <Combobox
                      items={elementOptions ?? []}
                      selected={act.element}
                      className="flex-1 min-w-[200px]"
                      onSelect={(selected) => handleFieldChange(idx, 'element', selected as string)}
                      placeholder="Element..."
                      hideSearch
                      disabled={elementOptions?.length === 1}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 shrink-0"
                    onClick={() => handleDelete(idx)}
                    aria-label="Delete action"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Separator className="w-full" />
                <div className="flex flex-row gap-4 items-center w-full">
                  <Label className="text-sm w-16">Action</Label>
                  <Combobox
                    items={ACTION_OPTIONS}
                    selected={act.action}
                    className="w-[300px]"
                    onSelect={(selected) => handleFieldChange(idx, 'action', selected as string)}
                    placeholder="Action..."
                    hideSearch
                  />
                </div>
                <Separator className="w-full" />
                <div className="flex flex-col gap-2 items-center w-full">
                  <ActionSelector
                    action={act.action}
                    value={act.value}
                    onChange={(value) => handleFieldChange(idx, 'value', value)}
                  />
                </div>
              </div>
            </div>
          ))}
          <Button variant="secondary" onClick={handleAdd} className="mt-2">Add another action</Button>
        </div>
        <DialogClose asChild>
          <Button variant="outline" className="mt-4 w-full" onClick={handleSave}>Save</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

type InteractionEventEditorProps = Pick<ActionEditorProps, 'label' | 'value' | 'onChange' | 'elementOptions' | 'events' | 'required'>;

export const InteractionEventEditor: React.FC<InteractionEventEditorProps> = ({ label, value, onChange, elementOptions, events = EVENTS, required }) => {
  const [open, setOpen] = useState(false);

  const { offer } = usePage<EditProps>().props;

  const getActionDescription = (action: EventAction) => {
    if (!action.action) return null;

    if (action.action === 'setItem') {
      if (action.value) {
        const value = action.value as SetItemActionValue;
        const item = offer.items.find(i => i.id.toString() === value.item);
        if (item) {
          return `${action.element}: Set ${item.name} to ${value.price}`;
        }
        return `Set line item to ${value.price}`;
      } else if (action.element) {
        const element = elementOptions?.find(e => e.value === action.element);
        if (element) {
          return `You need to set ${element.label} a line item`;
        }
      }

      return 'Set line item';
    }

    if (action.action === 'other_action') {
      return 'Other action';
    }

    return action.action;
  };

  const handleOnItemClick = (event: Event, index: number, action: EventAction) => {
    setOpen(true);
  }

  const handleOnDialogChange = (open: boolean) => {
    setOpen(open);
  }

  const handleOnSave = (groupedActions: GroupedEventActions) => {
    onChange(groupedActions);
    handleOnDialogChange(false);
  }

  const handleOnCreate = () => {
    setOpen(true);
  }

  return (
    <div className='flex flex-col gap-2'>
      {Object.entries(value || {}).map(([event, actions]) => (
        <div key={event} className="mb-4">
          {events.length > 1 && <h3 className="text-sm font-semibold mb-2">{events?.find(e => e.value === event)?.label}</h3>}
          <div className="space-y-1">
            {required && actions.length === 0 && <div className="flex gap-3 border border-destructive text-destructive rounded-md p-4 mt-3.5">
              <CircleAlert className="w-5 h-5 mt-0.5" />
              <div className="flex gap-1 flex-col">
                <div className="font-medium">
                  No actions found.
                </div>
                <div className="">
                  You ned to add at least 1 action to this event
                </div>
              </div>
            </div>}
            {actions.map((action, index) => {
              if (!action) return null;
              const description = getActionDescription(action);
              return description ? (
                <div
                  key={index}
                  className="text-sm text-gray-700 p-1 hover:bg-gray-200 bg-gray-100 rounded-sm border p-2 cursor-pointer"
                  onClick={() => handleOnItemClick(event as Event, index, action)}
                >
                  {description}
                </div>
              ) : null;
            })}
          </div>
        </div>
      ))}
      <Button variant="secondary" className="w-full bg-gray-900 text-white hover:bg-gray-800" onClick={handleOnCreate}>
        <MousePointerClick className="w-4 h-4" />
        {label}
      </Button>
      {open && <AddActionDialog
        label={label}
        value={value || {}}
        elementOptions={elementOptions}
        onChange={handleOnSave}
        events={events}
        open
        onOpenChange={handleOnDialogChange} />}
    </div>
  );
};
