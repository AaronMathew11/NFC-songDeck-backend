var Data = require('../models/Data');
const { sendWeeklyRoster } = require('../services/emailService');

const rosterUploadModule = async (req, res) => {
        try {
            await Data.deleteMany({});
    
          const result = await Data.insertMany(req.body.documents);
          res.status(200).send({ success: true, result });
        } catch (error) {
          res.status(500).send({ success: false, error: error.message });
        } 
};

const getRosterModule = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      const total = await Data.countDocuments();
      const result = await Data.find()
        .sort({ Date: 1 })
        .skip(skip)
        .limit(limit);
      
      res.send({
        status: 200, 
        success: true, 
        data: result,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    }
    catch(e)
    {
        res.send({status:400, success:false, msg:"could not fetch Roster"});
    }
  };

const sendRosterEmail = async (req, res) => {
  try {
    await sendWeeklyRoster();
    res.status(200).json({ success: true, message: 'Roster emails sent successfully' });
  } catch (error) {
    console.error('Error sending roster emails:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getRosterModule, rosterUploadModule, sendRosterEmail };