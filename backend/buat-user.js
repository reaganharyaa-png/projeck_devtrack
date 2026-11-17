const bcrypt = require('bcryptjs');
const db = require('./db');

async function main() {
  const username = String(process.argv[2] || '').trim();
  const password = String(process.argv[3] || '');
  const nama = String(process.argv[4] || username).trim();
  const level = String(process.argv[5] || 'user').trim().toLowerCase();

  if (username === '' || password.length < 6 || (level !== 'admin' && level !== 'user')) {
    console.log('Pemakaian: node buat-user.js <username> <password> "<Nama Lengkap>" <admin|user>');
    console.log('Username wajib diisi, password minimal 6 karakter, level admin atau user.');
    process.exit(1);
  }

  const [ada] = await db.query('SELECT id_user FROM `user` WHERE username = ?', [username]);
  if (ada.length > 0) {
    console.log('Username "' + username + '" sudah ada.');
    process.exit(1);
  }

  const hash = bcrypt.hashSync(password, 10);
  await db.query(
    'INSERT INTO `user` (username, password, nama_lengkap, level) VALUES (?, ?, ?, ?)',
    [username, hash, nama, level]
  );
  console.log('Akun berhasil dibuat: ' + username + ' (' + level + ')');
  process.exit(0);
}

main().catch(function (error) {
  console.error(error.message);
  process.exit(1);
});