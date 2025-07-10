import ButtonBlockComponent from "./ButtonBlock";
import CheckboxBlockComponent from "./CheckboxBlock";
import CheckoutSummaryComponent from "./CheckoutSummaryBlock";
import DetailListBlockComponent from "./DetailListComponent";
import OptionSelectorComponent from "./OptionSelectorBlock";
import PaymentMethodBlock from "./PaymentMethodBlock";
import PlanDescriptorComponent from "./PlanDescriptorBlock";
import QuoteBlockComponent from "./QuoteBlock";
import TextBlockComponent from "./TextBlock";
import TextInputBlockComponent from "./TextInputBlock";
import ImageBlockComponent from '@/components/blocks/ImageBlock';
import LinkBlockComponent from "./LinkBlock";
import AddOnBlockComponent from "./AddOnBlock";
import HeadingBlockComponent from "./HeadingBlock";
import DetailTimelineBlock from '@/components/blocks/DetailTimelineBlock';
import RadioListBlock from "./RadioListBlock";
import DividerBlockComponent from "./DividerBlock";
import RatingBlockComponent from "./RatingBlock";

export const blockTypes = {
  text: TextBlockComponent,
  checkbox: CheckboxBlockComponent,
  text_input: TextInputBlockComponent,
  detail_list: DetailListBlockComponent,
  detail_timeline: DetailTimelineBlock,
  button: ButtonBlockComponent,
  link: LinkBlockComponent,
  image: ImageBlockComponent,
  quote: QuoteBlockComponent,
  option_selector: OptionSelectorComponent,
  radio_list: RadioListBlock,
  rating: RatingBlockComponent,
  checkout_summary: CheckoutSummaryComponent,
  add_on: AddOnBlockComponent,
  payment_method: PaymentMethodBlock,
  plan_descriptor: PlanDescriptorComponent,
  heading: HeadingBlockComponent,
  divider: DividerBlockComponent,
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
  detail_timeline: {
    id: 'detail_timeline',
    title: 'Detail Timeline Block',
    icon: '📅',
    description: 'A block for displaying timeline information.',
  },
  button: {
    id: 'button',
    title: 'Button Block',
    icon: '🔘',
    description: 'A block for actions and triggers.',
  },
  link: {
    id: 'link',
    title: 'Link Block',
    icon: '🔗',
    description: 'A block for clickable links.',
  },
  image: {
    id: 'image',
    title: 'Image Block',
    icon: '🔘',
    description: 'Add custom images to your checkout',
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
  add_on: {
    id: 'add_on',
    title: 'Add On Block',
    icon: '➕',
    description: 'A block for additional options or add-ons.',
  },
  payment_method: {
    id: 'payment_method',
    title: 'Payment Method Block',
    icon: '💳',
    description: 'A block for displaying Stripe payment elements.',
  },
  plan_descriptor: {
    id: 'plan_descriptor',
    title: 'Plan Descriptor Block',
    icon: '📋',
    description: 'A block for displaying plan descriptions and details.',
  },
  heading: {
    id: 'heading',
    title: 'Heading Block',
    icon: '📝',
    description: 'A block for displaying headings and titles.',
  },
  divider: {
    id: 'divider',
    title: 'Divider Block',
    icon: '➖',
    description: 'A block for visual separation.',
  },
  radio_list: {
    id: 'radio_list',
    title: 'Radio List Block',
    icon: '🔘',
    description: 'A block for displaying a list of radio options.',
  },
  rating: {
    id: 'rating',
    title: 'Rating Block',
    icon: '⭐',
    description: 'A block for star-based rating selection.',
  },
};

/**
 * Get static metadata for a block type by key.
 * Usage: const meta = getBlockMeta('text');
 */
export function getBlockMeta(blockKey: keyof typeof blockTypes): BlockMeta | undefined {
  return blockMetas[blockKey];
}

// note: information/context about each type
