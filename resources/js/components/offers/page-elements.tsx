import React, { useState } from 'react';
import { blockTypes } from '@/components/blocks';
import {
  CreditCard,
  LayoutPanelLeft,
  SquareCheck,
  ImageIcon,
  ShoppingCartIcon,
  SquareMousePointer,
  LetterTextIcon,
  QuoteIcon,
  Columns2Icon,
  TextCursorInputIcon,
  LinkIcon,
  PlusIcon,
  HeadingIcon, SquareChartGanttIcon,
  ListIcon,
  Minus,
  FlameIcon,
  BookmarkIcon,
  Star,
  CodeIcon,
  Package
} from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import SearchBar from './search-bar';
import { ReusableBlocksGrid } from './reusable-blocks-grid';
import { Button } from '@/components/ui/button';
import cx from 'classnames';

interface CustomElementIconProps {
  type: keyof typeof blockTypes;
}

export const CustomElementIcon = ({ type }: CustomElementIconProps) => {
  switch(type) {
    case 'text':
        return <LetterTextIcon className="w-6 h-6" />;
    case 'quote':
        return <QuoteIcon className="w-6 h-6" />;
    case 'detail_list':
        return <LayoutPanelLeft className="w-6 h-6" />;
    case 'button':
        return <SquareMousePointer className="w-6 h-6" />;
    case 'html':
        return <CodeIcon className="w-6 h-6" />;
    case 'link':
        return <LinkIcon className="w-6 h-6" />;
    case 'checkbox':
        return <SquareCheck className="w-6 h-6" />;
    case 'option_selector':
        return <Columns2Icon className="w-6 h-6 inline-block" />;
    case 'detail_timeline':
        return <SquareChartGanttIcon className="w-6 h-6" />;
    case 'text_input':
        return <TextCursorInputIcon className="w-6 h-6" />;
    case 'image':
      return <ImageIcon className="w-6 h-6" />;
    case 'payment_method':
      return <CreditCard className="w-6 h-6"/>;
    case 'checkout_summary':
        return <ShoppingCartIcon className="w-6 h-6" />;
    case 'radio_list':
        return <ListIcon className="w-6 h-6" />;
    case 'add_on':
        return <PlusIcon className="w-6 h-6" />;
    case 'heading':
        return <HeadingIcon className="w-6 h-6" />;
    case 'divider':
        return <Minus className="w-6 h-6" />;
    case 'rating':
        return <Star className="w-6 h-6" />;
    case 'vertical_products':
        return <Package className="w-6 h-6" />;
    case 'horizontal_products':
        return <Package className="w-6 h-6" />;
    default:
        return null;
  }
};

// BlockTemplateItem component with revamped UI for card style
interface BlockItemProps {
  blockType: string;
  title: string;
  color: string;
}

const BlockTemplateItem = ({ blockType, title, color }: BlockItemProps) => {

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
      <div className={`flex items-center justify-center rounded-md w-full h-14 mb-2 ${color}`}>
        <span className="">
          <CustomElementIcon type={blockType as keyof typeof blockTypes} />
        </span>
      </div>
      <div className=" whitespace-nowrap font-bold text-sm">{title}</div>
    </div>
  );
};

// Mapping for block elements
const baseElements = [
  { type: 'text', title: 'Text Block' },
  { type: 'quote', title: 'Quote' },
  { type: 'detail_list', title: 'Detail List' },
  { type: 'image', title: 'Image Block' },
  { type: 'heading', title: 'Heading' },
  { type: 'divider', title: 'Divider' },
  { type: 'rating', title: 'Rating' },
  { type: 'html', title: 'HTML Block' },
];

const interactiveElements = [
  { type: 'button', title: 'Button' },
  { type: 'link', title: 'Link' },
  { type: 'checkbox', title: 'Checkbox' },
  { type: 'detail_timeline', title: 'Timeline' },
  { type: 'option_selector', title: 'Option Slide' },
  { type: 'radio_list', title: 'Radio List' },
  { type: 'text_input', title: 'Entry Field' },
  { type: 'vertical_products', title: 'Product Selector' },
  { type: 'horizontal_products', title: 'Product Cards' },
];

const paymentElements = [
  { type: 'checkout_summary', title: 'Order Info' },
  { type: 'payment_method', title: 'Payment Form' },
  { type: 'add_on', title: 'Add On' },
];

const elementColors = {
  base: 'bg-blue-200 text-blue-900 border border-blue-300',
  interactive: 'bg-purple-200 text-purple-900 border border-purple-300',
  payment: 'bg-green-200 text-green-900 border border-green-300',
}

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
    <div className="flex flex-col gap-4 mb-4 border-b pb-6">
      <h3 className="text-sm text-black/60 font-medium">{title}</h3>
      <div className="grid grid-cols-3 gap-x-2 gap-y-3">
        {children}
      </div>
    </div>
  );
};

export const PageElements: React.FC = () => {
  const [elementSearchQuery, setElementSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'templates' | 'reusable'>('templates');

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

  const renderTemplates = () => (
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
                color={elementColors.base}
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
                color={elementColors.interactive}
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
                  color={elementColors.payment}
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

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-border px-4 pt-4">
        <Button
          variant={activeTab === 'templates' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('templates')}
          className="rounded-b-none h-8 px-3"
        >
          <FlameIcon className="w-4 h-4 mr-2" />
          Templates
        </Button>
        <Button
          variant={activeTab === 'reusable' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('reusable')}
          className="rounded-b-none h-8 px-3"
        >
          <BookmarkIcon className="w-4 h-4 mr-2" />
          Reusable Blocks
        </Button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'templates' ? renderTemplates() : <ReusableBlocksGrid />}
      </div>
    </div>
  );
}
