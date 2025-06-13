import { CheckoutSession } from "@/types/checkout";
import { OfferItem, Price } from "@/types/offer";

type UpdateSessionArgs = {
  checkoutSession: CheckoutSession;
  offerItems: OfferItem[];
  item?: number;
  price?: string;
  required?: boolean;
  quantity?: number;
};

export const updateSessionLineItems = ({
  offerItems,
  item,
  price,
  quantity,
  required,
  checkoutSession
}: UpdateSessionArgs): CheckoutSession => {
  const lineItems = offerItems.map(i => {
    if(i.id != item) {
      return checkoutSession.line_items.find(li => li.id == i.id);
    };

    const defaultPrice = i.prices.find(p => p.lookup_key == price);

    if(!price || !defaultPrice || required === false) return null;

    return createLineItem(i, quantity ?? 1, defaultPrice);
  }).filter(item => !!item);

  return {
    ...checkoutSession,
    subtotal: lineItems.reduce((acc, item) => Number(acc) + Number(item.subtotal), 0),
    total: lineItems.reduce((acc, item) => Number(acc) + Number(item.total), 0),
    line_items: lineItems
  }
}

const createLineItem = (item: OfferItem, quantity: number, defaultPrice?: Price) => {
  return {
    id: item.id,
    name: defaultPrice?.product?.name || item.name,
    currency: 'USD',
    quantity: quantity,
    subtotal: defaultPrice?.amount ?? 0,
    taxes: 0,
    shipping: 0,
    discount: 0,
    total: defaultPrice?.amount ?? 0,
    product: defaultPrice?.product,
    is_highlighted: item.is_highlighted ?? false,
    price: defaultPrice,
  }
}