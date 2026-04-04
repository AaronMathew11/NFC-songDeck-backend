const { google } = require('googleapis');
const User = require('../models/User');
const functions = require('firebase-functions');

class YouTubeService {
  constructor() {
    console.log('YouTube Service initializing...');
    
    // Get credentials from Firebase config or environment variables (with fallback handling)
    let clientId, clientSecret, redirectUri;
    
    try {
      const config = functions.config();
      clientId = config.youtube?.client_id || process.env.YOUTUBE_CLIENT_ID;
      clientSecret = config.youtube?.client_secret || process.env.YOUTUBE_CLIENT_SECRET;
      redirectUri = config.youtube?.redirect_uri || process.env.YOUTUBE_REDIRECT_URI || 'https://api-m2ugc4x7ma-uc.a.run.app/api/youtube/callback';
    } catch (error) {
      console.warn('Firebase config not available, using environment variables:', error.message);
      clientId = process.env.YOUTUBE_CLIENT_ID;
      clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
      redirectUri = process.env.YOUTUBE_REDIRECT_URI || 'https://api-m2ugc4x7ma-uc.a.run.app/api/youtube/callback';
    }
    
    console.log('YouTube OAuth Configuration:');
    console.log('  CLIENT_ID source:', clientId ? (clientId.includes('766869') ? 'Firebase Config' : 'Environment') : 'Missing');
    console.log('  CLIENT_SECRET source:', clientSecret ? (clientSecret.includes('GOCSPX') ? 'Firebase Config' : 'Environment') : 'Missing');  
    console.log('  REDIRECT_URI source:', process.env.YOUTUBE_REDIRECT_URI ? 'Environment' : 'Hardcoded');
    console.log('  Final values:');
    console.log('    CLIENT_ID:', clientId ? 'Set' : 'Missing');
    console.log('    CLIENT_SECRET:', clientSecret ? 'Set' : 'Missing');
    console.log('    REDIRECT_URI:', redirectUri);
    
    // Validate all required values are present
    if (!clientId || !clientSecret || !redirectUri || redirectUri === 'undefined') {
      const missing = [];
      if (!clientId) missing.push('CLIENT_ID');
      if (!clientSecret) missing.push('CLIENT_SECRET');
      if (!redirectUri || redirectUri === 'undefined') missing.push('REDIRECT_URI');
      throw new Error(`YouTube OAuth configuration missing: ${missing.join(', ')}`);
    }
    
    // YouTube Data API v3 configuration
    this.youtube = google.youtube('v3');
    
    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    
    // Required scopes for playlist management
    this.scopes = [
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.force-ssl'
    ];
  }

