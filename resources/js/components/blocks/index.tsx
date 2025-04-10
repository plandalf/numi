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
