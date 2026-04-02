const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const connectDB = async () => {
    try {
        const db = await open({
            filename: './udhar_db.sqlite',
            driver: sqlite3.Database
        });

        await db.exec(`
            CREATE TABLE IF NOT EXISTS Udhar (
                Udhar_ID TEXT PRIMARY KEY,
                Owner_ID TEXT,
                Customer_Name TEXT,
                Customer_Phone TEXT,
                Amount REAL,
                Created_At TEXT,
                Due_Date TEXT,
                Status TEXT DEFAULT 'PENDING',
                Reminders_Sent INTEGER DEFAULT 0,
                Payment_Link TEXT
            );
        `);
        console.log('SQLite Database Connected Successfully');
        return db;
    } catch (error) {
        console.error('Database Connection Failed:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
