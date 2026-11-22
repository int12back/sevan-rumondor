
/* =========================
   AUTENTIKASI DAN RBAC
========================= */

const SESSION_KEY = "ecommerce_session";

// Simpan sesi login.
function setSession(user) {
  const sessionUser = {
    id: user.customer_id || user.staff_id,
    name: user.name,
    email: user.email,
    role: user.role || "pelanggan"
  };

  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify(sessionUser)
  );
}

// Ambil sesi.
function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

// Keluar dari sesi.
function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = "login.html";
}

// Login berdasarkan email.
async function loginUser(email, password) {
  const passwordHash = await hashPassword(password);

  const customer = getAll("customer").find(user =>
    user.email.toLowerCase() === email.toLowerCase()
  );

  if (customer && customer.password_hash === passwordHash) {
    setSession(customer);
    return { success: true, user: getSession() };
  }

  const staff = getAll("staff").find(user =>
    user.email.toLowerCase() === email.toLowerCase()
  );

  if (staff && staff.password_hash === passwordHash) {
    setSession(staff);
    return { success: true, user: getSession() };
  }

  return {
    success: false,
    message: "Email atau kata sandi salah."
  };
}

// Registrasi pelanggan.
async function registerUser(data) {
  const name = data.name.trim();
  const email = data.email.trim().toLowerCase();
  const phone = data.phone.trim();
  const password = data.password;

  if (!name) {
    throw new Error("Nama wajib diisi.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Format email tidak valid.");
  }

  if (!phone || !/^[0-9+\-\s]{8,20}$/.test(phone)) {
    throw new Error("Nomor telepon tidak valid.");
  }

  if (password.length < 6) {
    throw new Error("Kata sandi minimal 6 karakter.");
  }

  const emailExists =
    getAll("customer").some(user => user.email === email) ||
    getAll("staff").some(user => user.email === email);

  if (emailExists) {
    throw new Error("Email sudah terdaftar.");
  }

  const passwordHash = await hashPassword(password);

  return insert("customer", {
    name,
    email,
    phone,
    password_hash: passwordHash
  });
}

// Guard halaman berdasarkan role.
function requireRole(allowedRoles) {
  const user = getSession();

  if (!user) {
    window.location.href = "login.html";
    return null;
  }

  if (!allowedRoles.includes(user.role)) {
    showToast("Anda tidak memiliki akses ke halaman ini.", "error");
    window.location.href = "index.html";
    return null;
  }

  return user;
}

// Guard untuk pelanggan.
function requireCustomer() {
  return requireRole(["pelanggan"]);
}

// Guard admin.
function requireAdmin() {
  return requireRole(["admin"]);
}

// Guard kurir.
function requireCourier() {
  return requireRole(["kurir"]);
}

// Guard pemilik.
function requireOwner() {
  return requireRole(["pemilik"]);
}

// Redirect berdasarkan role.
function redirectByRole(user) {
  if (!user) return;

  const destinations = {
    admin: "admin.html",
    kurir: "kurir.html",
    pemilik: "pemilik.html",
    pelanggan: "index.html"
  };

  window.location.href =
    destinations[user.role] || "index.html";
}
