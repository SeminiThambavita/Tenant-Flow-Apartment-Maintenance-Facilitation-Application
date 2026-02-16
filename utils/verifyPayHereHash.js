import crypto from "crypto";
import payhereConfig from "../config/payhere.js";

// Verify PayHere hash from notify callback
const verifyPayHereHash = (data, hash) => {
  const merchantSecret = payhereConfig.merchantSecret || "";
  const secretHash = crypto
    .createHash("md5")
    .update(merchantSecret)
    .digest("hex")
    .toUpperCase();

  const raw =
    `${data.merchant_id}${data.order_id}${data.payhere_amount}` +
    `${data.payhere_currency}${data.status_code}${secretHash}`;

  const localHash = crypto.createHash("md5").update(raw).digest("hex").toUpperCase();
  return localHash === hash;
};

export default verifyPayHereHash;
