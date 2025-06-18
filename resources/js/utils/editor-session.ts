import { CheckoutSession } from "@/types/checkout";
import { OfferItem, Price } from "@/types/offer";

type UpdateSessionArgs = {
  checkoutSession: CheckoutSession;
  offerItems: OfferItem[];
  item?: number;
  price?: number;
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

    const defaultPrice = i.prices.find(p => p.id == price);

    if(!price || !defaultPrice || required === false) return null;

    return createLineItem(i, quantity ?? 1, defaultPrice);
  }).filter(item => !!item);

  return {
    ...checkoutSession,
    subtotal: lineItems.reduce((acc, item) => Number(acc) + Number(item.subtotal), 0),
    total: lineItems.reduce((acc, item) => Number(acc) + Number(item.total), 0) + (checkoutSession.shipping ?? 0),
    taxes: lineItems.reduce((acc, item) => Number(acc) + Number(item.taxes), 0),
    line_items: lineItems
  }
}

const createLineItem = (item: OfferItem, quantity: number, defaultPrice?: Price) => {

  // const exclusiveTaxes = computeExclusiveTaxes(item, quantity, defaultPrice);
  const inclusiveTaxes = computeInclusiveTaxes(item, quantity, defaultPrice);

  return {
    id: item.id,
    name: defaultPrice?.product?.name || item.name,
    currency: defaultPrice?.currency || 'USD',
    quantity: quantity,
    subtotal: (defaultPrice?.amount ?? 0) * quantity,
    taxes: 0,
    // exclusive_taxes: 0,
    inclusive_taxes: inclusiveTaxes,
    shipping: 0,
    discount: 0,
    total: (defaultPrice?.amount ?? 0) * quantity,
    product: defaultPrice?.product,
    is_highlighted: item.is_highlighted ?? false,
    // is_tax_inclusive: item.is_tax_inclusive ?? false,
    // tax_rate: item.tax_rate ?? 0,
    price: defaultPrice,
    type: item.type,
  }
}

export const computeInclusiveTaxes = (item: OfferItem, quantity: number, defaultPrice?: Price): number => {
  const totalAmount = parseFloat(defaultPrice?.amount?.toString() ?? '0') * quantity;
  return Math.round(totalAmount - totalAmount / 1.1);
}


// export const computeExclusiveTaxes = (item: OfferItem, quantity: number, defaultPrice?: Price): number => {
//   const taxes = !item.is_tax_inclusive && item?.tax_rate && item.tax_rate > 0
//     ? (parseFloat(defaultPrice?.amount?.toString() ?? '0') * quantity) * (item.tax_rate / 100)
//     : 0;

//   return taxes;
// }

export const computeTotal = (item: OfferItem, quantity: number, defaultPrice?: Price): number => {
  const amount = (parseFloat(defaultPrice?.amount?.toString() ?? '0') * quantity);
  return amount;
}