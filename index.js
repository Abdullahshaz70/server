const express = require('express');
const pool = require('./ds');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');


const jwt = require('jsonwebtoken');
const JWT_SECRET = '123456';
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    console.log('No token found');
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token verification error:', err.message);
      return res.sendStatus(403); // Forbidden
    }
    req.user = user;
    next();
  });
}



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


   
    // const BASE_URL = 'http://192.168.100.165:3000';
    const BASE_URL = 'https://pcj9h2qx-3000.euw.devtunnels.ms';  // This works anywhere if tunnel is public


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

app.post('/login' ,  async (req,res) => {

  const {email , password} = req.body;

  try{
    
    const result = await pool.query('SELECT* FROM users WHERE email = $1',[email]);

    if(result.rowCount === 0){
      return res.status(404).send('User not found.');
    }

    const user = result.rows[0];

    if(!user.is_verified){
      return res.status(403).send('Please verify your email before logging in.');
    }

    const passMatch = password === user.password;

    if (!passMatch) {
      return res.status(401).send('Incorrect password');
    }

    //    const token = jwt.sign(
    //   { userId: user.id, email: user.email },
    //   JWT_SECRET,
    //   { expiresIn: '2h' }
    // );
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' }); // ✅ correct


    res.status(200).json({
      message: 'Login successful',
      token:token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        photoURL: user.photourl,
        about: user.about,
      }
    });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send('Server error');
  }

})


app.get('/getUser', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  console.log("Requested userId:", userId);

  try {
    const result = await pool.query(
      'SELECT id, name, email, about FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});




// Start server
app.listen(3000, '0.0.0.0', () => {
  console.log("Server is Working . . . . .");
});
