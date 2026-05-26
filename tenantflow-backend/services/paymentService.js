import crypto from "crypto";
import payhereConfig from "../config/payhere.js";

const formatAmount = (amount) => {
  return Number(amount).toFixed(2);
};

const generateHash = ({ orderId, amount, currency }) => {
  const merchantId = payhereConfig.merchantId || "";
  const merchantSecret = payhereConfig.merchantSecret || "";
  const secretHash = crypto
    .createHash("md5")
    .update(merchantSecret)
    .digest("hex")
    .toUpperCase();

  const raw = `${merchantId}${orderId}${formatAmount(amount)}${currency}${secretHash}`;
  return crypto.createHash("md5").update(raw).digest("hex").toUpperCase();
};

const paymentService = {
  buildPayHerePayload: ({ orderId, amount, items, customer }) => {
    if (!payhereConfig.merchantId || !payhereConfig.merchantSecret) {
      throw new Error("PayHere merchant configuration is missing");
    }

    const currency = payhereConfig.currency;
    const payload = {
      merchant_id: payhereConfig.merchantId,
      return_url: payhereConfig.returnUrl,
      cancel_url: payhereConfig.cancelUrl,
      notify_url: payhereConfig.notifyUrl,
      order_id: orderId,
      items: items || "Maintenance Payment",
      currency: currency,
      amount: formatAmount(amount),
      first_name: customer.firstName,
      last_name: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address || "",
      city: customer.city || "",
      country: customer.country || "Sri Lanka"
    };

    return {
      endpoint: `${payhereConfig.baseUrl}/pay/checkout`,
      payload: {
        ...payload,
        hash: generateHash({
          orderId,
          amount,
          currency
        })
      }
    };
  }
};

export default paymentService;
