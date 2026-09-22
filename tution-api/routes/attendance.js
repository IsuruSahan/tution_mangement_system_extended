const router = require('express').Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

// --- CREATE a new attendance record ---
// POST /api/attendance
router.post('/', async (req, res) => {
    try {
        const student = await Student.findById(req.body.studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        const newAttendance = new Attendance({
            student: req.body.studentId,
            date: new Date(req.body.date), // Store as Date
            status: req.body.status,
            classGrade: student.grade,
            location: student.location
        });
        const savedRecord = await newAttendance.save();
        res.status(201).json(savedRecord);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- GET attendance for a specific class on a specific date ---
// GET /api/attendance/class?date=YYYY-MM-DD&grade=...&location=...
router.get('/class', async (req, res) => {
    try {
        const { date, grade, location } = req.query;
        if (!date || !grade || !location) {
            return res.status(400).json({ message: "Please provide date, grade, and location" });
        }
        const queryDate = new Date(date);
        const startOfDay = new Date(queryDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(queryDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        const records = await Attendance.find({
            date: { $gte: startOfDay, $lte: endOfDay },
            classGrade: grade,
            location: location
        }).populate('student', 'name');
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- GET all attendance for ONE student (with optional date filtering) ---
// GET /api/attendance/student/:studentId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/student/:studentId', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const filter = { student: req.params.studentId };

        // --- CORRECTED DATE FILTER LOGIC ---
        if (startDate) {
            const start = new Date(startDate);
            if (!isNaN(start.getTime())) {
                start.setUTCHours(0, 0, 0, 0); // Start of day UTC
                filter.date = { $gte: start };
            } else { console.warn(`Invalid startDate: ${startDate}`); }
        }
        if (endDate) {
            const end = new Date(endDate);
            if (!isNaN(end.getTime())) {
                end.setUTCHours(23, 59, 59, 999); // End of day UTC
                if (filter.date) { // If $gte exists
                    filter.date.$lte = end;
                } else { // Only endDate provided
                    filter.date = { $lte: end };
                }
            } else { console.warn(`Invalid endDate: ${endDate}`); }
        }
        // --- END CORRECTED DATE FILTER LOGIC ---

        console.log("Fetching student attendance with filter:", filter); // Log filter

        const records = await Attendance.find(filter).sort({ date: -1 });
        res.json(records);
    } catch (err) {
        console.error("Error fetching student attendance:", err);
        res.status(500).json({ message: 'Error fetching student attendance: ' + err.message });
    }
});


// --- CREATE or UPDATE (UPSERT) an attendance record ---
// POST /api/attendance/mark
router.post('/mark', async (req, res) => {
    try {
        const { studentId, date, status, classGrade, location } = req.body;
        const recordDate = new Date(date);
        const startOfDay = new Date(recordDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(recordDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        const updatedRecord = await Attendance.findOneAndUpdate(
            { student: studentId, date: { $gte: startOfDay, $lte: endOfDay } },
            { $set: { status: status, classGrade: classGrade, location: location }, $setOnInsert: { student: studentId, date: recordDate } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        res.status(201).json(updatedRecord);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- GET ATTENDANCE SUMMARY ---
// GET /api/attendance/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/summary', async (req, res) => {
    // ... (This route remains the same as the last version with debugging/corrections) ...
    console.log("--- Fetching Attendance Summary ---");
    try {
        const { startDate, endDate } = req.query;
        console.log(`Query Params: startDate=${startDate}, endDate=${endDate}`);
        if (!startDate || !endDate) { console.error("Missing date."); return res.status(400).json({ message: 'Start/end date required.' }); }
        const start = new Date(startDate); start.setUTCHours(0, 0, 0, 0);
        const end = new Date(endDate); end.setUTCHours(23, 59, 59, 999);
        console.log(`Date Range (UTC): ${start.toISOString()} to ${end.toISOString()}`);
        const pipeline = [
            { $match: { date: { $gte: start, $lte: end }, status: { $in: ['Present', 'Absent'] }, classGrade: { $exists: true, $ne: null, $ne: "" }, location: { $exists: true, $ne: null, $ne: "" } } },
            { $lookup: { from: 'students', localField: 'student', foreignField: '_id', as: 'studentInfo' } },
            { $unwind: { path: '$studentInfo', preserveNullAndEmptyArrays: false } },
            { $match: { 'studentInfo.isActive': true } },
            { $group: { _id: { grade: '$classGrade', location: '$location', status: '$status' }, count: { $sum: 1 } } },
            { $group: { _id: { grade: '$_id.grade', location: '$_id.location' }, present: { $sum: { $cond: [{ $eq: ['$_id.status', 'Present'] }, '$count', 0] } }, absent: { $sum: { $cond: [{ $eq: ['$_id.status', 'Absent'] }, '$count', 0] } } } },
            { $project: { _id: 0, grade: '$_id.grade', location: '$_id.location', present: '$present', absent: '$absent' } },
            { $sort: { grade: 1, location: 1 } }
        ];
        // console.log("Aggregation Pipeline:", JSON.stringify(pipeline, null, 2));
        const summary = await Attendance.aggregate(pipeline);
        console.log("Aggregation Result:", summary);
        res.json(summary);
    } catch (err) { console.error("Error summary:", err); res.status(500).json({ message: 'Error summary: ' + err.message }); }
    console.log("--- Finished Summary ---");
});

// --- DELETE ALL attendance records ---
// DELETE /api/attendance/reset
router.delete('/reset', async (req, res) => {
    // ... (This route remains the same) ...
     try { const deleteResult = await Attendance.deleteMany({}); console.log("Reset Attendance:", deleteResult); res.json({ message: `Reset attendance. Deleted ${deleteResult.deletedCount} records.`, deletedCount: deleteResult.deletedCount }); } catch (err) { console.error("Error reset attendance:", err); res.status(500).json({ message: 'Error reset attendance: ' + err.message }); }
});

module.exports = router;