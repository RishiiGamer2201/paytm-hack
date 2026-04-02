/**
 * This service simulates the WhatsApp Cloud API integration.
 * In a real-world application, this would use axios to send a POST request
 * to the Facebook Graph API (https://graph.facebook.com/v17.0/PHONE_NUMBER_ID/messages)
 */

async function sendWhatsAppReminder(customerPhone, customerName, amount, paymentLink) {
    // Simulated axios request block (commented out)
    /*
    const token = process.env.WHATSAPP_TOKEN;
    const url = `https://graph.facebook.com/v17.0/${process.env.PHONE_NUMBER_ID}/messages`;
    
    await axios.post(url, {
        messaging_product: "whatsapp",
        to: customerPhone,
        type: "template",
        template: {
            name: "udhar_reminder", // Template created in FB Developer dashboard
            language: { code: "en" },
            components: [
                {
                    type: "body",
                    parameters: [
                        { type: "text", text: customerName },
                        { type: "text", text: amount },
                        { type: "text", text: paymentLink }
                    ]
                }
            ]
        }
    }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    */
    
    console.log(`\n==========================================`);
    console.log(`💬 WHATSAPP MESSAGE SENT (MOCK)`);
    console.log(`To: ${customerPhone}`);
    console.log(`Message:`);
    console.log(`Hi ${customerName}, this is a reminder for your pending amount of ₹${amount}.`);
    console.log(`Please make your payment using this link: ${paymentLink}`);
    console.log(`==========================================\n`);

    return true;
}

module.exports = {
    sendWhatsAppReminder
};
