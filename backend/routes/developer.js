const express = require('express');
const db = require('../db');

const router = express.Router();

const SQL_DEVELOPER =
  'SELECT d.id_developer AS id, d.nama, d.id_role AS roleId, r.nama_role AS namaRole, ' +
  'd.capacity_point AS kapasitas, COUNT(t.id_task) AS jumlahTask, ' +
  'COALESCE(SUM(t.story_point), 0) AS totalPoin ' +
  'FROM developer d ' +
  'LEFT JOIN `role` r ON r.id_role = d.id_role ' +
  'LEFT JOIN task t ON t.id_developer = d.id_developer ';

const SQL_GROUP =
  'GROUP BY d.id_developer, d.nama, d.id_role, r.nama_role, d.capacity_point ';

function rapikan(baris) {
  return {
    id: baris.id,
    nama: baris.nama,
    roleId: baris.roleId,
    namaRole: baris.namaRole,
    kapasitas: baris.kapasitas,
    jumlahTask: Number(baris.jumlahTask),
    totalPoin: Number(baris.totalPoin)
  };
}

async function buatIdBerikutnya() {
  const [hasil] = await db.query(
    'SELECT MAX(CAST(SUBSTRING(id_developer, 4) AS UNSIGNED)) AS maks FROM developer'
  );
  const maks = Number(hasil[0].maks) || 0;
  return 'Dev' + String(maks + 1).padStart(2, '0');
}

async function periksaIsian(body) {
  const nama = String(body.nama || '').trim();
  const roleId = Number(body.roleId);
  const kapasitas = Number(body.kapasitas);

  if (nama === '') { return { error: 'Nama developer wajib diisi.' }; }
  if (!Number.isInteger(roleId) || roleId < 1) { return { error: 'Role wajib dipilih.' }; }

  const [role] = await db.query('SELECT id_role FROM `role` WHERE id_role = ?', [roleId]);
  if (role.length === 0) { return { error: 'Role tidak ditemukan.' }; }

  if (!Number.isInteger(kapasitas) || kapasitas < 1) { return { error: 'Capacity point minimal 1.' }; }

  return { nama: nama, roleId: roleId, kapasitas: kapasitas };
}

router.get('/', async (req, res) => {
  try {
    const [baris] = await db.query(SQL_DEVELOPER + SQL_GROUP + 'ORDER BY d.id_developer');
    res.json(baris.map(rapikan));
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal mengambil data developer' });
  }
});

router.get('/id-berikutnya', async (req, res) => {
  try {
    res.json({ id: await buatIdBerikutnya() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal membuat ID developer' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [baris] = await db.query(
      SQL_DEVELOPER + 'WHERE d.id_developer = ? ' + SQL_GROUP, [req.params.id]
    );
    if (baris.length === 0) {
      return res.status(404).json({ pesan: 'Developer tidak ditemukan.' });
    }
    res.json(rapikan(baris[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal mengambil data developer' });
  }
});

router.post('/', async (req, res) => {
  try {
    const isian = await periksaIsian(req.body);
    if (isian.error) {
      return res.status(400).json({ pesan: isian.error });
    }
    const id = await buatIdBerikutnya();
    await db.query(
      'INSERT INTO developer (id_developer, nama, id_role, capacity_point) VALUES (?, ?, ?, ?)',
      [id, isian.nama, isian.roleId, isian.kapasitas]
    );
    res.status(201).json({ id: id, nama: isian.nama, roleId: isian.roleId, kapasitas: isian.kapasitas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal menyimpan developer' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [ada] = await db.query('SELECT id_developer FROM developer WHERE id_developer = ?', [id]);
    if (ada.length === 0) {
      return res.status(404).json({ pesan: 'Developer tidak ditemukan.' });
    }
    const isian = await periksaIsian(req.body);
    if (isian.error) {
      return res.status(400).json({ pesan: isian.error });
    }
    await db.query(
      'UPDATE developer SET nama = ?, id_role = ?, capacity_point = ? WHERE id_developer = ?',
      [isian.nama, isian.roleId, isian.kapasitas, id]
    );
    res.json({ id: id, nama: isian.nama, roleId: isian.roleId, kapasitas: isian.kapasitas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal mengubah developer' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [ada] = await db.query('SELECT nama FROM developer WHERE id_developer = ?', [id]);
    if (ada.length === 0) {
      return res.status(404).json({ pesan: 'Developer tidak ditemukan.' });
    }
    const [dipakai] = await db.query('SELECT COUNT(*) AS jumlah FROM task WHERE id_developer = ?', [id]);
    if (dipakai[0].jumlah > 0) {
      return res.status(409).json({
        pesan: ada[0].nama + ' masih punya ' + dipakai[0].jumlah + ' task. Hapus atau pindahkan task-nya dulu.'
      });
    }
    await db.query('DELETE FROM developer WHERE id_developer = ?', [id]);
    res.json({ pesan: 'Developer berhasil dihapus.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal menghapus developer' });
  }
});

module.exports = router;