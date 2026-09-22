const router = require('express').Router();
const Payment = require('../models/Payment');
const Student = require('../models/Student');

// GET /api/payments/statuslist
// This function is correct from our previous chat
router.get('/statuslist', async (req, res) => {
    try {
        const { month, year, grade, location } = req.query;
        if (!month || !year) {
            return res.status(400).json({ message: 'Month and Year are required.' });
        }

        // 1. Build student filter
        const studentFilter = { isActive: true };
        if (grade && grade !== 'All') {
            studentFilter.grade = grade;
        }
        if (location && location !== 'All') {
            studentFilter.location = location;
        }

        // 2. Get all students matching the filter
        const students = await Student.find(studentFilter).sort({ name: 1 });

        // 3. Get all payments for the selected month/year
        const payments = await Payment.find({ month, year });

        // 4. Create a Map of payments for fast lookup
        const paymentMap = new Map();
        payments.forEach(payment => {
            paymentMap.set(payment.student.toString(), payment);
        });

        // 5. Combine the lists
        const combinedList = students.map(student => {
            const payment = paymentMap.get(student._id.toString());
            return {
                student: student,
                status: payment ? payment.status : 'Pending',
                paymentId: payment ? payment._id : null,
                amount: payment ? payment.amount : null 
            };
        });

        res.json(combinedList);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// --- THIS IS THE FIXED FUNCTION ---
// NEW - MARK A PAYMENT (UPSERT)
// POST /api/payments/mark
router.post('/mark', async (req, res) => {
    try {
        const { studentId, month, year, status, amount } = req.body;

        const filter = { student: studentId, month, year };

        // Define the fields to update
        const updateDoc = {
            $set: { 
                status: status,
                student: studentId, // Need these for the upsert
                month: month,       // Need these for the upsert
                year: year        // Need these for the upsert
            }
        };

        // This is the critical logic:
        if (amount !== undefined) {
            // If an amount is provided (from "Save Paid" button),
            // it will be set here.
            updateDoc.$set.amount = Number(amount);
        } else if (status === 'Pending') {
            // If marking as 'Pending', set amount back to null or 0
             updateDoc.$set.amount = 0; 
        } else {
            // If no amount is provided (e.g., old code),
            // set it to 0 only if this is a NEW record.
            updateDoc.$setOnInsert = { amount: 0 };
        }
        
        // Find, update, and return the NEW document
        const updatedPayment = await Payment.findOneAndUpdate(
            filter,
            updateDoc,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        
        // Send the complete, updated record back to the frontend
        res.status(201).json(updatedPayment);

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
// --- END OF FIXED FUNCTION ---

// *** ADD THIS NEW ROUTE ***
// DELETE /api/payments/reset
router.delete('/reset', async (req, res) => {
    try {
        // Delete ALL documents from the Payment collection
        const deleteResult = await Payment.deleteMany({});

        // Respond with success and the number of records deleted
        res.json({
            message: `Successfully reset finance data. Deleted ${deleteResult.deletedCount} payment records.`,
            deletedCount: deleteResult.deletedCount
        });
    } catch (err) {
        console.error("Error resetting finance data:", err);
        res.status(500).json({ message: 'Error resetting finance data: ' + err.message });
    }
});
// *** END OF NEW ROUTE ***



module.exports = router;