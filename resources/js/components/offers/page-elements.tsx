import React, { useState } from 'react';
import { blockTypes } from '@/components/blocks';
import {
  SquareStack,
  CreditCard,
  LayoutPanelLeft,
  MessageSquare,
  AlignLeft,
  ArrowLeft,
  SquareCheck,
  FormInput,
} from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import SearchBar from './search-bar';
import cx from 'classnames';

interface CustomElementIconProps {
  type: keyof typeof blockTypes;
}

export const CustomElementIcon = ({ type }: CustomElementIconProps) => {
  switch(type) {
    case 'text':
        return <AlignLeft className="w-6 h-6" />;
    case 'quote':
        return <MessageSquare className="w-6 h-6" />;
    case 'detail_list':
        return <LayoutPanelLeft className="w-6 h-6" />;
    case 'button':
        return <SquareStack className="w-6 h-6" />;
    case 'checkbox':
        return <SquareCheck className="w-6 h-6" />;
    case 'option_selector':
        return <ArrowLeft className="w-6 h-6 inline-block" />;
    case 'text_input':
        return <FormInput className="w-6 h-6" />;
    case 'checkout_summary':
        return <CreditCard className="w-6 h-6" />;
    default:
        return null;
  }
};

// BlockTemplateItem component with revamped UI for card style
interface BlockItemProps {
  blockType: string;
  title: string;
}

const BlockTemplateItem = ({ blockType, title }: BlockItemProps) => {

  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: `template:${blockType}`,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cx({
        "flex flex-col items-center justify-center rounded-md cursor-move transition-all min-h-20 w-full": true,
        "opacity-60": isDragging,
      })}
    >
      <div className="flex items-center justify-center bg-slate-800 rounded-md w-full h-14 mb-2">
        <span className="text-white">
          <CustomElementIcon type={blockType as keyof typeof blockTypes} />
        </span>
      </div>
      <span className="text-sm text-black">{title}</span>
    </div>
  );
};

// Mapping for block elements
const baseElements = [
  { type: 'text', title: 'Text Block' },
  { type: 'quote', title: 'Quote' },
  { type: 'detail_list', title: 'Detail List' },
];

const interactiveElements = [
  { type: 'button', title: 'Button' },
  { type: 'checkbox', title: 'Checkbox' },
  { type: 'option_selector', title: 'Option Slide' },
  { type: 'text_input', title: 'Entry Field' },
];

const paymentElements = [
  { type: 'checkout_summary', title: 'Payment' },
];

export const allElementTypes = [
  ...baseElements,
  ...interactiveElements,
  ...paymentElements,
];

// Category section component
interface ElementCategoryProps {
  title: string;
  children: React.ReactNode;
}

const ElementCategory = ({ title, children }: ElementCategoryProps) => {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <h3 className="text-sm text-black/50 font-light">{title}</h3>
      <div className="grid grid-cols-3 gap-2">
        {children}
      </div>
    </div>
  );
};

export const PageElements: React.FC = () => {
  const [elementSearchQuery, setElementSearchQuery] = useState('');

  // Filter elements based on search query
  const filteredBaseElements = baseElements.filter(element =>
    element.title.toLowerCase().includes(elementSearchQuery.toLowerCase()) ||
    element.type.toLowerCase().includes(elementSearchQuery.toLowerCase())
  );

  const filteredInteractiveElements = interactiveElements.filter(element =>
    element.title.toLowerCase().includes(elementSearchQuery.toLowerCase()) ||
    element.type.toLowerCase().includes(elementSearchQuery.toLowerCase())
  );

  const filteredPaymentElements = paymentElements.filter(element =>
    element.title.toLowerCase().includes(elementSearchQuery.toLowerCase()) ||
    element.type.toLowerCase().includes(elementSearchQuery.toLowerCase())
  );

  // Check if any category has elements after filtering
  const hasBaseElements = filteredBaseElements.length > 0;
  const hasInteractiveElements = filteredInteractiveElements.length > 0;
  const hasPaymentElements = filteredPaymentElements.length > 0;

  return (
    <div className="p-4 space-y-6 overflow-y-auto">
      <SearchBar
        placeholder="Search for elements"
        value={elementSearchQuery}
        onChange={setElementSearchQuery}
      />
      {elementSearchQuery && !hasBaseElements && !hasInteractiveElements && !hasPaymentElements ? (
        <div className="text-center py-8 text-muted-foreground">
          No elements found matching "{elementSearchQuery}"
        </div>
      ) : (
      <>
        {(hasBaseElements || !elementSearchQuery) && (
          <ElementCategory title="Base Elements">
            {filteredBaseElements.map((element) => (
              <BlockTemplateItem
                key={element.type}
                blockType={element.type}
                title={element.title}
              />
            ))}
          </ElementCategory>
        )}

        {(hasInteractiveElements || !elementSearchQuery) && (
          <ElementCategory title="Interactive Elements">
            {filteredInteractiveElements.map((element) => (
              <BlockTemplateItem
                key={element.type}
                blockType={element.type}
                title={element.title}
              />
            ))}
          </ElementCategory>
        )}

        {(hasPaymentElements || !elementSearchQuery) && (
          <ElementCategory title="Payments">
            {filteredPaymentElements.map((element) => (
              <BlockTemplateItem
                  key={element.type}
                  blockType={element.type}
                  title={element.title}
              />
            ))}
          </ElementCategory>
        )}
        </>
      )}
    </div>
  );
}
