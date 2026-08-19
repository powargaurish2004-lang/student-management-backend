const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
    {
        studentId: {
            type: String,
            unique: true,
            required: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        age: {
            type: Number,
            required: true,
            min: 1
        },

        course: {
            type: String,
            required: true,
            enum: [
                "HTML",
                "CSS",
                "JavaScript",
                "React",
                "Node.js",
                "MongoDB"
            ]
        },

        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active"
        },

        dateAdded: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Student", studentSchema);