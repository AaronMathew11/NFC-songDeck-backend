const mongoose = require("mongoose");

const songsMasterListSchema = new mongoose.Schema({
  songName: { type: String, required: true },
  youtubeId: { type: String, required: true },
  category: { type: String, required: true }
}, { timestamps: true });

const SongsMasterList = mongoose.model("SongsMasterList", songsMasterListSchema, "songsMasterList");

module.exports = SongsMasterList;