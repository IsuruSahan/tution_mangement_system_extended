const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const locationSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    // NEW FIELD: Percentage the location takes (e.g., 10 for 10%)
    chargePercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }
}, { timestamps: true });

const Location = mongoose.model('Location', locationSchema);
module.exports = Location;