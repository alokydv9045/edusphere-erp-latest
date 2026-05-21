const Razorpay = require('razorpay');

let razorpay;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
} else {
    console.warn("WARNING: RAZORPAY_KEY_ID and/or RAZORPAY_KEY_SECRET are not set. Razorpay features will not work.");
    razorpay = {
        orders: {
            create: async () => {
                throw new Error("Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.");
            },
            fetch: async () => {
                throw new Error("Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.");
            }
        }
    };
}

module.exports = razorpay;

