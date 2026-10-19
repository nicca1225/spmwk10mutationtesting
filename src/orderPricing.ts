export type Tier = 'standard' | 'member' | 'vip';

export interface Order {
  subtotal: number; // SGD, before discounts
  itemCount: number;
  tier: Tier;
  promoCode?: string;
}

export interface Quote {
  discount: number;
  shipping: number;
  total: number;
}

const MAX_DISCOUNT_RATE = 0.2;
const FREE_SHIPPING_FROM = 80;

/** Prices an e-commerce order: tiered discount, membership bonus, promo code, shipping. */
export function priceOrder(order: Order): Quote {
  if (order.subtotal < 0 || order.itemCount <= 0) {
    throw new Error('Invalid order');
  }

  let rate = 0;
  if (order.subtotal > 200) {
    rate = 0.1;
  } else if (order.subtotal > 100) {
    rate = 0.05;
  }
  if (order.tier === 'member') rate += 0.02;
  if (order.tier === 'vip') rate += 0.05;
  if (order.promoCode === 'SPM10' && order.subtotal >= 50) rate += 0.1;
  rate = Math.min(rate, MAX_DISCOUNT_RATE);

  const discount = round2(order.subtotal * rate);
  const afterDiscount = order.subtotal - discount;

  let shipping = 0;
  if (afterDiscount < FREE_SHIPPING_FROM && order.tier !== 'vip') {
    shipping = 5 + Math.max(0, order.itemCount - 3) * 1.5;
  }

  return { discount, shipping, total: round2(afterDiscount + shipping) };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
