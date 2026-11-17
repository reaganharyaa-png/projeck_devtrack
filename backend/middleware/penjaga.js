function wajibLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ pesan: 'Silakan login dulu.' });
  }
  next();
}

function hanyaAdminUntukUbahHapus(req, res, next) {
  const m = req.method;
  if ((m === 'PUT' || m === 'DELETE') && req.session.user.level !== 'admin') {
    return res.status(403).json({ pesan: 'Hanya admin yang boleh mengubah atau menghapus data.' });
  }
  next();
}

module.exports = { wajibLogin, hanyaAdminUntukUbahHapus };