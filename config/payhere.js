// PayHere payment gateway configuration (sandbox by default)
export default {
  merchantId: process.env.PAYHERE_MERCHANT_ID,
  merchantSecret: process.env.PAYHERE_MERCHANT_SECRET,
  baseUrl: process.env.PAYHERE_BASE_URL || "https://sandbox.payhere.lk",
  returnUrl: process.env.PAYHERE_RETURN_URL || "http://localhost:5173/payment/success",
  cancelUrl: process.env.PAYHERE_CANCEL_URL || "http://localhost:5173/payment/cancel",
  notifyUrl: process.env.PAYHERE_NOTIFY_URL || "http://localhost:5000/payments/notify",
  currency: process.env.PAYHERE_CURRENCY || "LKR"
};
