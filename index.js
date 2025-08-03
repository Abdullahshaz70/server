const express = require('express');
const pool = require('./ds');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'D:/source/MAD/server_thing/photoURL');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Nodemailer config
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'abdullah.s7062@gmail.com', 
    pass: 'udzf bdls etrn mezp',   
  },
});

// Home route
app.get('/', (req, res) => {
  res.send("API is running");
});

// Register route
app.post('/register', upload.single('photo'), async (req, res) => {
  try {
    const id = uuidv4();
    const { name, email, password, about } = req.body;
    const photoURL = req.file ? req.file.filename : null;
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Insert user
   const result = await pool.query(
    `INSERT INTO users (id, name, email, password, about, photoURL, verification_token)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [id, name, email, password, about || '', photoURL || '', verificationToken]
    );


   
    const BASE_URL = 'http://192.168.100.165:3000';
    const verificationLink = `${BASE_URL}/verify?token=${verificationToken}`;

    await transporter.sendMail({
      from: '"My App" <abdullah.s7062@gmail.com>',
      to: email,
      subject: 'Please verify your email',
      html: `<p>Hello ${name},</p>
             <p>Click the link below to verify your email:</p>
             <a href="${verificationLink}">${verificationLink}</a>`,
    });

    res.status(201).json({ message: 'Registered! Please check your email to verify.' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).send('Email already registered');
    }
    console.error('Error inserting user:', err.message);
    res.status(500).send('Server Error');
  }
});

// Email verification route
app.get('/verify', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Invalid or missing token');

  try {
    const result = await pool.query(
      `UPDATE users SET is_verified = TRUE, verification_token = NULL
       WHERE verification_token = $1 RETURNING *`,
      [token]
    );

    if (result.rowCount === 0) {
      return res.status(400).send('Invalid or expired token');
    }

    res.send('✅ Email verified successfully!');
  } catch (err) {
    console.error('Verification error:', err.message);
    res.status(500).send('Server Error');
  }
});

// Start server
app.listen(3000, '0.0.0.0', () => {
  console.log("Server is Working . . . . .");
});
