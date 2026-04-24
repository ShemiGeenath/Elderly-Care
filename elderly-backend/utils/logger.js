// utils/logger.js
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logToFile = (filename, message) => {
  const logPath = path.join(logsDir, filename);
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  fs.appendFile(logPath, logMessage, (err) => {
    if (err) console.error('Error writing to log file:', err);
  });
};

const logger = {
  info: (message) => {
    console.log(`[INFO] ${message}`);
    logToFile('combined.log', `[INFO] ${message}`);
  },
  error: (message) => {
    console.error(`[ERROR] ${message}`);
    logToFile('error.log', `[ERROR] ${message}`);
  },
  access: (message) => {
    console.log(`[ACCESS] ${message}`);
    logToFile('access.log', `[ACCESS] ${message}`);
  }
};

module.exports = logger;