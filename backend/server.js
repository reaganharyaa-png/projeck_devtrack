require('./env');
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const { wajibLogin, hanyaAdminUntukUbahHapus } = require('./middleware/penjaga');

const app = express();
app.use(cors());
app.use(express.json());

if (!process.env.SESSION_SECRET) {
  console.error('SESSION_SECRET belum diisi di file .env.');
  process.exit(1);
}

app.use(session({
  name: 'devtask.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 8
  }
}));
app.use(function (req, res, next) {
  if (req.body === undefined) { req.body = {}; }
  next();
});

app.get('/api/ping', (req, res) => {
  res.json({ pesan: 'ok' });
});

app.use('/api', require('./routes/auth'));

app.use('/api', wajibLogin);
app.use('/api', hanyaAdminUntukUbahHapus);

app.use('/api/role', require('./routes/role'));
app.use('/api/prioritas', require('./routes/prioritas'));
app.use('/api/developer', require('./routes/developer'));
app.use('/api/task', require('./routes/task'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/pengguna', require('./routes/pengguna'));

app.use('/api', function (req, res) {
  res.status(404).json({ pesan: 'Alamat API tidak ditemukan.' });
});

app.use(express.static(path.join(__dirname, 'public')));

app.use(function (error, req, res, next) {
  console.error(error);
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ pesan: 'Format data yang dikirim tidak valid.' });
  }
  res.status(500).json({ pesan: 'Terjadi kesalahan di server.' });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log('Server jalan di http://localhost:' + PORT);
});