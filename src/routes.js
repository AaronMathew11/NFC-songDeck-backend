var express = require("express"),
routes = express.Router();

var rosterController = require('./controller/roster-controller')
var songsController = require('./controller/songs-controller')

routes.post("/uploadRoster",rosterController.rosterUploadModule);

routes.get("/getRoster", rosterController.getRosterModule);
  
routes.get("/getSongs",songsController.getWeeklySongs)

module.exports = routes;