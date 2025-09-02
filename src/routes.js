var express = require("express"),
routes = express.Router();

var rosterController = require('./controller/roster-controller')
var songsController = require('./controller/songs-controller')
var songsMasterListController = require('./controller/songsMasterList-controller')
var authController = require('./controller/auth-controller')
var quietTimeController = require('./controller/quietTime-controller')

routes.post("/uploadRoster",rosterController.rosterUploadModule);

routes.get("/getRoster", rosterController.getRosterModule);
routes.post("/sendRosterEmail", authController.verifyToken, rosterController.sendRosterEmail);
  
routes.get("/getSongs",songsController.getWeeklySongs)

routes.post("/uploadSongsMasterList", songsMasterListController.uploadSongsMasterList);
routes.get("/getSongsByCategory/:category", songsMasterListController.getSongsByCategory);
routes.get("/getAllMasterSongs", songsMasterListController.getAllSongs);

routes.post("/login", authController.login);

routes.post("/uploadQuietTimeNote", authController.verifyToken, quietTimeController.upload.single('image'), quietTimeController.uploadQuietTimeNote);
routes.get("/getMyNotes", authController.verifyToken, quietTimeController.getMyNotes);
routes.get("/getMenteeNotes", authController.verifyToken, quietTimeController.getMenteeNotes);
routes.get("/getMentees", authController.verifyToken, quietTimeController.getMentees);
routes.get("/getMenteeNotes/:menteeId", authController.verifyToken, quietTimeController.getMenteeNotesByUser);
routes.get("/getStats", authController.verifyToken, quietTimeController.getStats);

module.exports = routes;