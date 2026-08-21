const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// REGISTER
const register = async (req, res) => {
    try {
        const { name, email, password, role = "user", adminCode } = req.body;
        const normalizedEmail = email?.toLowerCase().trim();

        if (!name || !email || !password || !["user", "admin"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Name, email, password and a valid role are required"
            });
        }

        if (
            role === "admin" &&
            (!process.env.ADMIN_SIGNUP_CODE ||
                !process.env.ADMIN_USERNAME ||
                !process.env.ADMIN_EMAIL ||
                !process.env.ADMIN_PASSWORD ||
                name.trim() !== process.env.ADMIN_USERNAME ||
                normalizedEmail !== process.env.ADMIN_EMAIL.toLowerCase() ||
                password !== process.env.ADMIN_PASSWORD ||
                adminCode !== process.env.ADMIN_SIGNUP_CODE)
        ) {
            return res.status(403).json({
                success: false,
                message: "A valid admin signup code is required"
            });
        }

        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role
        });

        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.status(201).json({
            success: true,
            message: "Registration successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Registration failed"
        });
    }
};


// LOGIN
const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const normalizedEmail = email?.toLowerCase().trim();

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const isConfiguredAdmin =
            normalizedEmail === process.env.ADMIN_EMAIL?.toLowerCase() &&
            password === process.env.ADMIN_PASSWORD;

        if (isConfiguredAdmin && user.role !== "admin") {
            user.role = "admin";
            await user.save();
        }

        const accountRole = user.role;

        if (role && role !== accountRole) {
            return res.status(403).json({
                success: false,
                message: `This account is registered as a ${accountRole}`
            });
        }

        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: accountRole
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: accountRole
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};

module.exports = {
    register,
    login
};