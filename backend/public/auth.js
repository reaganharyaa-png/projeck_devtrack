(function () {
  var gaya = document.createElement('style');
  gaya.id = 'gayaBatasUser';
  gaya.textContent =
    '[data-aksi]{display:none !important}' +
    'td:has(> [data-aksi]){display:none}' +
    'th.kolom-aksi{display:none}';
  document.head.appendChild(gaya);

  var semuaTh = document.querySelectorAll('th');
  for (var i = 0; i < semuaTh.length; i++) {
    if (semuaTh[i].textContent.trim() === 'Aksi') { semuaTh[i].classList.add('kolom-aksi'); }
  }

  function escapeTeks(teks) {
    return String(teks).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function namaLevel(level) {
    return level === 'admin' ? 'Admin' : 'User';
  }

  function keluar() {
    panggilApi('/logout', 'POST')
      .catch(function () {})
      .then(function () { window.location.href = '/login'; });
  }

  function pasangKotak(pengguna) {
    var sidebar = document.querySelector('aside.shrink-0');

    if (sidebar) {
      if (pengguna.level === 'admin' && !sidebar.querySelector('a[href="/pengguna"]')) {
        var menuPengguna = document.createElement('a');
        menuPengguna.href = '/pengguna';
        menuPengguna.className = 'rounded-lg px-3 py-[11px] text-sm font-medium text-[#3A3F63]';
        menuPengguna.textContent = 'Pengguna';
        sidebar.appendChild(menuPengguna);
      }

      var kotak = document.createElement('div');
      kotak.className = 'mt-auto border-t border-[#E7E9F2] px-3 pt-4';
      kotak.innerHTML =
        '<div class="text-sm font-semibold">' + escapeTeks(pengguna.nama) + '</div>' +
        '<div class="text-xs text-[#5B6080]">' + namaLevel(pengguna.level) + '</div>' +
        '<button type="button" class="tombolKeluar mt-3 h-10 w-full rounded-lg border border-[#8A90AD] bg-white text-sm font-semibold text-[#B42318]">Keluar</button>';
      sidebar.appendChild(kotak);
    }

    var chip = document.createElement('div');
    chip.className = 'fixed right-3 top-3 z-40 flex items-center gap-2 rounded-full border border-[#E7E9F2] bg-white py-1 pl-3 pr-1 text-xs shadow-sm' + (sidebar ? ' md:hidden' : '');
    chip.innerHTML =
      '<span><b>' + escapeTeks(pengguna.nama) + '</b> &middot; ' + namaLevel(pengguna.level) + '</span>' +
      '<button type="button" class="tombolKeluar rounded-full bg-[#FDECEA] px-3 py-1.5 font-semibold text-[#B42318]">Keluar</button>';
    document.body.appendChild(chip);
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('.tombolKeluar')) { keluar(); }
  });

  ambilPengguna().then(function (pengguna) {
    if (pengguna.level === 'admin') {
      var aturan = document.getElementById('gayaBatasUser');
      if (aturan) { aturan.remove(); }
      var kolom = document.querySelectorAll('th.kolom-aksi');
      for (var j = 0; j < kolom.length; j++) { kolom[j].classList.remove('kolom-aksi'); }
    }
    pasangKotak(pengguna);
  }).catch(function () {});
})();