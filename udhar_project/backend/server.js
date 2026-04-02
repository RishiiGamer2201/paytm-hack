const express = require('express');
const cors = require('cors');
const connectDB = require('./database');
const startCronJobs = require('./cron/reminders');
const { sendWhatsAppMessage } = require('./services/whatsappService');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let db;

const init = async () => {
    db = await connectDB();

    app.get('/api/udhar', async (req, res) => {
        try {
            const udhars = await db.all("SELECT * FROM Udhar ORDER BY Due_Date ASC");
            res.json(udhars);
        } catch (error) {
            res.status(500).json({ message: 'Server Error', error: error.message });
        }
    });

    app.post('/api/udhar', async (req, res) => {
        try {
            const { Customer_Name, Customer_Phone, Amount, Due_Date } = req.body;
            
            // Check if exact customer (by name or phone) exists in PENDING
            const existing = await db.get(
                "SELECT * FROM Udhar WHERE Status = 'PENDING' AND (LOWER(Customer_Name) = LOWER(?) OR Customer_Phone = ?) LIMIT 1",
                [Customer_Name, Customer_Phone]
            );

            if (existing) {
                // Add amount directly to existing customer
                await db.run(
                    "UPDATE Udhar SET Amount = Amount + ?, Due_Date = ? WHERE Udhar_ID = ?",
                    [Amount, new Date(Due_Date).toISOString(), existing.Udhar_ID]
                );
                const updated = await db.get("SELECT * FROM Udhar WHERE Udhar_ID = ?", existing.Udhar_ID);
                return res.status(200).json(updated);
            } else {
                // Create completely new entry
                const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();
                const paymentLink = `upi://pay?pa=store_owner@paytm&pn=Store&am=${Amount}&cu=INR`;
                
                const newUdhar = {
                    Udhar_ID: randomId,
                    Owner_ID: 'OWNER_001',
                    Customer_Name,
                    Customer_Phone,
                    Amount,
                    Created_At: new Date().toISOString(),
                    Due_Date: new Date(Due_Date).toISOString(),
                    Status: 'PENDING',
                    Reminders_Sent: 0,
                    Payment_Link: paymentLink
                };

                await db.run(
                    `INSERT INTO Udhar (Udhar_ID, Owner_ID, Customer_Name, Customer_Phone, Amount, Created_At, Due_Date, Status, Reminders_Sent, Payment_Link)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [newUdhar.Udhar_ID, newUdhar.Owner_ID, newUdhar.Customer_Name, newUdhar.Customer_Phone, newUdhar.Amount, newUdhar.Created_At, newUdhar.Due_Date, newUdhar.Status, newUdhar.Reminders_Sent, newUdhar.Payment_Link]
                );
                return res.status(201).json(newUdhar);
            }
        } catch (error) {
            res.status(400).json({ message: 'Failed to add udhar', error: error.message });
        }
    });

    app.patch('/api/udhar/:id/pay', async (req, res) => {
        try {
            const { id } = req.params;
            const { paymentAmount } = req.body; // how much they paid
            
            const udhar = await db.get('SELECT * FROM Udhar WHERE Udhar_ID = ?', id);
            if (!udhar) return res.status(404).json({ message: 'Not found' });
            
            const newAmount = udhar.Amount - paymentAmount;
            
            if (newAmount <= 0) {
                // If paid fully or overpaid, mark as PAID and drop it from default view
                await db.run('UPDATE Udhar SET Amount = 0, Status = ? WHERE Udhar_ID = ?', ['PAID', id]);
                res.json({ message: 'Marked as completely paid', udhar: { ...udhar, Amount: 0, Status: 'PAID'} });
            } else {
                // Adjusted amount 
                await db.run('UPDATE Udhar SET Amount = ? WHERE Udhar_ID = ?', [newAmount, id]);
                res.json({ message: 'Payment deducted successfully', udhar: { ...udhar, Amount: newAmount } });
            }
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    });

    app.post('/api/udhar/:id/remind', async (req, res) => {
        try {
            const { id } = req.params;
            const udhar = await db.get('SELECT * FROM Udhar WHERE Udhar_ID = ?', id);
            
            if (!udhar) return res.status(404).json({ message: 'Not found' });
            
            const message = `Hello ${udhar.Customer_Name}, \n\nThis is a manual reminder that your payment of ₹${udhar.Amount} is currently due.\n\nPlease pay using this link: \n${udhar.Payment_Link}\n\nThank you!`;
            
            await sendWhatsAppMessage(udhar.Customer_Phone, message);
            await db.run(`UPDATE Udhar SET Reminders_Sent = Reminders_Sent + 1 WHERE Udhar_ID = ?`, [id]);
            
            res.json({ message: 'Reminder sent successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to send reminder' });
        }
    });

    startCronJobs(db);

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

init();
