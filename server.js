const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET;

if (!process.env.MONGODB_URI || !JWT_SECRET) {
    console.warn("Set MONGODB_URI and JWT_SECRET in .env before starting the API.");
}

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "20kb" }));

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true }
}, { timestamps: true });

const studentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 30 },
    age: { type: Number, required: true, min: 1, max: 120 },
    course: { type: String, required: true, enum: ["HTML", "CSS", "JavaScript", "React", "Node.js", "MongoDB"] },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Student = mongoose.model("Student", studentSchema);

const formatStudent = (student) => ({
    id: student._id.toString(),
    name: student.name,
    age: student.age,
    course: student.course,
    status: student.status,
    dateAdded: student.createdAt.toLocaleDateString(),
    createdAt: student.createdAt.getTime()
});

const auth = (req, res, next) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "Authentication required." });

    try {
        req.userId = jwt.verify(token, JWT_SECRET).userId;
        next();
    } catch {
        return res.status(401).json({ message: "Session expired. Please sign in again." });
    }
};

const validateStudent = ({ name, age, course }) => {
    if (!name?.trim() || !course || !Number.isInteger(Number(age)) || Number(age) < 1 || Number(age) > 120) {
        return "Enter a valid name, age, and course.";
    }
    if (name.trim().length > 30) return "Name cannot exceed 30 characters.";
    return null;
};

app.get("/", (_req, res) => res.json({ message: "Student Management System API is running" }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(email || "") || !password || password.length < 8) {
            return res.status(400).json({ message: "Use a name, valid email, and password with at least 8 characters." });
        }

        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists) return res.status(409).json({ message: "An account with that email already exists." });

        const user = await User.create({
            name,
            email,
            passwordHash: await bcrypt.hash(password, 12)
        });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: "Unable to create account.", error: error.code === 11000 ? "Email already exists." : undefined });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email?.toLowerCase() });
        if (!user || !(await bcrypt.compare(req.body.password || "", user.passwordHash))) {
            return res.status(401).json({ message: "Incorrect email or password." });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch {
        res.status(500).json({ message: "Unable to sign in." });
    }
});

// CREATE
app.post("/api/students", auth, async (req, res) => {
    const message = validateStudent(req.body);
    if (message) return res.status(400).json({ message });

    try {
        const student = await Student.create({
            ...req.body,
            age: Number(req.body.age),
            userId: req.userId
        });
        res.status(201).json(formatStudent(student));
    } catch (error) {
        res.status(500).json({ message: "Unable to add student." });
    }
});

// READ
app.get("/api/students", auth, async (req, res) => {
    try {
        const { search, course, sortBy, order } = req.query;
        const filter = { userId: req.userId };

        if (search) filter.name = { $regex: search, $options: "i" };
        if (course && course !== "All") filter.course = course;

        const sort = {};
        if (sortBy === "name") sort.name = order === "desc" ? -1 : 1;
        else if (sortBy === "age") sort.age = order === "desc" ? -1 : 1;
        else sort.createdAt = -1;

        const students = await Student.find(filter).sort(sort);
        res.json(students.map(formatStudent));
    } catch {
        res.status(500).json({ message: "Failed to fetch students." });
    }
});

// READ ONE
app.get("/api/students/:id", auth, async (req, res) => {
    try {
        const student = await Student.findOne({ _id: req.params.id, userId: req.userId });
        if (!student) return res.status(404).json({ message: "Student not found." });
        res.json(formatStudent(student));
    } catch {
        res.status(400).json({ message: "Invalid student ID." });
    }
});

// UPDATE
app.put("/api/students/:id", auth, async (req, res) => {
    const message = validateStudent(req.body);
    if (message) return res.status(400).json({ message });

    try {
        const student = await Student.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { ...req.body, age: Number(req.body.age) },
            { new: true, runValidators: true }
        );

        if (!student) return res.status(404).json({ message: "Student not found." });
        res.json(formatStudent(student));
    } catch {
        res.status(500).json({ message: "Failed to update student." });
    }
});

// TOGGLE STATUS
app.patch("/api/students/:id/status", auth, async (req, res) => {
    try {
        const student = await Student.findOne({ _id: req.params.id, userId: req.userId });
        if (!student) return res.status(404).json({ message: "Student not found." });

        student.status = student.status === "Active" ? "Inactive" : "Active";
        await student.save();
        res.json(formatStudent(student));
    } catch {
        res.status(500).json({ message: "Failed to update status." });
    }
});

// DELETE
app.delete("/api/students/:id", auth, async (req, res) => {
    try {
        const deleted = await Student.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!deleted) return res.status(404).json({ message: "Student not found." });
        res.status(204).end();
    } catch {
        res.status(500).json({ message: "Failed to delete student." });
    }
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`)))
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    });