  /**
   * Generate YouTube OAuth authorization URL
   */
  getAuthUrl(userId) {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopes,
      state: userId, // Pass userId to identify user after OAuth
      prompt: 'consent' // Force consent screen to get refresh token
    });
  }

  /**
   * Handle OAuth callback and store tokens
   */
  async handleOAuthCallback(code, userId) {
    try {
      console.log('Processing OAuth callback for user:', userId);
      console.log('Using authorization code:', code);
      
      // Create a fresh OAuth client for this specific request to ensure all values are set
      let clientId, clientSecret, redirectUri;
      
      try {
        const config = functions.config();
        clientId = config.youtube?.client_id || process.env.YOUTUBE_CLIENT_ID;
        clientSecret = config.youtube?.client_secret || process.env.YOUTUBE_CLIENT_SECRET;
        redirectUri = config.youtube?.redirect_uri || process.env.YOUTUBE_REDIRECT_URI || 'https://api-m2ugc4x7ma-uc.a.run.app/api/youtube/callback';
      } catch (error) {
        console.warn('Firebase config not available in callback, using environment variables:', error.message);
        clientId = process.env.YOUTUBE_CLIENT_ID;
        clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
        redirectUri = process.env.YOUTUBE_REDIRECT_URI || 'https://api-m2ugc4x7ma-uc.a.run.app/api/youtube/callback';
      }
      
      console.log('Fresh OAuth client config:');
      console.log('- Client ID:', clientId ? 'Set' : 'Missing');
      console.log('- Client Secret:', clientSecret ? 'Set' : 'Missing');
      console.log('- Redirect URI:', redirectUri);
      
      const { google } = require('googleapis');
      
      console.log('Google APIs library info:');
      console.log('- Google object type:', typeof google);
      console.log('- Google.auth available:', !!google.auth);
      console.log('- OAuth2 constructor available:', !!google.auth?.OAuth2);
      
      const freshOAuthClient = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
      
      // Manually set redirect URI as backup in case constructor failed
      if (!freshOAuthClient._redirectUri) {
        console.log('WARNING: Redirect URI not set by constructor, setting manually');
        freshOAuthClient._redirectUri = redirectUri;
        freshOAuthClient.redirectUri = redirectUri;
      }
      
      console.log('OAuth client internal config check:');
      console.log('- Client ID set:', !!freshOAuthClient._clientId);
      console.log('- Client Secret set:', !!freshOAuthClient._clientSecret);
      console.log('- Redirect URI set:', freshOAuthClient._redirectUri);
      console.log('- Constructor params passed:', { clientId: !!clientId, clientSecret: !!clientSecret, redirectUri });
      
      // Final validation - check both possible redirect URI properties
      if (!freshOAuthClient._redirectUri && !freshOAuthClient.redirectUri) {
        console.log('Setting redirect URI manually as final fallback...');
        freshOAuthClient._redirectUri = redirectUri;
        freshOAuthClient.redirectUri = redirectUri;
      }
      
      if (!freshOAuthClient._redirectUri && !freshOAuthClient.redirectUri) {
        throw new Error(`OAuth client redirect URI still undefined after all attempts. Values: ${JSON.stringify({clientId, clientSecret, redirectUri})}`);
      }
      
      // Use direct HTTP request to Google OAuth endpoint (more reliable than Google APIs library)
      console.log('Using direct HTTP OAuth request to Google...');
      let response;
      try {
        const axios = require('axios');
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          code: code
        });
        
        console.log('✅ Direct HTTP OAuth successful!');
        console.log('Token response data:', tokenResponse.data);
        response = { tokens: tokenResponse.data };
      } catch (httpError) {
        console.log('❌ Direct HTTP OAuth failed:');
        console.log('  Status:', httpError.response?.status);
        console.log('  Error:', httpError.response?.data);
        console.log('  Message:', httpError.message);
        throw new Error(`OAuth token exchange failed: ${httpError.response?.data?.error_description || httpError.message}`);
      }
      
      const tokens = response ? response.tokens : null;
      if (!tokens) {
        console.log('No tokens in response. Full response structure:', JSON.stringify(response, null, 2));
        throw new Error('No tokens received from OAuth response');
      }
      
      console.log('Storing tokens for user:', userId);
      // Store tokens for the user
      await User.findByIdAndUpdate(userId, {
        youtubeAccessToken: tokens.access_token,
        youtubeRefreshToken: tokens.refresh_token,
        youtubeTokenExpiry: tokens.expiry_date,
        youtubeConnected: true
      });

      console.log('YouTube connection successful for user:', userId);
      return { success: true, tokens };
    } catch (error) {
      console.error('Error handling YouTube OAuth callback:', error);
      throw new Error('Failed to authenticate with YouTube');
    }
  }

  /**
   * Set up OAuth client with user tokens (uses dedicated YouTube OAuth tokens)
   */
  async setupUserAuth(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    console.log('Setting up YouTube auth for user:', userId);
    console.log('User has youtubeAccessToken:', !!user.youtubeAccessToken);
    console.log('User has youtubeRefreshToken:', !!user.youtubeRefreshToken);

    // Only use YouTube-specific OAuth tokens
    if (user.youtubeAccessToken) {
      console.log('✅ Using YouTube OAuth tokens');
      console.log('Access token length:', user.youtubeAccessToken.length);
      console.log('Has refresh token:', !!user.youtubeRefreshToken);
      
      // Set credentials for the OAuth2 client
      this.oauth2Client.setCredentials({
        access_token: user.youtubeAccessToken,
        refresh_token: user.youtubeRefreshToken,
        expiry_date: user.youtubeTokenExpiry
      });

      // IMPORTANT: Set global auth for Google APIs
      google.options({ auth: this.oauth2Client });

      // Check if token needs refresh
      if (user.youtubeTokenExpiry && Date.now() >= user.youtubeTokenExpiry) {
        console.log('Token expired, refreshing...');
        await this.refreshUserToken(userId);
      }

      console.log('✅ YouTube API authentication configured');
      return true;
    }

    console.log('❌ No YouTube OAuth tokens found for user:', userId);
    console.log('User needs to connect YouTube account');
    throw new Error('User not connected to YouTube. Please connect your YouTube account.');
  }

  /**
   * Refresh expired access token
   */
  async refreshUserToken(userId) {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      await User.findByIdAndUpdate(userId, {
        youtubeAccessToken: credentials.access_token,
        youtubeTokenExpiry: credentials.expiry_date
      });

      this.oauth2Client.setCredentials(credentials);
      return credentials;
    } catch (error) {
      console.error('Error refreshing YouTube token:', error);
      // If refresh fails, disconnect user
      await User.findByIdAndUpdate(userId, {
        youtubeAccessToken: null,
        youtubeRefreshToken: null,
        youtubeTokenExpiry: null,
        youtubeConnected: false
      });
      throw new Error('YouTube authentication expired. Please reconnect.');
    }
  }

  /**
   * Create a new YouTube playlist
   */
  async createPlaylist(userId, title, description = '', isPrivate = false) {
    try {
      await this.setupUserAuth(userId);

      const playlistResponse = await this.youtube.playlists.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: title,
            description: description,
            defaultLanguage: 'en'
          },
          status: {
            privacyStatus: isPrivate ? 'private' : 'public'
          }
        }
      });

      return playlistResponse.data;
    } catch (error) {
      console.error('Error creating YouTube playlist:', error);
      throw new Error(`Failed to create playlist: ${error.message}`);
    }
  }

  /**
   * Add video to playlist
   */
  async addVideoToPlaylist(userId, playlistId, videoId) {
    try {
      await this.setupUserAuth(userId);

      const playlistItemResponse = await this.youtube.playlistItems.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            playlistId: playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId: videoId
            }
          }
        }
      });

      return playlistItemResponse.data;
    } catch (error) {
      console.error('Error adding video to playlist:', error);
      // Don't throw error for individual video failures
      return null;
    }
  }

  /**
   * Create playlist with multiple videos
   */
  async createPlaylistWithVideos(userId, title, videoIds, description = '') {
    try {
      console.log(`Creating YouTube playlist: "${title}" for user ${userId}`);
      
      // Create the playlist
      const playlist = await this.createPlaylist(userId, title, description);
      const playlistId = playlist.id;
      
      console.log(`Created playlist with ID: ${playlistId}`);

      // Add videos to playlist
      const addedVideos = [];
      const failedVideos = [];

      for (const videoId of videoIds) {
        try {
          const result = await this.addVideoToPlaylist(userId, playlistId, videoId);
          if (result) {
            addedVideos.push(videoId);
            console.log(`Added video ${videoId} to playlist`);
          } else {
            failedVideos.push(videoId);
          }
        } catch (error) {
          console.error(`Failed to add video ${videoId}:`, error);
          failedVideos.push(videoId);
        }
      }

      return {
        playlist,
        playlistId,
        addedVideos,
        failedVideos,
        playlistUrl: `https://www.youtube.com/playlist?list=${playlistId}`
      };
    } catch (error) {
      console.error('Error creating playlist with videos:', error);
      throw error;
    }
  }

  /**
   * Disconnect user from YouTube
   */
  async disconnectUser(userId) {
    try {
      await User.findByIdAndUpdate(userId, {
        youtubeAccessToken: null,
        youtubeRefreshToken: null,
        youtubeTokenExpiry: null,
        youtubeConnected: false
      });
      return { success: true };
    } catch (error) {
      console.error('Error disconnecting YouTube:', error);
      throw new Error('Failed to disconnect YouTube account');
    }
  }

  /**
   * Extract YouTube video ID from URL or return if already ID
   */
  extractVideoId(urlOrId) {
    if (!urlOrId) return null;

    // If it's already a video ID (11 characters, alphanumeric)
    if (urlOrId.length === 11 && /^[a-zA-Z0-9_-]+$/.test(urlOrId)) {
      return urlOrId;
    }

    // Extract from various YouTube URL formats
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/
    ];

    for (const pattern of patterns) {
      const match = urlOrId.match(pattern);
      if (match) return match[1];
    }

    return null;
  }
}

module.exports = new YouTubeService();