const mongoose = require('mongoose');

const udharSchema = new mongoose.Schema({
    Udhar_ID: { type: String, required: true, unique: true },
    Owner_ID: { type: String, required: true },
    Customer_Name: { type: String, required: true },
    Customer_Phone: { type: String, required: true },
    Amount: { type: Number, required: true },
    Created_At: { type: Date, required: true },
    Due_Date: { type: Date, required: true },
    Status: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' },
    Reminders_Sent: { type: Number, default: 0 },
    Payment_Link: { type: String, required: true }
});

module.exports = mongoose.model('Udhar', udharSchema);
