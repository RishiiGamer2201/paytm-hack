const cron = require('node-cron');
const { sendWhatsAppMessage } = require('../services/whatsappService');

const startCronJobs = (db) => {
    cron.schedule('* * * * *', async () => {
        console.log(`[🤖 Cron Job] Checking for overdue payments... (${new Date().toLocaleString()})`);
        
        try {
            const today = new Date().toISOString();
            
            const overdueUdhars = await db.all(
                `SELECT * FROM Udhar WHERE Status = 'PENDING' AND Due_Date <= ?`,
                [today]
            );

            if (overdueUdhars.length === 0) {
                console.log(`[🤖 Cron Job] No overdue payments found.`);
                return;
            }

            console.log(`[🤖 Cron Job] Found ${overdueUdhars.length} overdue payments. Sending reminders...`);

            for (const udhar of overdueUdhars) {
                const message = `Hello ${udhar.Customer_Name}, \n\nThis is a friendly reminder that your payment of ₹${udhar.Amount} is overdue since ${new Date(udhar.Due_Date).toLocaleDateString()}.\n\nPlease pay immediately using this link: \n${udhar.Payment_Link}\n\nThank you!`;
                
                await sendWhatsAppMessage(udhar.Customer_Phone, message);

                await db.run(
                    `UPDATE Udhar SET Reminders_Sent = Reminders_Sent + 1 WHERE Udhar_ID = ?`,
                    [udhar.Udhar_ID]
                );
            }

            console.log(`[🤖 Cron Job] Completed sending reminders.`);
            
        } catch (error) {
            console.error(`[🤖 Cron Job] Error running checking job:`, error);
        }
    });
};

module.exports = startCronJobs;
