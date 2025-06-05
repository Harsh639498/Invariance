const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./router/authRouter");

dotenv.config(); // ✅ Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// ✅ Routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the API. MongoDB is connected!");
});
hi

// ✅ Define connectDB BEFORE using it
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("Connection error:", err.message);
    process.exit(1);
  }
};

// ✅ Start server after DB connection
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
