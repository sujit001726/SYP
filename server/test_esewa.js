const crypto = require('crypto');

const secret = "8gBm/:&EnhH.1/q(";
const message = "total_amount=100,transaction_uuid=11-201-13,product_code=EPAYTEST";

const hmac = crypto.createHmac('sha256', secret);
hmac.update(message);
const signature = hmac.digest('base64');

console.log("Expected: 4Ov7pCI1zIOdwtV2BRMUNjz1upIlT/COTxfLhWvVurE=");
console.log("Calculated:", signature);
