const router = require('express').Router();
const Student = require('../models/Student');

// --- Helper function to generate a random 4-digit ID (1000-9999) ---
function generateStudentId() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// --- CREATE a new student (MODIFIED) ---
// POST /api/students
router.post('/', async (req, res) => {
    try {
        let uniqueIdFound = false;
        let generatedId;
        let attempts = 0; // Prevent infinite loops in unlikely scenarios

        // --- Loop to find a unique ID ---
        while (!uniqueIdFound && attempts < 100) { // Limit attempts
            generatedId = generateStudentId();
            const existingStudent = await Student.findOne({ studentId: generatedId });
            if (!existingStudent) {
                uniqueIdFound = true; // Found a unique ID
            }
            attempts++;
        }

        if (!uniqueIdFound) {
            // Highly unlikely, but handle the case where we couldn't find a unique ID after many tries
            return res.status(500).json({ message: "Could not generate a unique student ID. Please try again." });
        }
        // --- End ID Generation ---

        const newStudent = new Student({
            studentId: generatedId, // Assign the unique ID
            name: req.body.name,
            grade: req.body.grade,
            location: req.body.location,
            contactPhone: req.body.contactPhone,
            parentName: req.body.parentName
            // isActive defaults to true
        });

        const savedStudent = await newStudent.save();
        res.status(201).json(savedStudent);

    } catch (err) {
         // Handle potential errors like validation or duplicate *name* if you add that later
         if (err.code === 11000) { // Catch potential duplicate key error just in case (race condition)
             return res.status(400).json({ message: "Failed to generate unique ID or duplicate entry error." });
         }
        res.status(400).json({ message: "Error creating student: " + err.message });
    }
});

// --- GET all students ---
// GET /api/students
router.get('/', async (req, res) => {
    // ... (This route remains the same - ensures isActive: true) ...
    try { const filter = { isActive: true }; if (req.query.grade && req.query.grade !== 'All') { filter.grade = req.query.grade; } if (req.query.location && req.query.location !== 'All') { filter.location = req.query.location; } const students = await Student.find(filter).sort({ name: 1 }); res.json(students); } catch (err) { console.error("Error fetching students:", err); res.status(500).json({ message: 'Error fetching students: ' + err.message }); }
});

// --- GET one specific student ---
// GET /api/students/:id (using MongoDB _id)
router.get('/:id', async (req, res) => {
    // ... (This route remains the same) ...
     try { const student = await Student.findById(req.params.id); if (student == null) { return res.status(404).json({ message: 'Cannot find student' }); } res.json(student); } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- UPDATE a student ---
// PATCH /api/students/:id (using MongoDB _id)
router.patch('/:id', async (req, res) => {
    // Note: We don't allow changing the studentId here
    const { studentId, ...updateData } = req.body; // Exclude studentId from updates

    try {
        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            updateData, // Use the data without studentId
            { new: true, runValidators: true }
        );
        if (updatedStudent == null) { return res.status(404).json({ message: 'Cannot find student' }); }
        res.json(updatedStudent);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

// --- RESET (Deactivate ALL) students ---
// DELETE /api/students/reset
router.delete('/reset', async (req, res) => {
    // ... (This route remains the same) ...
    try { const updateResult = await Student.updateMany({}, { $set: { isActive: false } }); console.log("Resetting (Deactivating) Students:", updateResult); res.json({ message: `Successfully deactivated all students. Updated ${updateResult.modifiedCount} student records.`, modifiedCount: updateResult.modifiedCount }); } catch (err) { console.error("Error deactivating all students:", err); res.status(500).json({ message: 'Error deactivating all students: ' + err.message }); }
});

// --- DELETE (Deactivate ONE) student ---
// DELETE /api/students/:id (using MongoDB _id)
router.delete('/:id', async (req, res) => {
    // ... (This route remains the same) ...
    try { const student = await Student.findById(req.params.id); if (student == null) { return res.status(404).json({ message: 'Cannot find student' }); } student.isActive = false; await student.save(); res.json({ message: 'Deactivated Student' }); } catch (err) { res.status(500).json({ message: err.message }); }
});


// --- NEW: GET student by their 4-digit studentId ---
// GET /api/students/by-id/1234
router.get('/by-id/:studentId', async (req, res) => {
    try {
        console.log(`API: Searching for studentId: ${req.params.studentId}`);
        const student = await Student.findOne({ 
            studentId: req.params.studentId, 
            isActive: true // Only find active students
        });

        if (student == null) {
            console.log("API: Student not found.");
            return res.status(404).json({ message: 'Cannot find active student with this ID' });
        }

        console.log("API: Student found:", student.name);
        res.json(student); // Send back the full student object
    } catch (err) {
        console.error("API Error:", err.message);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;