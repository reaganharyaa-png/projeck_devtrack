const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [status] = await db.query(
      'SELECT COUNT(*) AS total, ' +
      'COALESCE(SUM(tanggal_selesai IS NULL), 0) AS berjalan, ' +
      'COALESCE(SUM(tanggal_selesai IS NOT NULL AND tanggal_selesai <= deadline), 0) AS tepatWaktu, ' +
      'COALESCE(SUM(tanggal_selesai IS NOT NULL AND tanggal_selesai > deadline), 0) AS terlambat ' +
      'FROM task'
    );

    const [beban] = await db.query(
      'SELECT d.id_developer AS id, d.nama, d.capacity_point AS kapasitas, ' +
      'COALESCE(SUM(t.story_point), 0) AS totalPoin ' +
      'FROM developer d ' +
      'LEFT JOIN task t ON t.id_developer = d.id_developer ' +
      'GROUP BY d.id_developer, d.nama, d.capacity_point ' +
      'ORDER BY d.id_developer'
    );

    res.json({
      ringkasan: {
        total: Number(status[0].total),
        tepatWaktu: Number(status[0].tepatWaktu),
        terlambat: Number(status[0].terlambat),
        berjalan: Number(status[0].berjalan)
      },
      beban: beban.map(function (b) {
        const totalPoin = Number(b.totalPoin);
        let persen = 0;
        if (b.kapasitas > 0) {
          persen = Math.min(100, Math.round(totalPoin / b.kapasitas * 100));
        }
        return {
          id: b.id,
          nama: b.nama,
          kapasitas: b.kapasitas,
          totalPoin: totalPoin,
          persen: persen
        };
      })
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal mengambil data dashboard' });
  }
});

module.exports = router;