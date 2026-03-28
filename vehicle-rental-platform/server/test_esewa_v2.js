const crypto = require('crypto');

const secret = "8gBm/:&EnhH.1/q(";

function test(msg, expected) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(msg);
    const sig = hmac.digest('base64');
    console.log(`Msg: "${msg}"`);
    console.log(`Expected: ${expected}`);
    console.log(`Actual:   ${sig}`);
    console.log(`Match:    ${sig === expected}`);
    console.log("---");
}

console.log("Testing Demo values...");
test("total_amount=110,transaction_uuid=241028,product_code=EPAYTEST", "i94zsd3oXF6ZsSr/kGqT4sSzYQzjj1W/waxjWyRwaME=");
test("110,241028,EPAYTEST", "i94zsd3oXF6ZsSr/kGqT4sSzYQzjj1W/waxjWyRwaME=");
test("total_amount=110,transaction_uuid=241028,product_code=EPAYTEST", "i94zsd3oXF6ZsSr/kGqT4sSzYQzjj1W/waxjWyRwaME=");
