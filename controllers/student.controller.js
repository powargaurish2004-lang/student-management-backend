const Student = require("../models/student.model");

// Generate Student ID
const generateStudentId = async () => {
    const lastStudent = await Student.findOne()
        .sort({ studentId: -1 })
        .select("studentId");

    if (!lastStudent) {
        return "STD001";
    }

    const lastNumber = parseInt(
        lastStudent.studentId.replace("STD", "")
    );

    const nextNumber = lastNumber + 1;

    return `STD${String(nextNumber).padStart(3, "0")}`;
};


// CREATE STUDENT
const createStudent = async (req, res) => {
    try {
        const { name, age, course } = req.body;

        // Validation
        if (!name || !age || !course) {
            return res.status(400).json({
                success: false,
                message: "Name, age and course are required"
            });
        }

        if (age <= 0) {
            return res.status(400).json({
                success: false,
                message: "Age must be greater than 0"
            });
        }

        const studentId = await generateStudentId();

        const student = await Student.create({
            studentId,
            name,
            age,
            course
        });

        res.status(201).json({
            success: true,
            message: "Student added successfully",
            student
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to add student"
        });
    }
};


// GET ALL STUDENTS
const getStudents = async (req, res) => {
    try {
        const {
            search,
            course,
            sortBy,
            order
        } = req.query;

        let filter = {};

        // Search by name
        if (search) {
            filter.name = {
                $regex: search,
                $options: "i"
            };
        }

        // Filter by course
        if (course && course !== "All") {
            filter.course = course;
        }

        let sort = {};

        // Sorting
        if (sortBy === "name") {
            sort.name = order === "desc" ? -1 : 1;
        }

        else if (sortBy === "age") {
            sort.age = order === "desc" ? -1 : 1;
        }

        else {
            sort.createdAt = -1;
        }

        const students = await Student.find(filter).sort(sort);

        res.status(200).json({
            success: true,
            count: students.length,
            students
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch students"
        });
    }
};


// GET SINGLE STUDENT
const getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        res.status(200).json({
            success: true,
            student
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch student"
        });
    }
};


// UPDATE STUDENT
const updateStudent = async (req, res) => {
    try {
        const { name, age, course, status } = req.body;

        if (age !== undefined && age <= 0) {
            return res.status(400).json({
                success: false,
                message: "Age must be greater than 0"
            });
        }

        const student = await Student.findByIdAndUpdate(
            req.params.id,
            {
                name,
                age,
                course,
                status
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Student updated successfully",
            student
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to update student"
        });
    }
};


// TOGGLE STATUS
const toggleStudentStatus = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        student.status =
            student.status === "Active"
                ? "Inactive"
                : "Active";

        await student.save();

        res.status(200).json({
            success: true,
            message: "Student status updated",
            student
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update status"
        });
    }
};


// DELETE STUDENT
const deleteStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(
            req.params.id
        );

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Student deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to delete student"
        });
    }
};


module.exports = {
    createStudent,
    getStudents,
    getStudentById,
    updateStudent,
    toggleStudentStatus,
    deleteStudent
};