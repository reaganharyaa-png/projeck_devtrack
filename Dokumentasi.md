# 📘 Penjelasan Kode devTask untuk Pemula

Dokumen ini menjelaskan kode JavaScript di proyek **devTask** dengan bahasa sederhana. Tidak perlu jago coding, cukup baca pelan-pelan dari atas ke bawah.

---

## 📑 Daftar Isi

1. [Proyek ini isinya apa?](#1-proyek-ini-isinya-apa)
2. [Istilah dasar yang perlu diketahui](#2-istilah-dasar-yang-perlu-diketahui)
3. [Data: tempat semua informasi disimpan](#3-data-tempat-semua-informasi-disimpan)
4. [Kenapa data bisa pindah antar halaman?](#4-kenapa-data-bisa-pindah-antar-halaman)
5. [Fungsi bantu (alat kecil)](#5-fungsi-bantu-alat-kecil)
6. [Fungsi pembuat tampilan](#6-fungsi-pembuat-tampilan)
7. [Popup SweetAlert2](#7-popup-sweetalert2)
8. [Cara tombol Ubah dan Hapus bekerja](#8-cara-tombol-ubah-dan-hapus-bekerja)
9. [Penjelasan tiap halaman](#9-penjelasan-tiap-halaman)
10. [Logika penting](#10-logika-penting)
11. [Contoh alur: menambah task](#11-contoh-alur-menambah-task)
12. [Batasan proyek ini](#12-batasan-proyek-ini)
13. [Latihan kecil](#13-latihan-kecil)

---

## 1. Proyek ini isinya apa?

devTask adalah aplikasi untuk mengelola pekerjaan tim software. Ada 7 file:

| File | Fungsinya |
|---|---|
| `index.html` | Dashboard: ringkasan angka, daftar task, beban kerja developer |
| `task.html` | Daftar task lengkap, ada pencarian dan filter |
| `tambah-task.html` | Form untuk menambah atau mengubah task |
| `developer.html` | Daftar developer |
| `tambah-developer.html` | Form untuk menambah atau mengubah developer |
| `role.html` | Daftar role (Frontend, Backend, dst.) |
| `prioritas.html` | Daftar prioritas (Low, Medium, High) |

Di dalam tiap file ada dua bagian:

```
┌─────────────────────────────┐
│  HTML + Tailwind            │  ← tampilan (desainmu, tidak diubah)
├─────────────────────────────┤
│  <script> ... </script>     │  ← logika (otak aplikasi)
└─────────────────────────────┘
```

**HTML** itu seperti kerangka dan cat sebuah rumah. **JavaScript** itu seperti listrik dan pipa yang membuat rumahnya hidup.

---

## 2. Istilah dasar yang perlu diketahui

| Istilah | Artinya | Contoh |
|---|---|---|
| **Variabel** | Kotak untuk menyimpan nilai | `var nama = 'Andi';` |
| **Fungsi** | Kumpulan perintah yang bisa dipanggil berulang kali | `function sapa() { ... }` |
| **Array (daftar)** | Kumpulan banyak data dalam satu tempat | `['Andi', 'Budi', 'Tama']` |
| **Object** | Satu data dengan banyak keterangan | `{ id: 'Dev01', nama: 'Andi' }` |
| **`if`** | Kalau kondisi benar, lakukan sesuatu | `if (umur > 17) { ... }` |
| **`for` (perulangan)** | Mengulang perintah untuk setiap isi daftar | `for (var i = 0; ...) { ... }` |
| **Callback** | Fungsi yang dijalankan nanti, setelah sesuatu selesai | "Kalau user klik Ya, jalankan ini" |
| **DOM** | Semua elemen HTML di halaman yang bisa diubah oleh JavaScript | tabel, tombol, kolom isian |

### Cara membaca `for`

```js
for (var i = 0; i < data.task.length; i++) {
  // lakukan sesuatu untuk data.task[i]
}
```

Artinya: "Mulai dari nomor 0, ulangi terus sampai semua task terbaca, naikkan nomor satu per satu."

Kalau ada 4 task, perintah di dalamnya dijalankan 4 kali: untuk task nomor 0, 1, 2, dan 3. Komputer menghitung mulai dari **0**, bukan 1.

---

## 3. Data: tempat semua informasi disimpan

Semua informasi disimpan dalam satu variabel besar bernama `data`. Bayangkan `data` seperti **lemari** yang punya 4 laci:

```
data (lemari)
├── role        → laci daftar role
├── prioritas   → laci daftar prioritas
├── developer   → laci daftar developer
├── task        → laci daftar task
└── idBerikut   → catatan nomor ID selanjutnya
```

Contoh isi laci `developer`:

```js
developer: [
  { id: 'Dev01', nama: 'Andi', roleId: 1, kapasitas: 30 },
  { id: 'Dev02', nama: 'Budi', roleId: 2, kapasitas: 20 },
  { id: 'Dev03', nama: 'Tama', roleId: 3, kapasitas: 35 }
]
```

Setiap developer punya `roleId`. Angka itu menunjuk ke role yang sesuai:

```
Andi  → roleId: 1 → cari di data.role → "Frontend"
```

Cara ini disebut **relasi**: kita hanya menyimpan angka penunjuk, bukan menulis ulang nama role. Keuntungannya, kalau nama role diubah, semua developer yang memakai role itu ikut berubah otomatis.

Hal yang sama berlaku di task:

```js
{ id: 'Task01', nama: 'Setup Project Repository', poin: 2,
  developerId: 'Dev01',   // pemilik task → Andi
  prioritasId: 1,         // prioritas → Low
  deadline: '2026-08-06',
  selesai: '2026-08-11' }
```

`idBerikut` mencatat nomor selanjutnya:

```js
idBerikut: { task: 5, developer: 4, role: 4, prioritas: 4 }
```

Artinya task berikutnya diberi ID `Task05`, developer berikutnya `Dev04`, dan seterusnya.

---

## 4. Kenapa data bisa pindah antar halaman?

### Masalahnya

Tiap kali kamu berpindah halaman (dari `tambah-task.html` ke `index.html`), browser memuat file baru dan **semua variabel lama hilang**. Padahal task baru harus tetap muncul di Dashboard.

Kamu minta tidak memakai `localStorage`, jadi caranya begini:

### Solusinya: `window.name`

`window.name` adalah tempat kecil milik tab browser yang **tetap ada selama kamu masih di tab yang sama**, walaupun halamannya berganti. Data disimpan di situ sebagai teks.

```
Halaman A  ──simpan data ke window.name──►  [tab browser]  ──baca data──►  Halaman B
```

Kodenya, langkah demi langkah:

```js
// 1. Apakah halaman ini baru di-refresh (F5)?
function halamanDirefresh() { ... }

// 2. Kalau BUKAN refresh dan ada data tersimpan → pakai data itu
if (halamanDirefresh() === false && window.name.indexOf('devtask:') === 0) {
  data = JSON.parse(window.name.substring(8));
}

// 3. Kalau belum ada data (pertama buka / habis refresh) → pakai data awal
if (data === null) {
  data = { ...data awal... };
}

// 4. Simpan lagi supaya bisa dibaca halaman berikutnya
function simpanData() {
  window.name = 'devtask:' + JSON.stringify(data);
}
```

Dua istilah yang muncul di kode ini:
- **`JSON.stringify(data)`** mengubah data menjadi **teks**, karena `window.name` hanya bisa menyimpan teks.
- **`JSON.parse(teks)`** mengubah teks itu kembali menjadi data.

### Kenapa refresh mengembalikan ke tampilan awal?

Karena di langkah 2 ada pengecekan `halamanDirefresh()`. Kalau halaman di-refresh, data di `window.name` **diabaikan** dan dipakai data awal. Jadi semua perubahan hilang.

---

## 5. Fungsi bantu (alat kecil)

Ini alat-alat kecil yang dipakai berulang kali di banyak tempat.

### `$()` dan `$$()`

```js
function $(selector)  { return document.querySelector(selector); }     // ambil 1 elemen
function $$(selector) { return document.querySelectorAll(selector); }  // ambil semua elemen
```

Contoh: `$('#nama')` artinya "ambil elemen yang id-nya `nama`".

### `dua(angka)`

Mengubah `5` menjadi `"05"`. Dipakai untuk membuat ID.

```js
'Task' + dua(5)    // hasilnya: "Task05"
'Task' + dua(12)   // hasilnya: "Task12"
```

### `aman(teks)`

Mengganti karakter HTML yang berbahaya. Contohnya kalau seseorang mengetik `<b>` di nama task, teks itu ditampilkan apa adanya dan tidak dianggap kode HTML. Kalau isinya kosong, `aman` menampilkan tanda `-`.

### `tanggalIndonesia(iso)`

```js
tanggalIndonesia('2026-08-06')   // hasilnya: "06 Agu 2026"
tanggalIndonesia('')             // hasilnya: "-"
```

Cara kerjanya: teks dipecah di tanda `-` menjadi `[tahun, bulan, hari]`, lalu disusun ulang dengan nama bulan Indonesia.

### `cari(daftar, id)`

Mencari satu data dari sebuah daftar berdasarkan id-nya.

```js
cari(data.developer, 'Dev01')
// hasilnya: { id: 'Dev01', nama: 'Andi', roleId: 1, kapasitas: 30 }

cari(data.developer, 'Dev99')
// hasilnya: null (tidak ketemu)
```

Fungsi ini berjalan dengan `for`: membuka daftar satu per satu, lalu berhenti begitu id-nya cocok.

### `namaDari(daftar, id)`

Sama seperti `cari`, tapi langsung memberikan namanya saja.

```js
namaDari(data.role, 1)   // hasilnya: "Frontend"
```

### `hitung(daftar, kolom, nilai)`

Menghitung berapa data yang punya nilai tertentu.

```js
hitung(data.task, 'developerId', 'Dev01')   // berapa task milik Andi? → 2
```

### `totalPoin(developerId)`

Menjumlahkan story point semua task milik satu developer.

```
Andi: Task01 (2 poin) + Task04 (3 poin) = 5 poin
```

### `persen(dev)`

Menghitung seberapa penuh beban kerja developer.

```
Andi: 5 poin ÷ 30 kapasitas × 100 = 17%
```

Hasilnya dibatasi maksimal 100 supaya bar tidak keluar dari kotaknya.

### `statusTask(t)` dan `hitungStatus(status)`

`statusTask` menentukan status sebuah task. `hitungStatus('Terlambat')` menghitung ada berapa task yang berstatus itu.

---

## 6. Fungsi pembuat tampilan

JavaScript membuat HTML sebagai **teks**, lalu memasukkannya ke halaman.

### `lencana(warna, teks)`

Membuat label kecil berwarna seperti **Low**, **Terlambat**, dan sejenisnya.

### `lencanaPrioritas(prioritasId)`

Membuat label prioritas. Warnanya ditentukan dari nomor id prioritas. Prioritas baru yang kamu tambahkan otomatis mendapat warna berikutnya.

### `buatBaris([a, b, c])`

Membuat satu baris tabel.

```js
buatBaris(['Task01', 'Setup Repo', 'Andi'])
// hasilnya: <tr><td>Task01</td><td>Setup Repo</td><td>Andi</td></tr>
```

### `gabungBaris(daftarBaris, jumlahKolom)`

Menggabungkan semua baris menjadi satu teks. Kalau daftarnya kosong, yang tampil adalah tulisan **"Belum ada data"**.

### `tombolAksi(id)`

Membuat dua link, **Ubah** dan **Hapus**. Link ini membawa dua "label tersembunyi":

```html
<a href="#" data-aksi="ubah"  data-id="Task01">Ubah</a>
<a href="#" data-aksi="hapus" data-id="Task01">Hapus</a>
```

Label `data-aksi` dan `data-id` ini yang nanti dibaca saat tombol diklik.

### `isiKartu(bagianKartu, daftarAngka)`

Mengisi angka pada kartu ringkasan, misalnya kartu **Total task** dan **Terlambat**. Dipakai di Dashboard dan halaman Task.

### `barisTask(t, denganAksi)`

Membuat satu baris tabel task lengkap: ID, nama, developer beserta role, prioritas, deadline, tanggal selesai, status, dan tombol aksi (kalau `denganAksi` bernilai `true`).

Dashboard memakai `denganAksi = false` karena tabelnya tidak punya kolom Aksi. Halaman Task memakai `true`.

---

## 7. Popup SweetAlert2

SweetAlert2 adalah library yang membuat popup cantik. Library ini dimuat lewat satu baris di bagian bawah HTML:

```html
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11.10.8/dist/sweetalert2.all.min.js"></script>
```

Tanpa internet, popup tidak akan muncul karena library tidak bisa dimuat.

Ada empat fungsi popup:

| Fungsi | Kapan dipakai | Tampilannya |
|---|---|---|
| `popupSukses(judul, teks, setelahTutup)` | Setelah berhasil simpan atau hapus | Ikon ✅ beranimasi, menutup sendiri sekitar 1,6 detik |
| `popupPeringatan(teks, judul)` | Isian salah atau aksi tidak boleh | Ikon peringatan dan tombol "Mengerti" |
| `popupKonfirmasi(judul, teks, untukHapus, kalauYa)` | Sebelum ubah atau hapus | Tombol "Batal" dan "Ya" |
| `peringatanForm(pesan, kolom)` | Isian form salah | Seperti peringatan, lalu kursor pindah ke kolom yang salah |

### Contoh pemakaian `popupKonfirmasi`

```js
popupKonfirmasi(
  'Apakah anda yakin untuk menghapus task ini?',   // judul
  'Task01 - Setup Project Repository',             // teks kecil
  true,                                            // true = untuk hapus (tombol merah)
  function () {                                    // dijalankan HANYA kalau user pilih "Ya"
    // ...hapus task...
  }
);
```

Fungsi di bagian paling bawah itulah yang disebut **callback**. Fungsi itu menunggu sampai pengguna menjawab, dan kalau pengguna menekan Batal, fungsi itu tidak pernah dijalankan.

---

## 8. Cara tombol Ubah dan Hapus bekerja

### Masalahnya

Isi tabel dibuat ulang setiap data berubah. Kalau pendengar klik dipasang di tiap tombol, tombol baru tidak punya pendengar.

### Solusinya: satu pendengar untuk seluruh halaman

```js
function pasangTombolAksi(fungsiUbah, fungsiHapus) {
  document.addEventListener('click', function (e) {
    var tombol = e.target.closest('[data-aksi]');   // yang diklik punya data-aksi?
    if (tombol === null) { return; }                // kalau tidak, abaikan
    e.preventDefault();                             // jangan lompat ke atas halaman (href="#")
    var id = tombol.getAttribute('data-id');
    if (tombol.getAttribute('data-aksi') === 'ubah') {
      fungsiUbah(id);
    } else {
      fungsiHapus(id);
    }
  });
}
```

Alurnya seperti satpam di pintu masuk gedung: tiap ada klik, satpam mengecek, "Yang diklik tombol aksi bukan?" Kalau ya, ia memanggil fungsi yang tepat.

Tiap halaman memanggil fungsi ini dengan fungsinya sendiri:

```js
pasangTombolAksi(ubahTask, hapusTask);          // di task.html
pasangTombolAksi(ubahDeveloper, hapusDeveloper); // di developer.html
```

### Alur Hapus

```
Klik "Hapus"
   │
   ▼
Ada aturan yang melarang? ──ya──► popup peringatan, selesai
   │ tidak
   ▼
Popup "Apakah anda yakin?"
   │
   ├─ Batal ──► tidak terjadi apa-apa
   │
   └─ Ya ──► buang data dari daftar
              ▼
           simpanData()
              ▼
           tampilkan() ulang tabel
              ▼
           popup sukses ✅
```

### Cara menghapus data dari daftar

JavaScript menghapus dengan membuat **daftar baru** yang berisi semua data kecuali yang dihapus.

```js
var sisa = [];
for (var n = 0; n < data.task.length; n++) {
  if (data.task[n].id !== id) {      // kalau BUKAN yang mau dihapus
    sisa.push(data.task[n]);         // masukkan ke daftar baru
  }
}
data.task = sisa;                    // ganti daftar lama dengan yang baru
```

### Alur Ubah

Tombol Ubah menampilkan konfirmasi dulu. Kalau pengguna menekan Ya:
- **Task dan Developer:** pindah ke halaman form dengan alamat seperti `tambah-task.html?edit=Task01`.
- **Role dan Prioritas:** form di samping tabel berubah menjadi mode ubah.

---

## 9. Penjelasan tiap halaman

### 🏠 Dashboard (`index.html`)

Semua pekerjaan ada di satu fungsi, `tampilkan()`:

1. Mengisi 4 kartu angka (Total, Tepat waktu, Terlambat, Berjalan).
2. Membuat tabel task dari `data.task`.
3. Membuat bar beban kerja untuk tiap developer.

Fungsi `tampilkan()` dipanggil sekali saat halaman terbuka.

### 📋 Halaman Task (`task.html`)

Ada kolom pencarian dan tiga filter (developer, prioritas, status). Pilihan di filter diisi dari `data`, jadi developer baru langsung muncul di filter.

Logika filternya, untuk setiap task:

```js
var cocok = true;                        // anggap lolos dulu
if (nama tidak mengandung kata kunci)        { cocok = false; }
if (filter developer dipilih, tapi beda)     { cocok = false; }
if (filter prioritas dipilih, tapi beda)     { cocok = false; }
if (filter status dipilih, tapi beda)        { cocok = false; }
if (cocok) { tampilkan task ini }
```

Cara berpikirnya seperti saringan bertingkat. Task hanya lolos kalau memenuhi semua syarat sekaligus.

Fungsi `tampilkan()` dipanggil ulang setiap kali kamu mengetik di kolom cari atau mengganti pilihan filter. Teks di bawah tabel juga ikut berubah, misalnya "Menampilkan 2 dari 4 task".

### 👥 Halaman Developer (`developer.html`)

Mirip halaman Task, dengan kolom tambahan: jumlah task dan bar beban kerja.

Aturan khusus: **developer yang masih punya task tidak boleh dihapus.**

```js
var jumlahTask = hitung(data.task, 'developerId', id);
if (jumlahTask > 0) {
  // tampilkan peringatan, lalu berhenti
  return;
}
```

### 🏷️ Halaman Role dan Prioritas

Kedua halaman ini hampir sama. Form di sebelah kanan bisa berada di dua mode, dikendalikan variabel `idSedangDiubah`:

| `idSedangDiubah` | Mode | Judul form | Tombol |
|---|---|---|---|
| `null` | Tambah | "Tambah role" | Simpan Role |
| berisi id | Ubah | "Ubah role" | Simpan Perubahan (+ tombol Batal) |

Fungsi-fungsinya:

| Fungsi | Tugas |
|---|---|
| `tampilkan()` | Membuat tabel |
| `mulaiUbah(id)` | Mengubah form menjadi mode ubah dan mengisi nama lama |
| `resetForm()` | Mengembalikan form ke mode tambah |
| `simpanRole()` / `simpanPrioritas()` | Memeriksa isian lalu menyimpan |
| `ubahRole(id)` / `hapusRole(id)` | Dipanggil tombol Ubah dan Hapus di tabel |

Pemeriksaan saat Simpan:
1. Nama kosong → peringatan.
2. Nama sudah ada (huruf besar atau kecil dianggap sama) → peringatan.
3. Kalau lolos: mode tambah menambah data baru, mode ubah mengganti nama yang lama.

Aturan hapus:
- Role yang masih dipakai developer tidak boleh dihapus.
- Prioritas yang masih dipakai task tidak boleh dihapus.

### ✏️ Form Tambah dan Ubah Task (`tambah-task.html`)

Saat halaman dibuka:
1. Dropdown **Developer** dan **Prioritas** diisi dari `data`.
2. Kolom **ID** diisi `'Task' + dua(data.idBerikut.task)`, misalnya `Task05`.
3. Kalau alamatnya mengandung `?edit=Task01`, semua kolom diisi dengan data lama task itu, judul berubah menjadi "Ubah Task", dan tombol menjadi "Simpan Perubahan".

Saat tombol Simpan ditekan:
1. Halaman dicegah memuat ulang (`e.preventDefault()`).
2. Isian diperiksa satu per satu. Kalau ada yang salah, popup peringatan muncul dan kursor pindah ke kolom itu.
3. Kalau semua benar:
   - **Mode tambah:** task baru dimasukkan ke `data.task`, lalu `idBerikut.task` naik 1.
   - **Mode ubah:** data task lama diperbarui.
4. `simpanData()` dipanggil.
5. Popup ✅ tampil, lalu halaman pindah:
   - Task baru → `index.html`.
   - Task diubah → `task.html`.

### ✏️ Form Tambah dan Ubah Developer (`tambah-developer.html`)

Alurnya sama dengan form task, tapi isiannya nama, role, dan capacity point. Setelah simpan, halaman pindah ke `developer.html`.

---

## 10. Logika penting

### A. ID otomatis

```
data.idBerikut.task = 5        →  form menampilkan "Task05"
Simpan                         →  idBerikut.task menjadi 6
Tambah lagi                    →  form menampilkan "Task06"
```

Angka ini hanya naik dan tidak pernah turun, bahkan kalau ada task yang dihapus. Dengan begitu satu ID tidak pernah dipakai dua kali.

### B. Status task (otomatis)

Kamu tidak memilih status secara manual. Status dihitung dari dua tanggal:

```
Tanggal selesai kosong?
   ├─ ya  → "Berjalan"
   └─ tidak
        Selesai ≤ Deadline?
           ├─ ya    → "Tepat waktu"
           └─ tidak → "Terlambat"
```

Contoh:

| Task | Deadline | Selesai | Status |
|---|---|---|---|
| Task01 | 06 Agu | 11 Agu | Terlambat (selesai sesudah deadline) |
| Task03 | 20 Agu | - | Berjalan (belum selesai) |
| Task baru | 10 Sep | 08 Sep | Tepat waktu (selesai sebelum deadline) |

Kenapa tanggalnya bisa dibandingkan dengan `<=`? Karena formatnya `2026-08-06` (tahun-bulan-hari), urutan abjadnya sama dengan urutan waktunya.

### C. Beban kerja developer

```
Beban = total story point semua task developer ÷ capacity × 100%
```

Contoh Andi, capacity 30:
- Task01 = 2 poin, Task04 = 3 poin, total 5.
- 5 ÷ 30 × 100 ≈ **17%**.

Semua task dihitung, termasuk yang sudah selesai.

### D. Relasi data

Data yang saling terkait disambungkan lewat id:

```
Task ──developerId──► Developer ──roleId──► Role
 └─────prioritasId──► Prioritas
```

Saat menampilkan tabel task, kode "mengikuti panah" ini untuk menemukan nama developer, role, dan prioritas. Karena itu kalau kamu mengubah nama role di halaman Role, tampilan di Developer dan Task ikut berubah.

### E. Aturan pengaman hapus

| Yang dihapus | Syarat |
|---|---|
| Task | Bebas dihapus (setelah konfirmasi) |
| Developer | Tidak boleh punya task |
| Role | Tidak boleh dipakai developer |
| Prioritas | Tidak boleh dipakai task |

Tujuannya supaya tidak ada data yang "menggantung", misalnya task yang pemiliknya sudah tidak ada.

---

## 11. Contoh alur: menambah task

Ayo ikuti perjalanan satu task baru dari awal sampai akhir.

**Langkah 1: Buka form.** Kamu klik **+ Tambah Task** di Dashboard. Halaman `tambah-task.html` terbuka. Script membaca `window.name`, mengisi `data`, lalu mengisi dropdown. ID tampil `Task05`.

**Langkah 2: Isi form lalu tekan Simpan.** Misalnya:
- Nama: *Membuat halaman profil*
- Story point: 4
- Developer: Dev02 - Budi
- Prioritas: High
- Deadline: 2026-09-10

**Langkah 3: Pemeriksaan.** Script mengecek nama tidak kosong, poin minimal 1, dan deadline terisi. Semuanya lolos.

**Langkah 4: Simpan ke data.**
```js
data.task.push({ id: 'Task05', nama: 'Membuat halaman profil', poin: 4, ... });
data.idBerikut.task++;     // 5 menjadi 6
simpanData();              // masuk ke window.name
```

**Langkah 5: Popup.** Muncul ✅ "Task berhasil disimpan!" selama sekitar 1,6 detik.

**Langkah 6: Pindah ke Dashboard.** `index.html` terbuka dan membaca `window.name`. `tampilkan()` dijalankan:
- Total task naik menjadi 5.
- Task05 muncul di tabel dengan status **Berjalan**.
- Bar beban kerja Budi naik: sebelumnya 3 poin, sekarang 3 + 4 = 7 dari 20 (35%).

**Langkah 7: Buka halaman Task.** Task05 juga ada di sana, karena datanya sama.

**Langkah 8: Tekan F5.** Script mendeteksi refresh dan memakai data awal. Task05 hilang, tampilan kembali seperti semula.

---

## 12. Batasan proyek ini

- **Data tidak permanen.** Data hanya hidup selama tab yang sama masih terbuka. Menutup tab, refresh, atau membuka halaman di tab baru akan mengembalikan data awal.
- **Butuh internet** untuk memuat SweetAlert2 dan Tailwind dari CDN.
- **Tidak ada pengguna atau login.** Siapa saja yang membuka file ini mendapat data yang sama (data awal).

Kalau suatu hari kamu ingin data tersimpan permanen, ada dua jalan:
1. Memakai `localStorage` (tersimpan di browser, cukup menggantikan bagian `window.name`).
2. Memakai database dan server (misalnya Laravel, Node.js, atau PHP + MySQL), supaya data bisa dipakai banyak orang.

---

## 13. Latihan kecil

Coba ubah kode untuk memahaminya:

1. **Mudah:** Ubah waktu popup sukses dari `1600` menjadi `3000` di fungsi `popupSukses`. Apa yang berubah?
2. **Mudah:** Ubah teks `'Task berhasil disimpan!'` menjadi kalimat lain di file `tambah-task.html`.
3. **Sedang:** Tambahkan warna prioritas baru di array `warnaPrioritas`, lalu tambahkan prioritas baru di halaman Prioritas. Warnanya akan muncul sesuai urutan.
4. **Sedang:** Ubah `data.idBerikut.task` awal dari `5` menjadi `10`, lalu buka form tambah task. ID apa yang muncul?
5. **Menantang:** Ubah aturan status supaya task yang belum selesai tapi deadline-nya sudah lewat otomatis berstatus "Terlambat". (Petunjuk: bandingkan `t.deadline` dengan tanggal hari ini.)

---

## 🧾 Ringkasan cepat

| Hal | Cara kerjanya |
|---|---|
| Tempat data | Variabel `data` di memori |
| Antar halaman | Dititipkan di `window.name` lewat `simpanData()` |
| Refresh | Data dikembalikan ke awal |
| Tampilan tabel | Fungsi `tampilkan()` membuat HTML dari data |
| Tombol Ubah/Hapus | Satu pendengar klik di seluruh halaman |
| Popup | SweetAlert2 |
| ID otomatis | Penghitung `idBerikut` yang hanya naik |
| Status task | Dihitung dari deadline dan tanggal selesai |
