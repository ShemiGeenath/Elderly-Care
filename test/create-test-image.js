// create-test-image.js
// Run this separately if you want to test image uploads
const fs = require('fs');
const path = require('path');

function createTestImage() {
  // Create a simple 1x1 pixel PNG image data
  const pngData = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );
  
  const imagePath = path.join(__dirname, 'test-image.jpg');
  fs.writeFileSync(imagePath, pngData);
  console.log('✅ Test image created at:', imagePath);
}

createTestImage();