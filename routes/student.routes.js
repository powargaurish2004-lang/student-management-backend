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
const { requireAuth, requireAdmin } = require("../middleware/auth");


// CREATE
router.post("/", requireAuth, createStudent);


// READ ALL
router.get("/", requireAuth, getStudents);


// READ ONE
router.get("/:id", requireAuth, getStudentById);


// UPDATE
router.put("/:id", requireAuth, updateStudent);


// TOGGLE STATUS
router.patch("/:id/status", requireAuth, requireAdmin, toggleStudentStatus);


// DELETE
router.delete("/:id", requireAuth, requireAdmin, deleteStudent);


module.exports = router;