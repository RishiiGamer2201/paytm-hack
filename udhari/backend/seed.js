const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const Udhar = require('./models/Udhar');

const CSV_FILE_PATH = '../udhar_dataset_5k_1.csv';
const MONGO_URI = 'mongodb://127.0.0.1:27017/paytm_udhar';

async function seedDB() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected.');

        // Wipe existing to avoid duplicates when testing
        await Udhar.deleteMany({});
        console.log('🗑️ Cleared existing Udhar collections.');

        const results = [];
        let count = 0;

        console.log('📖 Reading CSV file...');
        fs.createReadStream(CSV_FILE_PATH)
            .pipe(csv())
            .on('data', (data) => {
                results.push({
                    Udhar_ID: data.Udhar_ID,
                    Owner_ID: data.Owner_ID,
                    Customer_Name: data.Customer_Name,
                    Customer_Phone: data.Customer_Phone,
                    Amount: parseFloat(data.Amount),
                    Created_At: new Date(data.Created_At),
                    Due_Date: new Date(data.Due_Date),
                    Status: data.Status,
                    Reminders_Sent: parseInt(data.Reminders_Sent, 10) || 0,
                    Payment_Link: data.Payment_Link
                });
            })
            .on('end', async () => {
                console.log(`Parsed ${results.length} rows. Starting insertion...`);
                // Insert in batches of 1000 for performance
                const BATCH_SIZE = 1000;
                for (let i = 0; i < results.length; i += BATCH_SIZE) {
                    const batch = results.slice(i, i + BATCH_SIZE);
                    await Udhar.insertMany(batch);
                    console.log(`Inserted ${i + batch.length} records...`);
                }
                
                console.log('🎉 Seeding successfully completed!');
                mongoose.connection.close();
            });
    } catch (err) {
        console.error('❌ Seeding error:', err);
        mongoose.connection.close();
    }
}

seedDB();
