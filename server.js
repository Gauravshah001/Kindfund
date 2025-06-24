const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const cors = require('cors');
const Razorpay = require("razorpay");
require("dotenv").config();
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
console.log("Razorpay Key ID:", process.env.RAZORPAY_KEY_ID);
console.log("Razorpay Key Secret:", process.env.RAZORPAY_KEY_SECRET ? '***hidden***' : 'NOT SET');


// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Gaurav@123',
  database: 'regis'
});

db.connect(err => {
  if (err) {
    console.error('❌ MySQL connection error:', err);
    return;
  }
  console.log('✅ Connected to MySQL');
});

// Register user
app.post('/register', async (req, res) => {
  const { Fusername, Lusername, email, password1 } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password1, 10);
    const sql = 'INSERT INTO users (Fname, Lname, email, password1) VALUES (?, ?, ?, ?)';
    db.query(sql, [Fusername, Lusername, email, hashedPassword], (err, result) => {
      if (err) {
        console.error('❌ Error inserting user:', err);
        return res.status(500).send('Registration failed');
      }
      res.send('✅ User registered');
    });
  } catch (err) {
    res.status(500).send('❌ Hashing error');
  }
});

// Get all users
app.get('/users', (req, res) => {
  const sql = 'SELECT id, Fname, Lname, email FROM users';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Error fetching users:', err);
      return res.status(500).send('Error loading users');
    }
    res.json(results);
  });
});




const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  
  });
//   const razorpay = new Razorpay({
//   key_id: "rzp_test_ruQVOjQqH9rwqF",
//   key_secret: "xxxxxxxxxxxxxxxxxxxxxxxx",
// });
//   app.post("/create-order", async (req, res) => {
//     const options = {
//       amount: req.body.amount,
//       currency: "INR",
//       receipt: "order_rcptid_11",
//     };
  
//     try {
//       const order = await razorpay.orders.create(options);
//       res.json(order);
//     } catch (error) {
//       res.status(500).send("Error creating order");
//     }
//   });

// app.listen(port, () => {
//   console.log(`🚀 Server running at http://localhost:${port}`);
// });
app.post("/create-order", async (req, res) => {
  const options = {
    amount: req.body.amount,
    currency: "INR",
    receipt: "order_rcptid_11",
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Error creating order", details: error.error });
  }
});



// Contact Us form handler - saves to MySQL
app.post('/contact', (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }
  
  // Simple email regex check
  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }

  const sql = 'INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)';
  db.query(sql, [name, email, subject, message], (err, result) => {
    if (err) {
      console.error('❌ Error saving contact info:', err);
      return res.status(500).json({ message: 'Error saving contact info' });
    }
    res.json({ message: '✅ Message sent successfully!' });
  });
});

//create event 
app.post('/create-event', (req, res) => {
  const {
    name, start_date, start_time, end_date, end_time,
    state, city, place, sponsor, organizer
  } = req.body;

  const sql = `
    INSERT INTO events (name, start_date, start_time, end_date, end_time, state, city, place, sponsor, organizer)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [name, start_date, start_time, end_date, end_time, state, city, place, sponsor, organizer];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Insert error:', err);
      res.status(500).json({ message: 'Failed to save event' });
    } else {
      res.status(200).json({ message: 'Event saved', eventId: result.insertId });
    }
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


// Get all events
app.get('/events', (req, res) => {
  const sql = 'SELECT * FROM events ORDER BY start_date, start_time';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching events:', err);
      return res.status(500).json({ message: 'Error fetching events' });
    }
    res.json(results);
  });
});


//register for event 
app.post('/register-event', (req, res) => {
  const { eventId, name, email } = req.body;

  if (!eventId || !name || !email) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const sql = 'INSERT INTO event_registrations (event_id, name, email) VALUES (?, ?, ?)';
  db.query(sql, [eventId, name, email], (err, result) => {
    if (err) {
      console.error('Insert error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(200).json({ message: 'Registered successfully' });
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});