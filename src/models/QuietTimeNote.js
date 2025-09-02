const mongoose = require("mongoose");

const quietTimeNoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  note: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const QuietTimeNote = mongoose.model("QuietTimeNote", quietTimeNoteSchema, "quietTimeNotes");

module.exports = QuietTimeNote;