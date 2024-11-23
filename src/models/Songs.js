const mongoose = require("mongoose");

// Define the schema for the song data
const songSchema = new mongoose.Schema({
  songName: { type: String, required: true },
  link: { type: String, required: true }
});

// Create a model using the schema
const Song = mongoose.model("Song", songSchema, "songs");

module.exports = Song;