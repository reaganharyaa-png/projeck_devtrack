const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [baris] = await db.query(
      'SELECT p.id_priority AS id, p.nama_priority AS nama, COUNT(t.id_task) AS jumlahTask ' +
      'FROM priority p ' +
      'LEFT JOIN task t ON t.id_priority = p.id_priority ' +
      'GROUP BY p.id_priority, p.nama_priority ' +
      'ORDER BY p.id_priority'
    );
    res.json(baris);
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal mengambil data prioritas' });
  }
});

router.post('/', async (req, res) => {
  try {
    const nama = String(req.body.nama || '').trim();
    if (nama === '') {
      return res.status(400).json({ pesan: 'Nama prioritas wajib diisi.' });
    }
    const [kembar] = await db.query('SELECT id_priority FROM priority WHERE nama_priority = ?', [nama]);
    if (kembar.length > 0) {
      return res.status(409).json({ pesan: 'Nama prioritas "' + nama + '" sudah ada.' });
    }
    const [hasil] = await db.query('INSERT INTO priority (nama_priority) VALUES (?)', [nama]);
    res.status(201).json({ id: hasil.insertId, nama: nama });
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal menyimpan prioritas' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const nama = String(req.body.nama || '').trim();
    const [ada] = await db.query('SELECT id_priority FROM priority WHERE id_priority = ?', [id]);
    if (ada.length === 0) {
      return res.status(404).json({ pesan: 'Prioritas tidak ditemukan.' });
    }
    if (nama === '') {
      return res.status(400).json({ pesan: 'Nama prioritas wajib diisi.' });
    }
    const [kembar] = await db.query(
      'SELECT id_priority FROM priority WHERE nama_priority = ? AND id_priority <> ?', [nama, id]
    );
    if (kembar.length > 0) {
      return res.status(409).json({ pesan: 'Nama prioritas "' + nama + '" sudah ada.' });
    }
    await db.query('UPDATE priority SET nama_priority = ? WHERE id_priority = ?', [nama, id]);
    res.json({ id: Number(id), nama: nama });
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal mengubah prioritas' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [ada] = await db.query('SELECT nama_priority FROM priority WHERE id_priority = ?', [id]);
    if (ada.length === 0) {
      return res.status(404).json({ pesan: 'Prioritas tidak ditemukan.' });
    }
    const [dipakai] = await db.query('SELECT COUNT(*) AS jumlah FROM task WHERE id_priority = ?', [id]);
    if (dipakai[0].jumlah > 0) {
      return res.status(409).json({
        pesan: 'Prioritas "' + ada[0].nama_priority + '" masih dipakai ' + dipakai[0].jumlah + ' task. Ubah atau hapus task-nya dulu.'
      });
    }
    await db.query('DELETE FROM priority WHERE id_priority = ?', [id]);
    res.json({ pesan: 'Prioritas berhasil dihapus.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal menghapus prioritas' });
  }
});

module.exports = router;