const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentSchema = new Schema({
    // --- NEW FIELD ---
    studentId: {
        type: String, // Store as string for leading zeros if needed, though 4-digits won't have them
        required: true,
        unique: true, // Ensures no two students have the same ID
        index: true   // Improves lookup performance for this field
    },
    // --- Existing Fields ---
    name: { type: String, required: true, trim: true },
    grade: { type: String, required: true },
    location: { type: String, required: true },
    contactPhone: { type: String },
    parentName: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;