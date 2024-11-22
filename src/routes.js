var express = require("express"),
routes = express.Router();

var rosterController = require('./controller/roster-controller')


//test get request
// routes.get("/test",rosterController.testModule)

routes.post("/uploadRoster",rosterController.rosterUploadModule);

routes.get("/getRoster", rosterController.getRosterModule);
  
// //upload excel from admin
// routes.post("/uploadExcel", upload.single('file'), uploadController.uploadFile);

// //get excel data
// routes.get("/getExcel",uploadController.getExcel);


// //upload teaching excel
// routes.post("/uploadTeachingExcel",upload.single('file'),uploadController.teachingExcelUpload);

// //get teaching excel data
// routes.get("/getTeachingExcel",uploadController.getTeachingExcel)

// //upload worship excel
// routes.post("/uploadWorshipExcel",upload.single('file'),uploadController.WorshipExcelUpload);


// //get worship excel data
// routes.get("/getWorshipExcel",uploadController.getWorshipExcel);

// //get prayers
// routes.get("/getPrayerRequests",prayerController.getPrayers);


// //upload kitchen menu
// routes.post("/uploadKitchenMenu",kitchenMenuController.uploadKitchenMenu);

// //get kitchen menu
// routes.get("/getKitchenMenu",kitchenMenuController.getKitchenMenu);



// //upload upcoming events
// routes.post("/uploadUpcomingEvents",eventController.uploadUpcomingEvent);

// //delete upcoming events
// routes.delete("/deleteUpcomingEvents",eventController.deleteUpcomingEvent);

// //get upcoming events
// routes.get("/getUpcomingEvents",eventController.getUpcomingEvents);



// //upload this week stuff
// routes.post("/uploadThisWeek",upload.single('coverImage'),weeklyEventController.uploadThisWeek);

// //get week stuff
// routes.get("/getThisWeek",weeklyEventController.getThisWeek);


// //upload current event stuff
// routes.post("/uploadCurrentEvent",eventController.uploadCurrentEvent);

// //delete current event
// routes.delete("/deleteCurrentEvent",eventController.deleteCurrentEvent);

// //get current event
// routes.get("/getCurrentEvents",eventController.getCurrentEvent);


// //upload previous event stuff
// routes.post("/uploadPreviousEvent",eventController.uploadPastEvent);

// //delete previous event
// routes.delete("/deletePreviousEvent",eventController.deletePastEvent);

// //get previous events
// routes.get("/getPreviousEvent",eventController.getPreviousEvent);


// //upload cell data
// routes.post("/uploadCellData",cellController.uploadCell);



// //upload Prayer point
// routes.post("/uploadPrayer", prayerController.uploadPrayer);

// //upload testimony
// routes.post("/uploadTestimony",testimonyController.uploadTestimony);

// //get testimony
// routes.get("/getTestimony",testimonyController.getTestimony);


// //upload open Kitchen
// // routes

// //upload prophetic word
// routes.post("/uploadPropheticWord",propheticWordController.uploadPropheticWord);

// //get prophetic word
// routes.get("/getPropheticWord",propheticWordController.getPropheticWord);

// //update prophetic word
// routes.post("/updatePropheticWord",propheticWordController.updatePropheticWord);

// //upload feedback
// routes.post("/uploadFeedback",async (req,res)=>{
//   try{
//     message={
//       message:req.body.message
//     }
//     result=await feedback.create(message);
//     res.send({status:200, success:true, data:result});
//   }
//   catch(e)
//   {
//     res.send({status:200, success:false, msg:"could not upload feedback"});
//   }
// })

// //add worship schedule
// routes.post("/uploadWorshipSchedule",worshipController.uploadWorshipSchedule);

// //get worship schedule
// routes.get("/getWorshipSchedule", worshipController.getWorshipSchedule);


// //upload kitchen
// routes.post("/uploadKitchen", kitchenController.uploadKitchen);

// //get kitchens
// routes.get("/getKitchens",kitchenController.getKitchens);


// routes.post("/register", userController.registerUser);
// routes.post("/login", userController.loginUser);

// routes.get(
//   "/special",
//   passport.authenticate("jwt", { session: false }),
//   (req, res) => {
//     return res.json({ msg: `Hey ${req.user.email}! i open at the close` });
//   }
// );

module.exports = routes;