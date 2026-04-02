require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const fs = require('fs');
const csvParser = require('csv-parser');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Udhar = require('./models/Udhar');
const { sendWhatsAppReminder } = require('./services/whatsapp');

const app = express();
app.use(cors());
app.use(express.json());

const CSV_PATH = path.join(__dirname, '../udhar_dataset_5k_1.csv');

// ─── Seed from CSV if collection is empty ─────────────────────────────────────
async function seedIfEmpty() {
  const count = await Udhar.countDocuments();
  if (count > 0) {
    console.log(`✅ DB already has ${count} records — skipping seed.`);
    return;
  }
  console.log('📖 Seeding from CSV...');
  const rows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(csvParser())
      .on('data', (d) => {
        rows.push({
          Udhar_ID:       d.Udhar_ID,
          Owner_ID:       d.Owner_ID,
          Customer_Name:  d.Customer_Name,
          Customer_Phone: d.Customer_Phone,
          Amount:         parseFloat(d.Amount),
          Created_At:     new Date(d.Created_At),
          Due_Date:       new Date(d.Due_Date),
          Status:         d.Status,
          Reminders_Sent: parseInt(d.Reminders_Sent, 10) || 0,
          Payment_Link:   d.Payment_Link,
        });
      })
      .on('end', resolve)
      .on('error', reject);
  });

  const BATCH = 1000;
  for (let i = 0; i < rows.length; i += BATCH) {
    await Udhar.insertMany(rows.slice(i, i + BATCH));
    console.log(`  Inserted ${Math.min(i + BATCH, rows.length)} / ${rows.length}`);
  }
  console.log('🎉 Seeding complete!');
}

// ─── Start ────────────────────────────────────────────────────────────────────
async function start() {
  console.log('🚀 Starting in-memory MongoDB…');
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  console.log('✅ MongoDB (in-memory) connected at', uri);
  await seedIfEmpty();

  // ── REST Routes ─────────────────────────────────────────────────────────────

  // GET all (optional ?status=PENDING|PAID)
  app.get('/api/udhar', async (req, res) => {
    try {
      const q = req.query.status ? { Status: req.query.status } : {};
      const records = await Udhar.find(q).sort({ Due_Date: 1 });
      res.json(records);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET stats
  app.get('/api/stats', async (req, res) => {
    try {
      const pending = await Udhar.aggregate([
        { $match: { Status: 'PENDING' } },
        { $group: { _id: null, total: { $sum: '$Amount' }, count: { $sum: 1 } } }
      ]);
      const paid = await Udhar.aggregate([
        { $match: { Status: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$Amount' }, count: { $sum: 1 } } }
      ]);
      res.json({
        pendingAmount: pending[0]?.total || 0,
        pendingCount:  pending[0]?.count || 0,
        paidAmount:    paid[0]?.total || 0,
        paidCount:     paid[0]?.count || 0,
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST create
  app.post('/api/udhar', async (req, res) => {
    try {
      const { Customer_Name, Customer_Phone, Amount, Due_Date } = req.body;
      const doc = await Udhar.create({
        Udhar_ID:       Math.random().toString(36).substring(2, 10).toUpperCase(),
        Owner_ID:       'OWNER_001',
        Customer_Name,
        Customer_Phone,
        Amount:         Number(Amount),
        Created_At:     new Date(),
        Due_Date:       new Date(Due_Date),
        Status:         'PENDING',
        Payment_Link:   `upi://pay?pa=store_owner@paytm&pn=Store&am=${Amount}&cu=INR`,
      });
      res.status(201).json(doc);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // PUT mark paid
  app.put('/api/udhar/:id/pay', async (req, res) => {
    try {
      const doc = await Udhar.findByIdAndUpdate(req.params.id, { Status: 'PAID' }, { new: true });
      if (!doc) return res.status(404).json({ error: 'Not found' });
      res.json(doc);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST manual reminder
  app.post('/api/udhar/:id/remind', async (req, res) => {
    try {
      const doc = await Udhar.findById(req.params.id);
      if (!doc) return res.status(404).json({ error: 'Not found' });
      await sendWhatsAppReminder(doc.Customer_Phone, doc.Customer_Name, doc.Amount, doc.Payment_Link);
      doc.Reminders_Sent += 1;
      await doc.save();
      res.json({ message: 'Reminder sent', record: doc });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ── Cron: every hour check overdue ──────────────────────────────────────────
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Hourly reminder check…');
    const overdue = await Udhar.find({ Status: 'PENDING', Due_Date: { $lte: new Date() } });
    console.log(`  Found ${overdue.length} overdue records.`);
    for (const rec of overdue) {
      await sendWhatsAppReminder(rec.Customer_Phone, rec.Customer_Name, rec.Amount, rec.Payment_Link);
      rec.Reminders_Sent += 1;
      await rec.save();
    }
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`\n🌐 API ready → http://localhost:${PORT}/api/udhar\n`));
}

start().catch(console.error);
