# Order Pricing — Business Rules

Product requirements for pricing an order at checkout. All amounts are in SGD.

## 1. Valid orders
- An order must have at least 1 item.
- The subtotal cannot be negative. A $0 subtotal is allowed (e.g. a fully free cart).
- Invalid orders are rejected with the error "Invalid order".

## 2. Discount
The discount rate is built up from these parts:

| Rule | Adds |
|---|---|
| Subtotal over $100 (up to $200) | 5% |
| Subtotal over $200 | 10% (instead of 5%) |
| Member tier | +2% |
| VIP tier | +5% |
| Promo code `SPM10`, subtotal $50 or more | +10% |

- The total discount rate is capped at **20%**.
- Discount = subtotal × rate, rounded to the nearest cent.

## 3. Shipping
- **Free shipping when the amount the customer pays after discounts is $80 or more.**
- VIP customers always get free shipping.
- Otherwise shipping is $5, plus $1.50 for each item beyond the 3rd.

## 4. Total
- Total = (subtotal − discount) + shipping, rounded to the nearest cent.
