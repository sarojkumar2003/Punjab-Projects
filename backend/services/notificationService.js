const nodemailer = require('nodemailer');  // For email notifications (optional)
const { sendPushNotification } = require('./pushNotificationService');  // Optional: Push notification service for real-time updates

/**
 * Service to send bus arrival notifications to commuters.
 * @param {String} busId - The bus ID.
 * @param {String} busStop - The bus stop name.
 * @param {String} userId - The ID of the user to send notification to.
 */
const notifyBusArrival = async (busId, busStop, userId) => {
  try {
    // Construct the notification message
    const message = `Bus ${busId} is arriving at ${busStop}. Please be ready to board.`;

    // Fetch the user's email or device info (for push notifications)
    const user = await getUserById(userId);  // Assumes you have a method to fetch user details

    if (user) {
      // Send email notification (optional)
      await sendEmailNotification(user.email, message);

      // Send push notification (if user prefers push notifications)
      if (user.pushNotificationEnabled) {
        await sendPushNotification(user.deviceToken, message);  // Assuming device token is stored
      }
    }
  } catch (error) {
    console.error('Error sending bus arrival notification:', error);
    throw error;
  }
};

/**
 * Helper function to send email notifications.
 * @param {String} email - The email address of the user.
 * @param {String} message - The notification message to send.
 */
const sendEmailNotification = async (email, message) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,  // Your email address
        pass: process.env.EMAIL_PASS,  // Your email password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Bus Arrival Notification',
      text: message,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Service to notify a user when their bus is approaching a stop (real-time).
 * @param {String} busId - The bus ID.
 * @param {String} userId - The ID of the user to send notification to.
 * @param {String} estimatedArrivalTime - The estimated arrival time of the bus at the user's stop.
 */
const notifyBusApproaching = async (busId, userId, estimatedArrivalTime) => {
  try {
    const message = `Bus ${busId} is approaching your stop. Estimated arrival: ${estimatedArrivalTime}`;

    // Fetch the user's notification preferences (email or push)
    const user = await getUserById(userId);

    if (user) {
      // Send email notification
      await sendEmailNotification(user.email, message);

      // Send push notification if enabled
      if (user.pushNotificationEnabled) {
        await sendPushNotification(user.deviceToken, message);
      }
    }
  } catch (error) {
    console.error('Error notifying bus approaching:', error);
    throw error;
  }
};

/**
 * Example function to simulate getting a user by ID (you should replace this with actual DB logic).
 * @param {String} userId - The ID of the user.
 * @returns {Object} - User details (email, notification preferences).
 */
const getUserById = async (userId) => {
  // Simulating fetching a user from the database
  // Replace this with actual database queries (e.g., MongoDB)
  return {
    userId,
    email: 'user@example.com',  // Example user email
    pushNotificationEnabled: true,
    deviceToken: 'user-device-token-xyz',  // Example device token for push notifications
  };
};

module.exports = {
  notifyBusArrival,
  notifyBusApproaching,
};
