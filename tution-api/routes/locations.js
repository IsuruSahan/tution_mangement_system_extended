const router = require('express').Router();
const Location = require('../models/Location');

// --- 1. GET ALL locations ---
router.get('/', async (req, res) => {
    try {
        const locations = await Location.find().sort({ name: 1 });
        res.json(locations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- 2. CREATE a new location (Updated to include chargePercentage) ---
router.post('/', async (req, res) => {
    const location = new Location({
        name: req.body.name,
        chargePercentage: req.body.chargePercentage || 0 // Default to 0 if not provided
    });
    try {
        const newLocation = await location.save();
        res.status(201).json(newLocation);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- 3. UPDATE a location (NEW: For your "One-by-One" updates) ---
// PUT /api/locations/12345
router.put('/:id', async (req, res) => {
    try {
        const { name, chargePercentage } = req.body;
        
        const updatedLocation = await Location.findByIdAndUpdate(
            req.params.id,
            { 
                name, 
                chargePercentage: Number(chargePercentage) // Ensure it's a number
            },
            { new: true, runValidators: true } // returns the updated document
        );

        if (!updatedLocation) {
            return res.status(404).json({ message: 'Cannot find location' });
        }

        res.json(updatedLocation);
    } catch (err) {
        res.status(400).json({ message: 'Error updating location: ' + err.message });
    }
});

// --- 4. DELETE a location ---
router.delete('/:id', async (req, res) => {
    try {
        const deletedLocation = await Location.findByIdAndDelete(req.params.id);
        if (deletedLocation == null) {
            return res.status(404).json({ message: 'Cannot find location' });
        }
        res.json({ message: 'Deleted Location' });
    } catch (err) {
        console.error("Error deleting location:", err);
        res.status(500).json({ message: 'Error deleting location: ' + err.message });
    }
});

module.exports = router;