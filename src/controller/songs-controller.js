var Songs = require('../models/Songs')


const getWeeklySongs = async (req, res) => {
    try {
      result = await Songs.find();
      res.send({status:200, success:true, data:result});
    }
    catch(e)
    {
        res.send({status:400, success:false, msg:"could not fetch Songs"});
    }
  };

module.exports = { getWeeklySongs };