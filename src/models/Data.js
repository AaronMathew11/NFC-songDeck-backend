var mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({}, { strict: false });
const Data = mongoose.model("Data", dataSchema, "test");
module.exports = Data