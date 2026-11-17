const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

const PERTANYAAN = [
  'Siapa nama hewan peliharaan pertamamu?',
  'Apa nama kota tempat kamu lahir?',
  'Apa nama sekolah dasarmu?',
  'Apa makanan favoritmu?',
  'Siapa nama sahabat masa kecilmu?'
];

function rapikanJawaban(teks) {
  return String(teks || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

router.get('/pertanyaan', function (req, res) {
  res.json(PERTANYAAN);
});

router.post('/register', async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const nama = String(req.body.nama || '').trim();
    const password = String(req.body.password || '');
    const pertanyaan = String(req.body.pertanyaan || '');
    const jawaban = rapikanJawaban(req.body.jawaban);

    if (!/^[A-Za-z0-9._]{3,30}$/.test(username)) {
      return res.status(400).json({ pesan: 'Username 3 sampai 30 karakter, hanya huruf, angka, titik, dan garis bawah.' });
    }
    if (nama === '') {
      return res.status(400).json({ pesan: 'Nama lengkap wajib diisi.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ pesan: 'Password minimal 6 karakter.' });
    }
    if (PERTANYAAN.indexOf(pertanyaan) === -1) {
      return res.status(400).json({ pesan: 'Pertanyaan keamanan tidak valid.' });
    }
    if (jawaban === '') {
      return res.status(400).json({ pesan: 'Jawaban keamanan wajib diisi.' });
    }

    const [kembar] = await db.query('SELECT id_user FROM `user` WHERE username = ?', [username]);
    if (kembar.length > 0) {
      return res.status(409).json({ pesan: 'Username "' + username + '" sudah dipakai.' });
    }

    const hashPassword = bcrypt.hashSync(password, 10);
    const hashJawaban = bcrypt.hashSync(jawaban, 10);

    await db.query(
      'INSERT INTO `user` (username, password, nama_lengkap, level, pertanyaan_keamanan, jawaban_keamanan) ' +
      'VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashPassword, nama, 'user', pertanyaan, hashJawaban]
    );

    res.status(201).json({ pesan: 'Akun berhasil dibuat. Silakan masuk.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal membuat akun' });
  }
});

const percobaanReset = {};
const BATAS_GAGAL = 5;
const WAKTU_KUNCI = 15 * 60 * 1000;

function kunciPercobaan(req, username) {
  return req.ip + '|' + username.toLowerCase();
}

function sedangTerkunci(kunci) {
  const p = percobaanReset[kunci];
  if (!p) { return false; }
  if (p.kunciSampai && p.kunciSampai > Date.now()) { return true; }
  if (p.kunciSampai && p.kunciSampai <= Date.now()) { delete percobaanReset[kunci]; }
  return false;
}

function catatGagal(kunci) {
  const p = percobaanReset[kunci] || { jumlah: 0, kunciSampai: 0 };
  p.jumlah += 1;
  if (p.jumlah >= BATAS_GAGAL) { p.kunciSampai = Date.now() + WAKTU_KUNCI; }
  percobaanReset[kunci] = p;
}

router.post('/lupa/pertanyaan', async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    if (username === '') {
      return res.status(400).json({ pesan: 'Username wajib diisi.' });
    }

    const [baris] = await db.query(
      'SELECT pertanyaan_keamanan FROM `user` WHERE username = ?', [username]
    );

    let pertanyaan;
    if (baris.length > 0 && baris[0].pertanyaan_keamanan) {
      pertanyaan = baris[0].pertanyaan_keamanan;
    } else {
      let angka = 0;
      for (let i = 0; i < username.length; i++) { angka += username.charCodeAt(i); }
      pertanyaan = PERTANYAAN[angka % PERTANYAAN.length];
    }

    res.json({ pertanyaan: pertanyaan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal mengambil pertanyaan' });
  }
});

router.post('/lupa/reset', async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const jawaban = rapikanJawaban(req.body.jawaban);
    const passwordBaru = String(req.body.passwordBaru || '');

    if (username === '' || jawaban === '') {
      return res.status(400).json({ pesan: 'Username dan jawaban wajib diisi.' });
    }
    if (passwordBaru.length < 6) {
      return res.status(400).json({ pesan: 'Password baru minimal 6 karakter.' });
    }

    const kunci = kunciPercobaan(req, username);
    if (sedangTerkunci(kunci)) {
      return res.status(429).json({ pesan: 'Terlalu banyak percobaan gagal. Coba lagi dalam 15 menit.' });
    }

    const [baris] = await db.query(
      'SELECT id_user, jawaban_keamanan FROM `user` WHERE username = ?', [username]
    );

    const cocok = baris.length > 0 && baris[0].jawaban_keamanan &&
      bcrypt.compareSync(jawaban, baris[0].jawaban_keamanan);

    if (!cocok) {
      catatGagal(kunci);
      return res.status(401).json({ pesan: 'Username atau jawaban salah.' });
    }

    const hash = bcrypt.hashSync(passwordBaru, 10);
    await db.query('UPDATE `user` SET password = ? WHERE id_user = ?', [hash, baris[0].id_user]);
    delete percobaanReset[kunci];

    res.json({ pesan: 'Password berhasil diubah. Silakan masuk.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal mengubah password' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');

    if (username === '' || password === '') {
      return res.status(400).json({ pesan: 'Username dan password wajib diisi.' });
    }

    const [baris] = await db.query(
      'SELECT id_user, username, password, nama_lengkap, level FROM `user` WHERE username = ?',
      [username]
    );

    if (baris.length === 0 || !bcrypt.compareSync(password, baris[0].password)) {
      return res.status(401).json({ pesan: 'Username atau password salah.' });
    }

    const u = baris[0];
    req.session.user = {
      id: u.id_user,
      username: u.username,
      nama: u.nama_lengkap || u.username,
      level: u.level
    };

    res.json(req.session.user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal melakukan login' });
  }
});

router.post('/logout', function (req, res) {
  req.session.destroy(function () {
    res.clearCookie('devtask.sid');
    res.json({ pesan: 'Berhasil keluar.' });
  });
});

router.get('/me', function (req, res) {
  if (!req.session.user) {
    return res.status(401).json({ pesan: 'Belum login.' });
  }
  res.json(req.session.user);
});

module.exports = router;