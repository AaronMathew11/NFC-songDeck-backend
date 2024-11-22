var express = require("express");
// var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var config = require("./config/config");
var port = 3000;
const cors = require("cors");


var app = express();

app.use(cors());

app.use(express.urlencoded({ extended: false }));
app.use(express.json());


app.get("/", function (req, res) {
  return res.send("hello the api is at http://localhost:" + port + "/api");
});

var routes = require("./routes.js");
app.use("/api", routes);

mongoose.connect(config.db);

const connection = mongoose.connection;

connection.once("open", () => {
  console.log("Connected");
});
connection.on("error", (err) => {
  console.log("connection error");
  process.exit();
});



app.listen(port);
console.log(" yaaay : http://localhost:" + port);