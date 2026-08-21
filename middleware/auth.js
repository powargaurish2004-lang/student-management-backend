const jwt = require("jsonwebtoken");

const requireAuth = (req, res, next) => {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({
            success: false,
            message: "Session expired. Please sign in again."
        });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Only admins can perform this action"
        });
    }

    next();
};

module.exports = { requireAuth, requireAdmin };