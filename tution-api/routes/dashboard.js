const router = require('express').Router();
const Student = require('../models/Student');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');

// GET /api/dashboard
router.get('/', async (req, res) => {
    try {
        // --- 1. Get Dates and Month/Year ---
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const currentMonth = new Date().toLocaleString('default', { month: 'long' });
        const currentYear = new Date().getFullYear();

        // --- 2. Get Simple Totals ---
        const totalStudents = await Student.countDocuments({ isActive: true });

        // --- 3. Get Attendance Stats for ACTIVE students ---
        const presentStats = await Attendance.aggregate([
            { 
                $match: { 
                    date: { $gte: today, $lt: tomorrow },
                    status: 'Present' 
                }
            },
            {
                $lookup: {
                    from: 'students',
                    localField: 'student',
                    foreignField: '_id',
                    as: 'studentDetails'
                }
            },
            { $unwind: '$studentDetails' },
            { $match: { 'studentDetails.isActive': true } },
            {
                $facet: {
                    "totalPresent": [
                        { $count: "count" }
                    ],
                    "presentByGrade": [
                        { $group: { _id: "$classGrade", count: { $sum: 1 } } },
                        { $sort: { _id: 1 } }
                    ]
                }
            }
        ]);

        const presentToday = presentStats[0].totalPresent[0] ? presentStats[0].totalPresent[0].count : 0;
        const presentTodayByGrade = presentStats[0].presentByGrade;

        // --- 4. Get Grade-Wise Student Totals ---
        const totalStudentsByGrade = await Student.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: "$grade", count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // --- 5. Aggregate Payment Status Stats ---
        const allStudentStats = await Student.aggregate([
            { $match: { isActive: true } },
            {
                $lookup: {
                    from: 'payments',
                    let: { studentId: "$_id" },
                    pipeline: [
                        { 
                            $match: { 
                                $expr: { $eq: ["$student", "$$studentId"] },
                                month: currentMonth,
                                year: currentYear,
                                status: 'Paid'
                            }
                        }
                    ],
                    as: 'paymentDetails'
                }
            },
            {
                $addFields: {
                    paymentStatus: {
                        $cond: {
                            if: { $gt: [{ $size: "$paymentDetails" }, 0] },
                            then: "Paid",
                            else: "Pending"
                        }
                    }
                }
            },
            {
                $facet: {
                    "paymentStatusThisMonth": [
                        { $group: { _id: "$paymentStatus", count: { $sum: 1 } } }
                    ],
                    "pendingPaymentsByGrade": [
                        { $match: { paymentStatus: 'Pending' } },
                        { $group: { _id: "$grade", count: { $sum: 1 } } },
                        { $sort: { _id: 1 } }
                    ]
                }
            }
        ]);

        const stats = allStudentStats[0];
        const paymentStatusThisMonth = stats.paymentStatusThisMonth;
        const pendingPaymentsByGrade = stats.pendingPaymentsByGrade;

        // --- 6. REWRITTEN: Detailed Income Stats with Hall Fee Calculations ---
        const incomeStats = await Payment.aggregate([
            {
                $match: {
                    status: 'Paid',
                    year: currentYear
                }
            },
            // Step A: Link Payment to Student
            {
                $lookup: {
                    from: 'students',
                    localField: 'student',
                    foreignField: '_id',
                    as: 'studentDoc'
                }
            },
            { $unwind: '$studentDoc' },
            // Step B: Link Student's Location String to the Locations Collection
            {
                $lookup: {
                    from: 'locations',
                    localField: 'studentDoc.location',
                    foreignField: 'name',
                    as: 'locationDoc'
                }
            },
            // Step C: Preserve record even if location isn't found (though it should be)
            { $unwind: { path: '$locationDoc', preserveNullAndEmptyArrays: true } },
            // Step D: Calculate math fields
            {
                $addFields: {
                    feePercent: { $ifNull: ["$locationDoc.chargePercentage", 0] },
                    hallFee: {
                        $multiply: [
                            "$amount",
                            { $divide: [{ $ifNull: ["$locationDoc.chargePercentage", 0] }, 100] }
                        ]
                    }
                }
            },
            {
                $addFields: {
                    netAmount: { $subtract: ["$amount", "$hallFee"] }
                }
            },
            // Step E: Group into Year and Month totals
            {
                $facet: {
                    "yearTotals": [
                        {
                            $group: {
                                _id: null,
                                totalGross: { $sum: "$amount" },
                                totalFees: { $sum: "$hallFee" },
                                totalNet: { $sum: "$netAmount" }
                            }
                        }
                    ],
                    "monthTotals": [
                        { $match: { month: currentMonth } },
                        {
                            $group: {
                                _id: null,
                                totalGross: { $sum: "$amount" },
                                totalFees: { $sum: "$hallFee" },
                                totalNet: { $sum: "$netAmount" }
                            }
                        }
                    ]
                }
            }
        ]);

        // Format Income results
        const mIncome = incomeStats[0].monthTotals[0] || { totalGross: 0, totalFees: 0, totalNet: 0 };
        const yIncome = incomeStats[0].yearTotals[0] || { totalGross: 0, totalFees: 0, totalNet: 0 };

        // --- 7. Send all data back ---
        res.json({
            totalStudents,
            presentToday,
            
            // Structured Income Data for Frontend
            incomeThisMonth: {
                gross: mIncome.totalGross,
                fees: mIncome.totalFees,
                net: mIncome.totalNet
            },
            incomeThisYear: {
                gross: yIncome.totalGross,
                fees: yIncome.totalFees,
                net: yIncome.totalNet
            },
            
            totalStudentsByGrade,
            presentTodayByGrade,
            pendingPaymentsByGrade,
            paymentStatusThisMonth
        });

    } catch (err) {
        console.error("Dashboard Error:", err);
        res.status(500).json({ message: "Error fetching dashboard data: " + err.message });
    }
});

module.exports = router;