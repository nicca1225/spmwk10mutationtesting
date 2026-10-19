// Acceptance checks written by a human from q4/SPEC.md (NOT from the code).
// This is the "what a developer still has to verify" step.
import { priceOrder } from '../src/orderPricing';

describe('Checks against SPEC.md', () => {
  test('§1 a $0 order is valid', () => {
    expect(() => priceOrder({ subtotal: 0, itemCount: 1, tier: 'standard' })).not.toThrow();
  });

  test('§2–4 small standard order pays $5 shipping', () => {
    expect(priceOrder({ subtotal: 50, itemCount: 2, tier: 'standard' })).toEqual({
      discount: 0,
      shipping: 5,
      total: 55,
    });
  });

  test('§3 VIP always gets free shipping', () => {
    expect(priceOrder({ subtotal: 60, itemCount: 1, tier: 'vip' }).shipping).toBe(0);
  });

  test('§2 discounts stack: $150 member + SPM10 = 17% off', () => {
    expect(priceOrder({ subtotal: 150, itemCount: 1, tier: 'member', promoCode: 'SPM10' }).discount).toBe(25.5);
  });

  test('§3 $82 with SPM10 pays $73.80 after discount, so shipping is NOT free', () => {
    // 82 - 10% = 73.80, which is below the $80 free-shipping threshold
    expect(priceOrder({ subtotal: 82, itemCount: 1, tier: 'standard', promoCode: 'SPM10' })).toEqual({
      discount: 8.2,
      shipping: 5,
      total: 78.8,
    });
  });
});
