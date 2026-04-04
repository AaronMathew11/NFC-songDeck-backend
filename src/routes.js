var express = require("express"),
routes = express.Router();

var rosterController = require('./controller/roster-controller')
var songsController = require('./controller/songs-controller')
var songsMasterListController = require('./controller/songsMasterList-controller')
var authController = require('./controller/auth-controller')
var quietTimeController = require('./controller/quietTime-controller')
var publishRequestController = require('./controller/publishRequest-controller')
var notificationController = require('./controller/notification-controller')
var youtubeController = require('./controller/youtube-controller')
var verseController = require('./controller/verse-controller')
var resourcesController = require('./controller/resources-controller')
var uploadController = require('./controller/upload-controller')

routes.post("/uploadRoster",rosterController.rosterUploadModule);

routes.get("/getRoster", rosterController.getRosterModule);
routes.post("/sendRosterEmail", authController.verifyToken, rosterController.sendRosterEmail);
  
routes.get("/getSongs",songsController.getWeeklySongs)
routes.delete("/clearWeeklySongs", songsController.clearWeeklySongs)
routes.post("/addTestSongs", songsController.addTestSongsWithChordSheets)

routes.post("/uploadSongsMasterList", songsMasterListController.uploadSongsMasterList);
routes.get("/getSongsByCategory/:category", songsMasterListController.getSongsByCategory);
routes.get("/getAllMasterSongs", songsMasterListController.getAllSongs);

routes.post("/login", authController.login);
routes.post("/register", authController.register);
routes.post("/auth/google", authController.googleAuth);
routes.get("/me", authController.verifyToken, authController.getCurrentUser);

routes.post("/uploadQuietTimeNote", authController.verifyToken, quietTimeController.uploadQuietTimeNote);
routes.get("/getMyNotes", authController.verifyToken, quietTimeController.getMyNotes);
routes.get("/getMenteeNotes", authController.verifyToken, quietTimeController.getMenteeNotes);
routes.get("/getMentees", authController.verifyToken, quietTimeController.getMentees);
routes.get("/getMenteeNotes/:menteeId", authController.verifyToken, quietTimeController.getMenteeNotesByUser);
routes.get("/getStats", authController.verifyToken, quietTimeController.getStats);
routes.get("/getWeeklyAnalytics", authController.verifyToken, quietTimeController.getWeeklyAnalytics);

// Publish request routes
routes.post("/submitPublishRequest", authController.verifyToken, publishRequestController.submitPublishRequest);
routes.get("/getAllPublishRequests", authController.verifyToken, publishRequestController.getAllPublishRequests);
routes.get("/getMyPublishRequests", authController.verifyToken, publishRequestController.getMyPublishRequests);
routes.put("/updatePublishRequestStatus/:requestId", authController.verifyToken, publishRequestController.updatePublishRequestStatus);
routes.get("/getPendingRequestsCount", authController.verifyToken, publishRequestController.getPendingRequestsCount);

// Notification routes
routes.post("/saveNotificationToken", authController.verifyToken, notificationController.saveNotificationToken);
routes.delete("/removeNotificationToken", authController.verifyToken, notificationController.removeNotificationToken);
routes.post("/testNotification", authController.verifyToken, notificationController.sendTestNotification);

// YouTube routes
routes.get("/youtube/auth", authController.verifyToken, youtubeController.startAuth);
routes.get("/youtube/callback", youtubeController.handleCallback);
routes.get("/youtube/status", authController.verifyToken, youtubeController.getConnectionStatus);
routes.delete("/youtube/disconnect", authController.verifyToken, youtubeController.disconnect);

// Community Verse routes
routes.get("/verse", verseController.getCurrentVerse);
routes.put("/verse", authController.verifyToken, verseController.setVerse);
routes.get("/verse/history", authController.verifyToken, verseController.getVerseHistory);

// Resources routes
routes.get("/resources", resourcesController.getResources);
routes.get("/my-resources", authController.verifyToken, resourcesController.getMyResources);
routes.delete("/resources/:resourceId", authController.verifyToken, resourcesController.deleteResource);
routes.get("/resources/:resourceId/download", resourcesController.downloadResource);
routes.put("/resources/:resourceId", authController.verifyToken, resourcesController.updateResource);

// Upload routes
routes.post("/upload", authController.verifyToken, uploadController.uploadSingle);
routes.post("/upload/multiple", authController.verifyToken, uploadController.uploadMultiple);
routes.get("/upload/info", uploadController.getUploadInfo);
routes.post("/upload/test", uploadController.testUpload);

module.exports = routes;