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
import HtmlBlockComponent from "./HtmlBlock";
import VerticalProductsComponent from "./VerticalProductsBlock";
import HorizontalProductsComponent from "./HorizontalProductsBlock";
import CountdownBlockComponent from "./CountdownBlock";

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
  html: HtmlBlockComponent,
  vertical_products: VerticalProductsComponent,
  horizontal_products: HorizontalProductsComponent,
  countdown: CountdownBlockComponent,
}

type BlockMeta = {
  id: string;
  title: string;
  icon?: string;
  description?: string;
}
