// start-services.js

const { spawn } = require('child_process');
const path = require('path');

// Start Python NLP service
const pythonService = spawn('python', [path.join(__dirname, 'python-service/app.py')]);

pythonService.stdout.on('data', (data) => {
  console.log(`🐍 Python NLP Service: ${data}`);
});

pythonService.stderr.on('data', (data) => {
  console.error(`🐍 Python NLP Error: ${data}`);
});

pythonService.on('close', (code) => {
  console.log(`🐍 Python NLP Service exited with code ${code}`);
});

// Start Node.js server
const nodeServer = spawn('node', [path.join(__dirname, 'server.js')]);

nodeServer.stdout.on('data', (data) => {
  console.log(`🚀 Node Server: ${data}`);
});

nodeServer.stderr.on('data', (data) => {
  console.error(`🚀 Node Server Error: ${data}`);
});

nodeServer.on('close', (code) => {
  console.log(`🚀 Node Server exited with code ${code}`);
});

console.log('✅ Starting services...');