const crypto = require('crypto');

const secrets = [
    "8gBm/:&EnhH.1/q(",
    "8gBm/:&EnhH.1/q",
    "8g8M8m8P8V8gh9m8",
    "k8786543b87654321",
    "8g8M8m8P8V8gh9m8",
    "8gBm/:&EnhH.1/q("
];

const messages = [
    "total_amount=100,transaction_uuid=11-201-13,product_code=EPAYTEST",
    "100,11-201-13,EPAYTEST"
];

const target = "4Ov7pCI1zIOdwtV2BRMUNjz1upIlT/COTxfLhWvVurE=";

for (let s of secrets) {
    for (let m of messages) {
        const hmac = crypto.createHmac('sha256', s);
        hmac.update(m);
        const sig = hmac.digest('base64');
        if (sig === target) {
            console.log("MATCH FOUND!");
            console.log("Secret:", s);
            console.log("Message:", m);
            process.exit(0);
        }
    }
}
console.log("No match found.");
