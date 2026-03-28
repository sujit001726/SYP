const crypto = require('crypto');

const secret = "8g8M8m8P8V8gh9m8";
const target = "i94zsd3oXF6ZsSr/kGqT4sSzYQzjj1W/waxjWyRwaME=";

const values = {
    total_amount: "110",
    transaction_uuid: "241028",
    product_code: "EPAYTEST"
};

const templates = [
    "total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code}",
    "total_amount={total_amount}&transaction_uuid={transaction_uuid}&product_code={product_code}",
    "{total_amount},{transaction_uuid},{product_code}",
    "{total_amount}{transaction_uuid}{product_code}",
    "total_amount={total_amount}, transaction_uuid={transaction_uuid}, product_code={product_code}"
];

for (let t of templates) {
    let m = t.replace("{total_amount}", values.total_amount)
             .replace("{transaction_uuid}", values.transaction_uuid)
             .replace("{product_code}", values.product_code);
    
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(m);
    const sig = hmac.digest('base64');
    if (sig === target) {
        console.log("MATCH FOUND!");
        console.log("Message:", m);
        process.exit(0);
    }
}
console.log("No match found.");
