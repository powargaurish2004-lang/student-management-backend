const express = require("express");

const {
    createStudent,
    getStudents,
    getStudentById,
    updateStudent,
    toggleStudentStatus,
    deleteStudent
} = require("../controllers/student.controller");

const router = express.Router();


// CREATE
router.post("/", createStudent);


// READ ALL
router.get("/", getStudents);


// READ ONE
router.get("/:id", getStudentById);


// UPDATE
router.put("/:id", updateStudent);


// TOGGLE STATUS
router.patch("/:id/status", toggleStudentStatus);


// DELETE
router.delete("/:id", deleteStudent);


module.exports = router;