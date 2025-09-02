const SongsMasterList = require('../models/SongsMasterList');

const uploadSongsMasterList = async (req, res) => {
  try {
    const songs = req.body;
    
    if (!Array.isArray(songs)) {
      return res.status(400).json({ error: 'Expected an array of songs' });
    }

    await SongsMasterList.deleteMany({});
    
    const savedSongs = await SongsMasterList.insertMany(songs);
    
    res.status(200).json({ 
      message: 'Songs uploaded successfully', 
      count: savedSongs.length 
    });
  } catch (error) {
    console.error('Error uploading songs:', error);
    res.status(500).json({ error: 'Failed to upload songs' });
  }
};

const getSongsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const songs = await SongsMasterList.find({ category: category });
    
    res.status(200).json(songs);
  } catch (error) {
    console.error('Error fetching songs by category:', error);
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
};

const getAllSongs = async (req, res) => {
  try {
    const songs = await SongsMasterList.find({});
    
    res.status(200).json(songs);
  } catch (error) {
    console.error('Error fetching all songs:', error);
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
};

module.exports = {
  uploadSongsMasterList,
  getSongsByCategory,
  getAllSongs
};