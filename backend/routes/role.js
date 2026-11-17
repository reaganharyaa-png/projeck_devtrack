const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [baris] = await db.query(
      'SELECT r.id_role AS id, r.nama_role AS nama, COUNT(d.id_developer) AS jumlahDeveloper ' +
      'FROM `role` r ' +
      'LEFT JOIN developer d ON d.id_role = r.id_role ' +
      'GROUP BY r.id_role, r.nama_role ' +
      'ORDER BY r.id_role'
    );
    res.json(baris);
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal mengambil data role' });
  }
});

router.post('/', async (req, res) => {
  try {
    const nama = String(req.body.nama || '').trim();
    if (nama === '') {
      return res.status(400).json({ pesan: 'Nama role wajib diisi.' });
    }
    const [kembar] = await db.query('SELECT id_role FROM `role` WHERE nama_role = ?', [nama]);
    if (kembar.length > 0) {
      return res.status(409).json({ pesan: 'Nama role "' + nama + '" sudah ada.' });
    }
    const [hasil] = await db.query('INSERT INTO `role` (nama_role) VALUES (?)', [nama]);
    res.status(201).json({ id: hasil.insertId, nama: nama });
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal menyimpan role' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const nama = String(req.body.nama || '').trim();
    const [ada] = await db.query('SELECT id_role FROM `role` WHERE id_role = ?', [id]);
    if (ada.length === 0) {
      return res.status(404).json({ pesan: 'Role tidak ditemukan.' });
    }
    if (nama === '') {
      return res.status(400).json({ pesan: 'Nama role wajib diisi.' });
    }
    const [kembar] = await db.query(
      'SELECT id_role FROM `role` WHERE nama_role = ? AND id_role <> ?', [nama, id]
    );
    if (kembar.length > 0) {
      return res.status(409).json({ pesan: 'Nama role "' + nama + '" sudah ada.' });
    }
    await db.query('UPDATE `role` SET nama_role = ? WHERE id_role = ?', [nama, id]);
    res.json({ id: Number(id), nama: nama });
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal mengubah role' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [ada] = await db.query('SELECT nama_role FROM `role` WHERE id_role = ?', [id]);
    if (ada.length === 0) {
      return res.status(404).json({ pesan: 'Role tidak ditemukan.' });
    }
    const [dipakai] = await db.query('SELECT COUNT(*) AS jumlah FROM developer WHERE id_role = ?', [id]);
    if (dipakai[0].jumlah > 0) {
      return res.status(409).json({
        pesan: 'Role "' + ada[0].nama_role + '" masih dipakai ' + dipakai[0].jumlah + ' developer. Ubah atau hapus developer-nya dulu.'
      });
    }
    await db.query('DELETE FROM `role` WHERE id_role = ?', [id]);
    res.json({ pesan: 'Role berhasil dihapus.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal menghapus role' });
  }
});

module.exports = router;