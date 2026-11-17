const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

router.use(function (req, res, next) {
  if (!req.session.user || req.session.user.level !== 'admin') {
    return res.status(403).json({ pesan: 'Halaman ini hanya untuk admin.' });
  }
  next();
});

router.get('/', async (req, res) => {
  try {
    const [baris] = await db.query(
      'SELECT id_user AS id, username, nama_lengkap AS nama, level, ' +
      '(pertanyaan_keamanan IS NOT NULL AND jawaban_keamanan IS NOT NULL) AS punyaPertanyaan ' +
      'FROM `user` ORDER BY id_user'
    );
    res.json(baris.map(function (b) {
      return {
        id: b.id,
        username: b.username,
        nama: b.nama,
        level: b.level,
        punyaPertanyaan: Number(b.punyaPertanyaan) === 1
      };
    }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal mengambil data pengguna' });
  }
});

router.put('/:id/level', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const level = String(req.body.level || '').trim().toLowerCase();

    const [ada] = await db.query('SELECT username FROM `user` WHERE id_user = ?', [id]);
    if (ada.length === 0) {
      return res.status(404).json({ pesan: 'Pengguna tidak ditemukan.' });
    }
    if (level !== 'admin' && level !== 'user') {
      return res.status(400).json({ pesan: 'Level harus admin atau user.' });
    }
    if (id === Number(req.session.user.id)) {
      return res.status(409).json({ pesan: 'Kamu tidak bisa mengubah level akunmu sendiri.' });
    }

    await db.query('UPDATE `user` SET level = ? WHERE id_user = ?', [level, id]);
    res.json({ id: id, username: ada[0].username, level: level });
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal mengubah level' });
  }
});

router.put('/:id/password', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const passwordBaru = String(req.body.passwordBaru || '');

    const [ada] = await db.query('SELECT username FROM `user` WHERE id_user = ?', [id]);
    if (ada.length === 0) {
      return res.status(404).json({ pesan: 'Pengguna tidak ditemukan.' });
    }
    if (passwordBaru.length < 6) {
      return res.status(400).json({ pesan: 'Password baru minimal 6 karakter.' });
    }

    const hash = bcrypt.hashSync(passwordBaru, 10);
    await db.query('UPDATE `user` SET password = ? WHERE id_user = ?', [hash, id]);
    res.json({ pesan: 'Password untuk "' + ada[0].username + '" berhasil direset.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal mereset password' });
  }
});

module.exports = router;