const User = require('../models/User');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp();
}

// Save FCM token for user
exports.saveNotificationToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.id;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    await User.findByIdAndUpdate(userId, { fcmToken });

    res.status(200).json({
      success: true,
      message: 'FCM token saved successfully'
    });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving FCM token',
      error: error.message
    });
  }
};

// Remove FCM token for user
exports.removeNotificationToken = async (req, res) => {
  try {
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, { fcmToken: null });

    res.status(200).json({
      success: true,
      message: 'FCM token removed successfully'
    });
  } catch (error) {
    console.error('Error removing FCM token:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing FCM token',
      error: error.message
    });
  }
};

// Send notification to specific user
exports.sendNotificationToUser = async (userId, title, body, data = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.fcmToken) {
      console.log(`No FCM token found for user ${userId}`);
      return false;
    }

    const message = {
      notification: {
        title: title,
        body: body
      },
      data: {
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        ...data
      },
      token: user.fcmToken,
      webpush: {
        headers: {
          'TTL': '86400'
        },
        notification: {
          title: title,
          body: body,
          icon: '/logo192.png',
          badge: '/logo192.png',
          requireInteraction: true
        },
        fcm_options: {
          link: '/'
        }
      }
    };

    console.log(`Sending notification to ${user.email}:`, { title, body });
    console.log('Full message payload:', JSON.stringify(message, null, 2));
    console.log('FCM token being used:', user.fcmToken.substring(0, 20) + '...');
    
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    console.log('Message ID:', response);
    return true;
  } catch (error) {
    console.error('Error sending notification to user:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // If token is invalid, remove it from user
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      console.log(`Removing invalid FCM token for user ${userId}`);
      await User.findByIdAndUpdate(userId, { fcmToken: null });
    }
    
    return false;
  }
};

// Send notification to worship heads
exports.sendNotificationToWorshipHeads = async (title, body, data = {}) => {
  try {
    console.log('Looking for worship heads with FCM tokens...');
    
    // Get all worship heads (users with specific email or role)
    const worshipHeads = await User.find({ 
      email: 'rachitfrancis28@gmail.com',
      fcmToken: { $ne: null }
    });

    console.log(`Found ${worshipHeads.length} worship heads with FCM tokens`);
    
    if (worshipHeads.length === 0) {
      console.log('No worship heads found with FCM tokens. Checking all rachitfrancis28@gmail.com users...');
      const allRachitUsers = await User.find({ email: 'rachitfrancis28@gmail.com' });
      console.log(`Total rachitfrancis28@gmail.com users: ${allRachitUsers.length}`);
      allRachitUsers.forEach(user => {
        console.log(`User ${user.email} has FCM token: ${user.fcmToken ? 'YES' : 'NO'}`);
      });
    }

    for (const user of worshipHeads) {
      console.log(`Sending notification to worship head: ${user.email}`);
      await this.sendNotificationToUser(user._id, title, body, data);
    }

    return worshipHeads.length;
  } catch (error) {
    console.error('Error sending notifications to worship heads:', error);
    return 0;
  }
};

// Send notification to all users with tokens
exports.sendNotificationToAllUsers = async (title, body, data = {}) => {
  try {
    const users = await User.find({ fcmToken: { $ne: null } });

    for (const user of users) {
      await this.sendNotificationToUser(user._id, title, body, data);
    }

    return users.length;
  } catch (error) {
    console.error('Error sending notifications to all users:', error);
    return 0;
  }
};

// Send daily quiet time reminder to all users
exports.sendDailyQuietTimeReminder = async () => {
  try {
    console.log('Sending daily quiet time reminder to all users...');
    
    const title = 'Quiet Time Reminder 🙏';
    const body = 'This is your reminder to spend time with God today - Upload your quiet time notes whenever possible';
    const data = {
      type: 'daily_quiet_time_reminder',
      timestamp: new Date().toISOString()
    };

    const userCount = await this.sendNotificationToAllUsers(title, body, data);
    console.log(`Daily quiet time reminder sent to ${userCount} users`);
    
    return userCount;
  } catch (error) {
    console.error('Error sending daily quiet time reminder:', error);
    return 0;
  }
};

// Send Wednesday midweek roster reminder to all users
exports.sendMidweekRosterReminder = async () => {
  try {
    console.log('Sending midweek roster reminder to all users...');
    
    const title = 'Midweek Check-in 📅';
    const body = 'We are midway through the week - Remember to check if you are rostered in for this week';
    const data = {
      type: 'midweek_roster_reminder',
      timestamp: new Date().toISOString()
    };

    const userCount = await this.sendNotificationToAllUsers(title, body, data);
    console.log(`Midweek roster reminder sent to ${userCount} users`);
    
    return userCount;
  } catch (error) {
    console.error('Error sending midweek roster reminder:', error);
    return 0;
  }
};

// Send Friday worship practice reminder to all users
exports.sendWorshipPracticeReminder = async () => {
  try {
    console.log('Sending worship practice reminder to all users...');
    
    const title = 'Worship Practice Tomorrow 🎵';
    const body = 'Worship practice tomorrow - remember to listen to the songs and prepare well';
    const data = {
      type: 'worship_practice_reminder',
      timestamp: new Date().toISOString()
    };

    const userCount = await this.sendNotificationToAllUsers(title, body, data);
    console.log(`Worship practice reminder sent to ${userCount} users`);
    
    return userCount;
  } catch (error) {
    console.error('Error sending worship practice reminder:', error);
    return 0;
  }
};

// Send test notification to current user
exports.sendTestNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, body } = req.body;
    
    const testTitle = title || '🧪 Test Notification';
    const testBody = body || 'This is a test notification from your NFC Worship App! If you can see this, push notifications are working correctly.';
    
    console.log(`Sending test notification to user ${userId}:`, { title: testTitle, body: testBody });
    
    const success = await this.sendNotificationToUser(userId, testTitle, testBody, {
      type: 'test_notification',
      timestamp: new Date().toISOString()
    });
    
    if (success) {
      res.status(200).json({
        success: true,
        message: 'Test notification sent successfully!'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to send test notification. Make sure you have notifications enabled.'
      });
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending test notification',
      error: error.message
    });
  }
};