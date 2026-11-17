var API = '/api';

async function panggilApi(alamat, metode, isi) {
  var opsi = { method: metode || 'GET', headers: {} };

  if (isi !== undefined) {
    opsi.headers['Content-Type'] = 'application/json';
    opsi.body = JSON.stringify(isi);
  }

  var respons;
  try {
    respons = await fetch(API + alamat, opsi);
  } catch (error) {
    throw new Error('Tidak bisa terhubung ke server. Pastikan server Node.js sudah dijalankan.');
  }

    var tanpaAlihLogin = ['/login', '/lupa/reset'];
  if (respons.status === 401 && tanpaAlihLogin.indexOf(alamat) === -1) {
    window.location.href = 'login.html';
    return new Promise(function () {});
  }

  var hasil = null;
  try {
    hasil = await respons.json();
  } catch (error) {
    hasil = null;
  }

  if (!respons.ok) {
    var pesan = 'Terjadi kesalahan di server.';
    if (hasil !== null && hasil.pesan) { pesan = hasil.pesan; }
    throw new Error(pesan);
  }

  return hasil;
}

var penggunaSaatIni = null;

function ambilPengguna() {
  if (penggunaSaatIni === null) {
    penggunaSaatIni = panggilApi('/me').catch(function (error) {
      penggunaSaatIni = null;
      throw error;
    });
  }
  return penggunaSaatIni;
}