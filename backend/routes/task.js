const express = require('express');
const db = require('../db');

const router = express.Router();

const SQL_TASK =
  'SELECT t.id_task AS id, t.nama_task AS nama, t.story_point AS poin, ' +
  't.id_developer AS developerId, d.nama AS namaDeveloper, r.nama_role AS namaRole, ' +
  't.id_priority AS prioritasId, p.nama_priority AS namaPrioritas, ' +
  't.deadline, t.tanggal_selesai AS selesai ' +
  'FROM task t ' +
  'LEFT JOIN developer d ON d.id_developer = t.id_developer ' +
  'LEFT JOIN `role` r ON r.id_role = d.id_role ' +
  'LEFT JOIN priority p ON p.id_priority = t.id_priority ';

const URUTAN = 'ORDER BY CAST(SUBSTRING(t.id_task, 5) AS UNSIGNED)';

function hitungStatus(deadline, selesai) {
  if (selesai === '') { return 'Berjalan'; }
  if (selesai <= deadline) { return 'Tepat waktu'; }
  return 'Terlambat';
}

function rapikan(baris) {
  const deadline = baris.deadline || '';
  const selesai = baris.selesai || '';
  return {
    id: baris.id,
    nama: baris.nama,
    poin: baris.poin,
    developerId: baris.developerId,
    namaDeveloper: baris.namaDeveloper,
    namaRole: baris.namaRole,
    prioritasId: baris.prioritasId,
    namaPrioritas: baris.namaPrioritas,
    deadline: deadline,
    selesai: selesai,
    status: hitungStatus(deadline, selesai)
  };
}

function tanggalValid(teks) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(teks)) { return false; }
  const tgl = new Date(teks + 'T00:00:00Z');
  return !isNaN(tgl.getTime()) && tgl.toISOString().slice(0, 10) === teks;
}

async function buatIdBerikutnya() {
  const [hasil] = await db.query(
    'SELECT MAX(CAST(SUBSTRING(id_task, 5) AS UNSIGNED)) AS maks FROM task'
  );
  const maks = Number(hasil[0].maks) || 0;
  return 'Task' + String(maks + 1).padStart(2, '0');
}

async function periksaIsian(body) {
  const nama = String(body.nama || '').trim();
  const poin = Number(body.poin);
  const developerId = String(body.developerId || '').trim();
  const prioritasId = Number(body.prioritasId);
  const deadline = String(body.deadline || '').trim();
  const selesai = body.selesai ? String(body.selesai).trim() : '';

  if (nama === '') { return { error: 'Nama task wajib diisi.' }; }
  if (!Number.isInteger(poin) || poin < 1) { return { error: 'Story point minimal 1.' }; }

  const [dev] = await db.query('SELECT id_developer FROM developer WHERE id_developer = ?', [developerId]);
  if (dev.length === 0) { return { error: 'Developer tidak ditemukan.' }; }

  const [pri] = await db.query('SELECT id_priority FROM priority WHERE id_priority = ?', [prioritasId]);
  if (pri.length === 0) { return { error: 'Prioritas tidak ditemukan.' }; }

  if (deadline === '') { return { error: 'Deadline wajib diisi.' }; }
  if (!tanggalValid(deadline)) { return { error: 'Format deadline harus TTTT-BB-HH, contoh 2026-09-01.' }; }
  if (selesai !== '' && !tanggalValid(selesai)) {
    return { error: 'Format tanggal selesai harus TTTT-BB-HH, contoh 2026-09-01.' };
  }

  return {
    nama: nama, poin: poin, developerId: developerId, prioritasId: prioritasId,
    deadline: deadline, selesai: selesai === '' ? null : selesai
  };
}

router.get('/', async (req, res) => {
  try {
    const [baris] = await db.query(SQL_TASK + URUTAN);
    res.json(baris.map(rapikan));
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal mengambil data task' });
  }
});

router.get('/id-berikutnya', async (req, res) => {
  try {
    res.json({ id: await buatIdBerikutnya() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal membuat ID task' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [baris] = await db.query(SQL_TASK + 'WHERE t.id_task = ?', [req.params.id]);
    if (baris.length === 0) {
      return res.status(404).json({ pesan: 'Task tidak ditemukan.' });
    }
    res.json(rapikan(baris[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal mengambil data task' });
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
      'INSERT INTO task (id_task, id_developer, id_priority, nama_task, story_point, deadline, tanggal_selesai) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, isian.developerId, isian.prioritasId, isian.nama, isian.poin, isian.deadline, isian.selesai]
    );
    const [baris] = await db.query(SQL_TASK + 'WHERE t.id_task = ?', [id]);
    res.status(201).json(rapikan(baris[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal menyimpan task' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [ada] = await db.query('SELECT id_task FROM task WHERE id_task = ?', [id]);
    if (ada.length === 0) {
      return res.status(404).json({ pesan: 'Task tidak ditemukan.' });
    }
    const isian = await periksaIsian(req.body);
    if (isian.error) {
      return res.status(400).json({ pesan: isian.error });
    }
    await db.query(
      'UPDATE task SET id_developer = ?, id_priority = ?, nama_task = ?, story_point = ?, ' +
      'deadline = ?, tanggal_selesai = ? WHERE id_task = ?',
      [isian.developerId, isian.prioritasId, isian.nama, isian.poin, isian.deadline, isian.selesai, id]
    );
    const [baris] = await db.query(SQL_TASK + 'WHERE t.id_task = ?', [id]);
    res.json(rapikan(baris[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal mengubah task' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [ada] = await db.query('SELECT id_task FROM task WHERE id_task = ?', [id]);
    if (ada.length === 0) {
      return res.status(404).json({ pesan: 'Task tidak ditemukan.' });
    }
    await db.query('DELETE FROM task WHERE id_task = ?', [id]);
    res.json({ pesan: 'Task berhasil dihapus.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal menghapus task' });
  }
});

module.exports = router;