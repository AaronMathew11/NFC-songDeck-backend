var express = require("express");
// var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var config = require("./config/config");
var port = 3000;
const cors = require("cors");
const cron = require('node-cron');
const { sendWeeklyRoster } = require('./services/emailService');


var app = express();

app.use(cors());

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));


app.get("/", function (req, res) {
  return res.send("hello the api is at http://localhost:" + port + "/api");
});

var routes = require("./routes.js");
app.use("/api", routes);

mongoose.connect(config.db);

const connection = mongoose.connection;

connection.once("open", () => {
  console.log("Connected");
  
  // Schedule weekly roster emails every Monday at 9 AM
  cron.schedule('0 9 * * 1', async () => {
    console.log('Running weekly roster email job...');
    await sendWeeklyRoster();
  }, {
    timezone: "America/New_York" // Adjust timezone as needed
  });
  
  console.log("Weekly roster email scheduler initialized - runs every Monday at 9 AM");
});

connection.on("error", (err) => {
  console.log("connection error");
  process.exit();
});

app.listen(port);
console.log(" yaaay : http://localhost:" + port);