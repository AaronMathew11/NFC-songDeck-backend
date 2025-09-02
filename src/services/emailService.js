const nodemailer = require('nodemailer');
const User = require('../models/User');
const Data = require('../models/Data');

// Email configuration - you'll need to set up environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER || 'aaronstone11.2001@gmail.com',
    pass: process.env.EMAIL_PASS || 'fina orig sjeq tjdo'
  }
});

const generateRosterEmailHTML = (rosterData) => {
  const today = new Date();
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + (7 - today.getDay()));
  const formattedDate = nextSunday.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
        .roster-card { background: #f9f9f9; margin: 15px 0; padding: 20px; border-radius: 10px; }
        .role { font-weight: bold; color: #1f2937; }
        .name { color: #4b5563; margin-left: 10px; }
        .date-header { color: #1f2937; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎵 Worship Team Roster</h1>
        <p>Weekly schedule for ${formattedDate}</p>
      </div>
      
      <div style="padding: 20px;">
        ${rosterData.map(day => `
          <div class="roster-card">
            <div class="date-header">${day.Date}</div>
            <div><span class="role">Lead/Lyrics:</span><span class="name">${day['Lead/ Lyrics/ Posting'] || 'TBA'}</span></div>
            <div><span class="role">Guitar:</span><span class="name">${day['Guitar'] || 'TBA'}</span></div>
            <div><span class="role">Bass:</span><span class="name">${day['Bass'] || 'TBA'}</span></div>
            <div><span class="role">Keyboard:</span><span class="name">${day['Keyboard'] || 'TBA'}</span></div>
            <div><span class="role">Drums:</span><span class="name">${day['Drums'] || 'TBA'}</span></div>
            <div><span class="role">Supporting Vocals:</span><span class="name">${day['Supporting Vocals'] || 'TBA'}</span></div>
          </div>
        `).join('')}
      </div>
      
      <div class="footer">
        <p>NFC Worship App - Automated Weekly Roster</p>
        <p>This email was sent automatically every Monday</p>
      </div>
    </body>
    </html>
  `;
};

const sendWeeklyRoster = async () => {
  try {
    console.log('Starting weekly roster email send...');
    
    // Get all users with emails
    const users = await User.find({ email: { $exists: true, $ne: null } }).select('name email');
    
    if (users.length === 0) {
      console.log('No users with emails found');
      return;
    }
    
    // Get roster data for upcoming week
    const roster = await Data.find();
    const today = new Date();
    const oneWeekFromNow = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    const parseRosterDate = (dateStr) => {
      // Parse dates like "2nd November 2025"
      const parts = dateStr.split(' ');
      const day = parseInt(parts[0].replace(/\D/g, ''));
      const month = parts[1];
      const year = parseInt(parts[2]);
      
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const monthIndex = monthNames.indexOf(month);
      
      return new Date(year, monthIndex, day);
    };
    
    const upcomingRoster = roster.filter(day => {
      const rosterDate = parseRosterDate(day.Date);
      return rosterDate > today && rosterDate < oneWeekFromNow;
    }).sort((a, b) => parseRosterDate(a.Date) - parseRosterDate(b.Date));
    
    if (upcomingRoster.length === 0) {
      console.log('No upcoming roster data found');
      return;
    }
    
    const emailHTML = generateRosterEmailHTML(upcomingRoster);
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + (7 - today.getDay()));
    const formattedNextSunday = nextSunday.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Send emails to all users
    const emailPromises = users.map(user => {
      return transporter.sendMail({
        from: process.env.EMAIL_USER || 'nfc-worship@example.com',
        to: user.email,
        subject: `🎵 Worship Team Roster - ${formattedNextSunday}`,
        html: emailHTML
      });
    });
    
    await Promise.all(emailPromises);
    console.log(`Weekly roster emails sent to ${users.length} users`);
    
  } catch (error) {
    console.error('Error sending weekly roster emails:', error);
  }
};

module.exports = {
  sendWeeklyRoster,
  generateRosterEmailHTML
};