const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const connectDB = require('../database');

const CSV_FILE_PATH = path.join(__dirname, '../../udhar_dataset_5k_1.csv');

const seedDB = async () => {
    const db = await connectDB();
    
    let pendingInserts = [];
    let currentTotal = 0;
    
    console.log('Reading CSV file and seeding to SQLite (Limiting total pending between 4k-10k)...');
    
    await db.exec('DELETE FROM Udhar;');
    await db.exec('BEGIN TRANSACTION;');

    fs.createReadStream(CSV_FILE_PATH)
        .pipe(csv())
        .on('data', (data) => {
            // Only take PENDING records
            if (data.Status !== 'PENDING') return;
            
            // Stop if adding this pushes us over 10000
            const amount = parseFloat(data.Amount);
            if (currentTotal + amount > 10000) {
                // If we are already > 4000, we can skip and end soon 
                return;
            }

            currentTotal += amount;

            const stmt = [
                data.Udhar_ID,
                data.Owner_ID,
                data.Customer_Name,
                data.Customer_Phone,
                amount,
                new Date(data.Created_At).toISOString(),
                new Date(data.Due_Date).toISOString(),
                data.Status,
                parseInt(data.Reminders_Sent, 10),
                data.Payment_Link
            ];
            pendingInserts.push(stmt);
        })
        .on('end', async () => {
            console.log(`Parsed ${pendingInserts.length} PENDING rows.`);
            console.log(`Total Sum = ₹${currentTotal.toLocaleString()}`);
            
            try {
                const statement = await db.prepare(
                    `INSERT INTO Udhar (Udhar_ID, Owner_ID, Customer_Name, Customer_Phone, Amount, Created_At, Due_Date, Status, Reminders_Sent, Payment_Link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                );
                
                for(let row of pendingInserts) {
                    await statement.run(row);
                }
                
                await statement.finalize();
                await db.exec('COMMIT;');
                console.log('Database Seeding Completed Successfully! 🚀');
            } catch (error) {
                console.error('Error seeding database:', error);
                await db.exec('ROLLBACK;');
            } finally {
                process.exit(0);
            }
        });
};

seedDB();
