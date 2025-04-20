import ButtonBlockComponent from "./ButtonBlock";
import CheckboxBlockComponent from "./CheckboxBlock";
import CheckoutSummaryComponent from "./CheckoutSummaryBlock";
import DetailListBlockComponent from "./DetailListComponent";
import OptionSelectorComponent from "./OptionSelectorBlock";
import QuoteBlockComponent from "./QuoteBlock";
import TextBlockComponent from "./TextBlock";
import TextInputBlockComponent from "./TextInputBlock";

export const blockTypes = {
  text: TextBlockComponent,
  checkbox: CheckboxBlockComponent,
  text_input: TextInputBlockComponent,
  detail_list: DetailListBlockComponent,
  button: ButtonBlockComponent,
  quote: QuoteBlockComponent,
  option_selector: OptionSelectorComponent, 
  checkout_summary: CheckoutSummaryComponent,
}

type BlockMeta = {
  id: string;
  title: string;
  icon?: string;
  description?: string;
}

export const blockMetas: Record<keyof typeof blockTypes, BlockMeta> = {
  text: {
    id: 'text',
    title: 'Text Block',
    icon: '📝',
    description: 'A block for displaying rich text or markdown content.',
  },
  checkbox: {
    id: 'checkbox',
    title: 'Checkbox Block',
    icon: '☑️',
    description: 'A block for boolean input.',
  },
  text_input: {
    id: 'text_input',
    title: 'Text Input Block',
    icon: '🔤',
    description: 'A block for single-line text input.',
  },
  detail_list: {
    id: 'detail_list',
    title: 'Detail List Block',
    icon: '📋',
    description: 'A block for displaying a list of details.',
  },
  button: {
    id: 'button',
    title: 'Button Block',
    icon: '🔘',
    description: 'A block for actions and triggers.',
  },
  quote: {
    id: 'quote',
    title: 'Quote Block',
    icon: '❝',
    description: 'A block for displaying quotes or callouts.',
  },
  option_selector: {
    id: 'option_selector',
    title: 'Option Selector Block',
    icon: '🔽',
    description: 'A block for selecting from multiple options.',
  },
  checkout_summary: {
    id: 'checkout_summary',
    title: 'Checkout Summary Block',
    icon: '🧾',
    description: 'A block for displaying checkout/order summary.',
  },
};

/**
 * Get static metadata for a block type by key.
 * Usage: const meta = getBlockMeta('text');
 */
export function getBlockMeta(blockKey: keyof typeof blockTypes): BlockMeta | undefined {
  // console.log('blockMetas', blockMetas, blockKey);
  return blockMetas[blockKey];
}

// note: information/context about each type
