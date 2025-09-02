const QuietTimeNote = require('../models/QuietTimeNote');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `note-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const uploadQuietTimeNote = async (req, res) => {
  try {
    const { note } = req.body;
    const userId = req.user._id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    
    const quietTimeNote = new QuietTimeNote({
      userId,
      imageUrl,
      note: note || ''
    });

    await quietTimeNote.save();

    await updateStreak(userId);

    res.status(201).json({
      message: 'Quiet time note uploaded successfully',
      note: quietTimeNote
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload note' });
  }
};

const updateStreak = async (userId) => {
  try {
    const user = await User.findById(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastQuietTime = user.lastQuietTime ? new Date(user.lastQuietTime) : null;
    
    if (lastQuietTime) {
      lastQuietTime.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today - lastQuietTime) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        return;
      } else if (daysDiff === 1) {
        user.currentStreak += 1;
      } else {
        user.currentStreak = 1;
      }
    } else {
      user.currentStreak = 1;
    }
    
    if (user.currentStreak > user.longestStreak) {
      user.longestStreak = user.currentStreak;
    }
    
    user.lastQuietTime = new Date();
    user.totalQuietTimes += 1;
    
    await user.save();
  } catch (error) {
    console.error('Streak update error:', error);
  }
};

const getMyNotes = async (req, res) => {
  try {
    const userId = req.user._id;
    const notes = await QuietTimeNote.find({ userId }).sort({ createdAt: -1 });
    
    res.status(200).json(notes);
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
};

const getMenteeNotes = async (req, res) => {
  try {
    const mentorId = req.user._id;
    
    const mentees = await User.find({ mentorId });
    const menteeIds = mentees.map(m => m._id);
    
    const notes = await QuietTimeNote.find({ userId: { $in: menteeIds } })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json(notes);
  } catch (error) {
    console.error('Get mentee notes error:', error);
    res.status(500).json({ error: 'Failed to fetch mentee notes' });
  }
};

const getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    res.status(200).json({
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      totalQuietTimes: user.totalQuietTimes,
      lastQuietTime: user.lastQuietTime
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

const getMentees = async (req, res) => {
  try {
    const mentorId = req.user._id;
    
    const mentees = await User.find({ mentorId }).select('_id name email currentStreak totalQuietTimes lastQuietTime longestStreak');
    
    res.status(200).json(mentees);
  } catch (error) {
    console.error('Get mentees error:', error);
    res.status(500).json({ error: 'Failed to fetch mentees' });
  }
};

const getMenteeNotesByUser = async (req, res) => {
  try {
    const { menteeId } = req.params;
    const mentorId = req.user._id;
    
    const mentee = await User.findOne({ _id: menteeId, mentorId });
    if (!mentee) {
      return res.status(403).json({ error: 'Not authorized to view this mentee\'s notes' });
    }
    
    const notes = await QuietTimeNote.find({ userId: menteeId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json(notes);
  } catch (error) {
    console.error('Get mentee notes error:', error);
    res.status(500).json({ error: 'Failed to fetch mentee notes' });
  }
};

module.exports = {
  upload,
  uploadQuietTimeNote,
  getMyNotes,
  getMenteeNotes,
  getMentees,
  getMenteeNotesByUser,
  getStats
};