// tests/orderPricing.test.ts
import { priceOrder, Order } from '../src/orderPricing';

describe('priceOrder', () => {
  describe('validation errors', () => {
    it('throws an error if subtotal is negative', () => {
      const order: Order = {
        subtotal: -10,
        itemCount: 2,
        tier: 'standard',
      };
      expect(() => priceOrder(order)).toThrow('Invalid order');
    });

    it('throws an error if itemCount is zero or negative', () => {
      expect(() =>
        priceOrder({ subtotal: 100, itemCount: 0, tier: 'standard' })
      ).toThrow('Invalid order');

      expect(() =>
        priceOrder({ subtotal: 100, itemCount: -1, tier: 'standard' })
      ).toThrow('Invalid order');
    });
  });

  describe('subtotal tier discounts', () => {
    it('applies 0% subtotal rate when subtotal is <= 100', () => {
      const quote = priceOrder({ subtotal: 100, itemCount: 1, tier: 'standard' });
      expect(quote.discount).toBe(0);
    });

    it('applies 5% subtotal rate when subtotal is between 100 and 200', () => {
      const quote = priceOrder({ subtotal: 150, itemCount: 1, tier: 'standard' });
      // 150 * 0.05 = 7.5
      expect(quote.discount).toBe(7.5);
    });

    it('applies 10% subtotal rate when subtotal is strictly greater than 200', () => {
      const quote200 = priceOrder({ subtotal: 200, itemCount: 1, tier: 'standard' });
      // 200 falls into 100 < subtotal <= 200 tier (5%)
      expect(quote200.discount).toBe(10);

      const quote250 = priceOrder({ subtotal: 250, itemCount: 1, tier: 'standard' });
      // 250 * 0.10 = 25
      expect(quote250.discount).toBe(25);
    });
  });

  describe('membership tier bonuses', () => {
    it('adds 2% rate for member tier', () => {
      // 80 * 0.02 = 1.6
      const quote = priceOrder({ subtotal: 80, itemCount: 1, tier: 'member' });
      expect(quote.discount).toBe(1.6);
    });

    it('adds 5% rate for vip tier', () => {
      // 80 * 0.05 = 4.0
      const quote = priceOrder({ subtotal: 80, itemCount: 1, tier: 'vip' });
      expect(quote.discount).toBe(4);
    });
  });

  describe('promo code SPM10', () => {
    it('applies additional 10% discount if subtotal >= 50', () => {
      const quote = priceOrder({
        subtotal: 50,
        itemCount: 1,
        tier: 'standard',
        promoCode: 'SPM10',
      });
      // 50 * 0.10 = 5.0
      expect(quote.discount).toBe(5);
    });

    it('ignores SPM10 if subtotal < 50', () => {
      const quote = priceOrder({
        subtotal: 49.99,
        itemCount: 1,
        tier: 'standard',
        promoCode: 'SPM10',
      });
      expect(quote.discount).toBe(0);
    });

    it('ignores unrecognized promo codes', () => {
      const quote = priceOrder({
        subtotal: 100,
        itemCount: 1,
        tier: 'standard',
        promoCode: 'DISCOUNT50',
      });
      expect(quote.discount).toBe(0);
    });
  });

  describe('discount capping (MAX_DISCOUNT_RATE = 20%)', () => {
    it('caps total discount rate at 20%', () => {
      // subtotal > 200 (10%) + vip (5%) + SPM10 (10%) = 25% -> capped at 20%
      const quote = priceOrder({
        subtotal: 300,
        itemCount: 1,
        tier: 'vip',
        promoCode: 'SPM10',
      });
      // 300 * 0.20 = 60
      expect(quote.discount).toBe(60);
      expect(quote.total).toBe(240);
    });
  });

  describe('shipping calculations', () => {
    it('grants free shipping to VIP members regardless of afterDiscount threshold', () => {
      const quote = priceOrder({ subtotal: 20, itemCount: 5, tier: 'vip' });
      expect(quote.shipping).toBe(0);
    });

    it('grants free shipping when afterDiscount is >= 80', () => {
      const quote = priceOrder({ subtotal: 80, itemCount: 5, tier: 'standard' });
      expect(quote.shipping).toBe(0);
    });

    it('charges base shipping of 5 when itemCount <= 3 and afterDiscount < 80', () => {
      const quote = priceOrder({ subtotal: 50, itemCount: 3, tier: 'standard' });
      expect(quote.shipping).toBe(5);
      expect(quote.total).toBe(55);
    });

    it('charges additional 1.5 per item exceeding 3 items when afterDiscount < 80', () => {
      // itemCount = 6 -> 5 + (6 - 3) * 1.5 = 5 + 4.5 = 9.5
      const quote = priceOrder({ subtotal: 50, itemCount: 6, tier: 'standard' });
      expect(quote.shipping).toBe(9.5);
      expect(quote.total).toBe(59.5);
    });

    it('evaluates free shipping eligibility based on post-discount subtotal', () => {
      // Subtotal is 85, but with member (2%) + SPM10 (10%) = 12% discount:
      // discount = round2(85 * 0.12) = 10.2
      // afterDiscount = 85 - 10.2 = 74.8 (< 80) -> incurs shipping
      const quote = priceOrder({
        subtotal: 85,
        itemCount: 2,
        tier: 'member',
        promoCode: 'SPM10',
      });
      expect(quote.discount).toBe(10.2);
      expect(quote.shipping).toBe(5);
      expect(quote.total).toBe(79.8);
    });
  });

  describe('total calculation & rounding', () => {
    it('correctly rounds discount and total to 2 decimal places', () => {
      // 105.55 * 0.05 = 5.2775 -> rounded to 5.28
      // afterDiscount = 105.55 - 5.28 = 100.27
      // shipping = 0 (>= 80)
      const quote = priceOrder({ subtotal: 105.55, itemCount: 1, tier: 'standard' });
      expect(quote.discount).toBe(5.28);
      expect(quote.shipping).toBe(0);
      expect(quote.total).toBe(100.27);
    });
  });
});