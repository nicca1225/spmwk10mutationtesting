// tests/orderPricing.test.ts
import { priceOrder, Order } from '../src/orderPricing';

describe('priceOrder', () => {
  describe('Input validation', () => {
    it('throws an error if subtotal is negative', () => {
      const order: Order = {
        subtotal: -1,
        itemCount: 1,
        tier: 'standard',
      };
      expect(() => priceOrder(order)).toThrow('Invalid order');
    });

    it('throws an error if itemCount is zero or negative', () => {
      expect(() =>
        priceOrder({ subtotal: 50, itemCount: 0, tier: 'standard' })
      ).toThrow('Invalid order');

      expect(() =>
        priceOrder({ subtotal: 50, itemCount: -2, tier: 'standard' })
      ).toThrow('Invalid order');
    });

    it('accepts a zero subtotal if itemCount > 0', () => {
      const result = priceOrder({ subtotal: 0, itemCount: 1, tier: 'standard' });
      expect(result).toEqual({
        discount: 0,
        shipping: 5,
        total: 5,
      });
    });
  });

  describe('Subtotal tier discount rates', () => {
    it('applies 0% subtotal discount for subtotal <= 100', () => {
      const result = priceOrder({ subtotal: 100, itemCount: 1, tier: 'standard' });
      expect(result.discount).toBe(0);
      expect(result.shipping).toBe(0); // >= 80 qualifies for free shipping
      expect(result.total).toBe(100);
    });

    it('applies 5% subtotal discount for 100 < subtotal <= 200', () => {
      const result = priceOrder({ subtotal: 200, itemCount: 2, tier: 'standard' });
      // 200 * 0.05 = 10
      expect(result.discount).toBe(10);
      expect(result.shipping).toBe(0);
      expect(result.total).toBe(190);
    });

    it('applies 10% subtotal discount for subtotal > 200', () => {
      const result = priceOrder({ subtotal: 200.01, itemCount: 1, tier: 'standard' });
      // 200.01 * 0.10 = 20.001 -> rounded to 20.00
      expect(result.discount).toBe(20.0);
      expect(result.total).toBe(180.01);
    });
  });

  describe('Membership tier bonuses', () => {
    it('adds 2% discount for member tier', () => {
      const result = priceOrder({ subtotal: 100, itemCount: 1, tier: 'member' });
      // 0% subtotal + 2% member = 2% discount
      expect(result.discount).toBe(2);
      expect(result.total).toBe(98);
    });

    it('adds 5% discount for vip tier', () => {
      const result = priceOrder({ subtotal: 100, itemCount: 1, tier: 'vip' });
      // 0% subtotal + 5% vip = 5% discount
      expect(result.discount).toBe(5);
      expect(result.total).toBe(95);
    });
  });

  describe('Promo codes', () => {
    it('applies 10% promo discount if code is SPM10 and subtotal >= 50', () => {
      const result = priceOrder({
        subtotal: 50,
        itemCount: 1,
        tier: 'standard',
        promoCode: 'SPM10',
      });
      // 0% subtotal + 10% promo = 10% discount on 50 = 5
      expect(result.discount).toBe(5);
      // subtotal 50 < 80 -> shipping = 5
      expect(result.shipping).toBe(5);
      expect(result.total).toBe(50); // (50 - 5) + 5
    });

    it('ignores SPM10 promo code if subtotal < 50', () => {
      const result = priceOrder({
        subtotal: 49.99,
        itemCount: 1,
        tier: 'standard',
        promoCode: 'SPM10',
      });
      expect(result.discount).toBe(0);
    });

    it('ignores unrecognized promo codes', () => {
      const result = priceOrder({
        subtotal: 100,
        itemCount: 1,
        tier: 'standard',
        promoCode: 'DISCOUNT50',
      });
      expect(result.discount).toBe(0);
    });
  });

  describe('Maximum discount cap', () => {
    it('caps total discount rate at 20%', () => {
      // Subtotal > 200 (10%) + VIP (5%) + SPM10 (10%) = 25% uncapped -> clamped to 20%
      const result = priceOrder({
        subtotal: 300,
        itemCount: 2,
        tier: 'vip',
        promoCode: 'SPM10',
      });
      // 300 * 0.20 = 60
      expect(result.discount).toBe(60);
      expect(result.total).toBe(240);
    });
  });

  describe('Shipping calculation', () => {
    it('waives shipping fee if subtotal >= 80 for any tier', () => {
      const standardOrder = priceOrder({ subtotal: 80, itemCount: 10, tier: 'standard' });
      expect(standardOrder.shipping).toBe(0);

      const memberOrder = priceOrder({ subtotal: 85, itemCount: 5, tier: 'member' });
      expect(memberOrder.shipping).toBe(0);
    });

    it('always provides free shipping for VIP tier regardless of subtotal', () => {
      const vipOrder = priceOrder({ subtotal: 20, itemCount: 5, tier: 'vip' });
      expect(vipOrder.shipping).toBe(0);
    });

    it('charges base shipping of 5 when itemCount <= 3 and subtotal < 80', () => {
      const result1 = priceOrder({ subtotal: 30, itemCount: 1, tier: 'standard' });
      expect(result1.shipping).toBe(5);

      const result3 = priceOrder({ subtotal: 30, itemCount: 3, tier: 'member' });
      expect(result3.shipping).toBe(5);
    });

    it('adds 1.50 per additional item when itemCount > 3 and subtotal < 80', () => {
      // 5 items: 5 + (5 - 3) * 1.5 = 5 + 3 = 8
      const result = priceOrder({ subtotal: 50, itemCount: 5, tier: 'standard' });
      expect(result.shipping).toBe(8);
    });
  });

  describe('Floating point rounding', () => {
    it('correctly rounds discount, shipping, and total to 2 decimal places', () => {
      const result = priceOrder({
        subtotal: 105.55,
        itemCount: 4, // shipping: 5 + (4 - 3) * 1.5 = 6.5
        tier: 'member', // 5% + 2% = 7%
      });
      // subtotal * 0.07 = 105.55 * 0.07 = 7.3885 -> 7.39
      // afterDiscount = 105.55 - 7.39 = 98.16
      // subtotal >= 80, so shipping is 0
      expect(result.discount).toBe(7.39);
      expect(result.shipping).toBe(0);
      expect(result.total).toBe(98.16);
    });
  });
});