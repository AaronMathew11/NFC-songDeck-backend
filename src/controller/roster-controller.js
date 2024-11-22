var Data = require('../models/Data')


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
      result = await Data.find();
      res.send({status:200, success:true, data:result});
    }
    catch(e)
    {
        res.send({status:400, success:false, msg:"could not fetch Roster"});
    }
  };

module.exports = { getRosterModule, rosterUploadModule };