// Import the app.js file that contains your Express app setup
const app = require('./app');

// Set the port for the server to listen on
const PORT = process.env.PORT || 5000; // Default to port 5000 if not specified

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
