// server.js
const express = require("express");
const cors = require('cors');
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// File uploads
const upload = multer({ dest: 'uploads/' });

// ✅ MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("Connection error:", err.message);
    process.exit(1);
  }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('uploads')); // Serve uploaded files

// In-memory data
const users = [];
const userCarts = {};

// Routes

app.get('/', (req, res) => {
  res.send('Welcome to the PCB Order API! Please use /login or /register endpoints.');
});

// ✅ LOGIN
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    return res.json({ message: 'Login successful', username });
  }
  return res.status(400).json({ message: 'Invalid credentials' });
});

// ✅ REGISTER
app.post('/register', (req, res) => {
  const { fullname, email, username, password } = req.body;

  if (!fullname || !email || !username || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const existingUser = users.find(user => user.username === username);
  if (existingUser) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  users.push({ fullname, email, username, password });
  res.json({ message: 'Registration successful' });
});

// ✅ FORGOT PASSWORD
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.in',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const resetLink = `https://yourdomain.com/reset-password?email=${encodeURIComponent(email)}`;
  const mailOptions = {
    from: `"Invariance Automation" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset Link',
    html: `<h2>Password Reset</h2><p>Click the link below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: `Password reset link sent to ${email}` });
  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).json({ message: 'Failed to send email' });
  }
});

// ✅ ADD TO CART
app.post('/cart', upload.single('gerberFile'), (req, res) => {
  const { username, pcbName, dispatchUnit, boardWidth, boardHeight, material, thickness, quantity } = req.body;

  if (!username || !pcbName || !dispatchUnit || !boardWidth || !boardHeight || !material || !thickness || !quantity) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const cartItem = {
    pcbName,
    dispatchUnit,
    boardSize: {
      width: parseInt(boardWidth),
      height: parseInt(boardHeight)
    },
    material,
    thickness,
    quantity: parseInt(quantity),
    gerberFile: req.file ? req.file.filename : null
  };

  if (!userCarts[username]) {
    userCarts[username] = [];
  }

  userCarts[username].push(cartItem);
  res.json({ message: 'Item added to cart', cart: userCarts[username] });
});

// ✅ PRICE CALCULATOR
app.post('/cart/calculate-price', (req, res) => {
  const { boardWidth, boardHeight, quantity } = req.body;

  const width = parseInt(boardWidth);
  const height = parseInt(boardHeight);
  const qty = parseInt(quantity);

  if (width < 20 || height < 20 || width > 350 || height > 350) {
    return res.status(400).json({ message: "Board size must be between 20x20 mm and 350x350 mm." });
  }

  const area = width * height;
  const basePrice = 139;
  const pricePerSquareMm = basePrice / (20 * 20);
  const orderPrice = area * pricePerSquareMm * qty;
  const tax = 0.18;
  const totalPrice = orderPrice + (orderPrice * tax);

  res.json({
    unitPrice: (orderPrice / qty).toFixed(2),
    orderPrice: orderPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2)
  });
});

// ✅ GET CART ITEMS
app.get('/cart/:username', (req, res) => {
  const { username } = req.params;

  if (!userCarts[username]) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  res.json(userCarts[username]);
});

// ✅ PAYMENT VIA CARD
app.post('/payment/card', (req, res) => {
  const { username, productTitle, productPrice } = req.body;

  if (!username || !productTitle || !productPrice) {
    return res.status(400).json({ message: 'Invalid payment details' });
  }

  res.json({ message: 'Payment successful via Card!', productTitle, productPrice });
});

// ✅ PAYMENT VIA UPI
app.post('/payment/upi', (req, res) => {
  const { username, upiId } = req.body;

  if (!username || !upiId) {
    return res.status(400).json({ message: 'Invalid UPI details' });
  }

  res.json({ message: `Payment successful with UPI ID: ${upiId}!` });
});

// ✅ START THE SERVER
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
});
