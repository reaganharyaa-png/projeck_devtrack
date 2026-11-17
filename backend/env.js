const path = require('path');

try {
  process.loadEnvFile(path.join(__dirname, '.env'));
} catch (error) {
  console.error('File .env tidak ditemukan di folder backend.');
}