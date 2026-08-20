const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const studentRoutes = require("./routes/student.routes");
const authRoutes = require("./routes/auth.routes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true
}));
app.use(express.json({ limit: "20kb" }));

app.get("/", (req, res) => {
    res.json({
        message: "Student Management System API is running"
    });
});

app.get("/api/health", (req, res) => {
    res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
