const sendWhatsAppMessage = async (phoneNumber, message) => {
    // ----------------------------------------------------------------------
    // MOCK WHATSAPP SERVICE
    // Replace this implementation with an actual Twilio or Meta Graph API 
    // call in a production environment.
    // ----------------------------------------------------------------------
    
    console.log(`\n=============================================================`);
    console.log(`💬 WHATSAPP MESSAGE SENT TO: ${phoneNumber}`);
    console.log(`-------------------------------------------------------------`);
    console.log(`${message}`);
    console.log(`=============================================================\n`);
    
    // Simulate API delay
    return new Promise(resolve => setTimeout(() => resolve(true), 500));
};

module.exports = {
    sendWhatsAppMessage
};
