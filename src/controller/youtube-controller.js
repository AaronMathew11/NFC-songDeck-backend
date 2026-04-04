const youtubeService = require('../services/youtubeService');
const User = require('../models/User');
const functions = require('firebase-functions');

// Temporary storage for OAuth sessions (in production, use Redis or database)
const oauthSessions = new Map();

// Start YouTube OAuth flow
exports.startAuth = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Starting YouTube OAuth for user ID:', userId);
    
    // Generate a session ID for this OAuth attempt
    const sessionId = `yt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store user ID with session ID (expires in 10 minutes)
    oauthSessions.set(sessionId, {
      userId: userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
    });
    
    const authUrl = youtubeService.getAuthUrl(sessionId); // Use session ID instead of user ID
    console.log('Generated OAuth URL:', authUrl);
    console.log('Created OAuth session:', sessionId, 'for user:', userId);
    
    res.json({
      success: true,
      authUrl: authUrl
    });
  } catch (error) {
    console.error('Error starting YouTube auth:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting YouTube authentication'
    });
  }
};

// Handle OAuth callback
exports.handleCallback = async (req, res) => {
  try {
    // Debug logging
    console.log('YouTube OAuth callback received:');
    console.log('Query params:', req.query);
    console.log('Body:', req.body);
    console.log('Headers:', req.headers);
    
    const { code, state } = req.query;

    if (!code) {
      console.log('Missing authorization code');
      return res.status(400).json({
        success: false,
        message: 'Missing authorization code',
        debug: {
          hasCode: !!code,
          hasState: !!state,
          query: req.query
        }
      });
    }

    // Clean up expired sessions
    for (const [sessionId, session] of oauthSessions.entries()) {
      if (Date.now() > session.expiresAt) {
        oauthSessions.delete(sessionId);
      }
    }

    let userId = null;
    
    if (state) {
      // Try to get user ID from session storage
      const session = oauthSessions.get(state);
      if (session && Date.now() <= session.expiresAt) {
        userId = session.userId;
        console.log('Retrieved user ID from session:', userId);
        // Clean up the used session
        oauthSessions.delete(state);
      } else {
        console.log('Session not found or expired:', state);
      }
    }

    if (!userId) {
      console.log('Could not determine user ID - session may have expired');
      const frontendUrl = process.env.FRONTEND_URL || 'https://nfc-soundeck.netlify.app';
      return res.redirect(`${frontendUrl}/youtube-auth-error?error=${encodeURIComponent('Session expired. Please try connecting YouTube again from the app.')}`);
    }

    try {
      await youtubeService.handleOAuthCallback(code, userId);

      // Redirect back to profile page where the YouTube connection component is  
      const frontendUrl = process.env.FRONTEND_URL || 'https://nfc-soundeck.netlify.app';
      res.redirect(`${frontendUrl}/profile?youtube=connected`);
    } catch (callbackError) {
      console.error('YouTube OAuth callback processing failed:', callbackError);
      const frontendUrl = process.env.FRONTEND_URL || 'https://nfc-soundeck.netlify.app';
      res.redirect(`${frontendUrl}/profile?youtube=error&message=${encodeURIComponent(callbackError.message)}`);
    }
  } catch (error) {
    console.error('Error handling YouTube callback:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'https://nfc-soundeck.netlify.app';
    res.redirect(`${frontendUrl}/youtube-auth-error?error=${encodeURIComponent(error.message)}`);
  }
};

// Check YouTube connection status
exports.getConnectionStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('youtubeAccessToken youtubeRefreshToken youtubeConnected');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // User is connected to YouTube only if they have YouTube OAuth tokens
    const connected = !!(user?.youtubeAccessToken && user?.youtubeRefreshToken);
    
    console.log('YouTube connection status for user:', userId);
    console.log('- Has youtubeAccessToken:', !!user?.youtubeAccessToken);
    console.log('- Has youtubeRefreshToken:', !!user?.youtubeRefreshToken);
    console.log('- Connected:', connected);
    
    res.json({
      success: true,
      connected: connected,
      connectionType: 'youtube-oauth'
    });
  } catch (error) {
    console.error('Error checking YouTube connection:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking connection status'
    });
  }
};

// Disconnect YouTube account
exports.disconnect = async (req, res) => {
  try {
    const userId = req.user.id;
    await youtubeService.disconnectUser(userId);
    
    res.json({
      success: true,
      message: 'YouTube account disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting YouTube:', error);
    res.status(500).json({
      success: false,
      message: 'Error disconnecting YouTube account'
    });
  }
};

// Test playlist creation (for development/testing)
exports.testCreatePlaylist = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🧪 Testing YouTube playlist creation for user:', userId);
    
    // Use default test values if not provided
    const title = req.body.title || `NFC Test Playlist - ${new Date().toLocaleString()}`;
    const videoIds = req.body.videoIds || ['EqYBXFYYsxc', 'x9Bgxzk_P8w']; // Test worship songs
    
    console.log('📋 Creating test playlist:', { title, videoIds });

    const result = await youtubeService.createPlaylistWithVideos(
      userId, 
      title, 
      videoIds,
      '🎵 Test playlist created from NFC Worship App\n\nThis is a test to verify YouTube integration is working properly.'
    );

    console.log('✅ Test playlist created successfully:', result.playlistUrl);

    res.json({
      success: true,
      message: '🎉 Test playlist created successfully!',
      playlistUrl: result.playlistUrl,
      playlistId: result.playlistId,
      addedVideos: result.addedVideos,
      failedVideos: result.failedVideos,
      result: result
    });
  } catch (error) {
    console.error('❌ Error creating test playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test playlist',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};