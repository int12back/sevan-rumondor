
/* =========================
   UTILITAS UI
========================= */

// Escape input agar aman saat ditampilkan.
function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Format Rupiah.
function formatRupiah(amount) {
  return "Rp" + Number(amount || 0).toLocaleString("id-ID");
}

// Format tanggal Indonesia.
function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

// Placeholder gambar.
function placeholderImage() {
  return "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg"
        width="600" height="400" viewBox="0 0 600 400">
        <rect width="600" height="400" fill="#f3e5d8"/>
        <text x="50%" y="45%" text-anchor="middle"
          font-size="36" fill="#8b4513"
          font-family="Arial">Camilan Lokal</text>
        <text x="50%" y="60%" text-anchor="middle"
          font-size="22" fill="#8b4513"
          font-family="Arial">Foto Produk</text>
      </svg>
    `);
}

// Toast.
function showToast(message, type = "success") {
  let container = document.querySelector(".toast-container");

  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

// Jumlah item keranjang dari sessionStorage.
function getCartCount() {
  try {
    const cart = JSON.parse(sessionStorage.getItem("cart") || "[]");
    return cart.reduce((total, item) =>
      total + Number(item.quantity || 0), 0);
  } catch {
    return 0;
  }
}

// Render navigasi.
function renderNavigation() {
  const nav = document.getElementById("main-nav");
  if (!nav) return;

  const session = getSession();
  const cartCount = getCartCount();

  let links = [
    { label: "Beranda", href: "index.html" },
    { label: "Produk", href: "index.html" },
    {
      label: `Keranjang <span class="cart-badge">${cartCount}</span>`,
      href: "cart.html"
    }
  ];

  if (session?.role === "pelanggan") {
    links.push({ label: "Pesanan", href: "orders.html" });
  }

  if (session?.role === "admin") {
    links.push({ label: "Admin", href: "admin.html" });
  }

  if (session?.role === "kurir") {
    links.push({ label: "Tugas Kurir", href: "kurir.html" });
  }

  if (session?.role === "pemilik") {
    links.push({ label: "Laporan", href: "pemilik.html" });
  }

  if (session) {
    links.push({
      label: "Keluar",
      href: "#",
      action: "logout"
    });
  } else {
    links.push({ label: "Login", href: "login.html" });
  }

  nav.innerHTML = links.map(link => `
    <a href="${link.href}"
      ${link.action ? `data-action="${link.action}"` : ""}
      ${link.href === window.location.pathname.split("/").pop()
        ? 'class="active"' : ""}>
      ${link.label}
    </a>
  `).join("");

  nav.querySelectorAll('[data-action="logout"]').forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      logout();
    });
  });
}

// Header dan footer.
function renderLayout() {
  const header = document.querySelector(".site-header");

  if (header) {
    header.innerHTML = `
      <div class="container header-inner">
        <a class="brand" href="index.html">
          <span> Camilan Lokal </span>
        </a>
        <nav class="nav-links" id="main-nav"
          aria-label="Navigasi utama"></nav>
      </div>
    `;
    renderNavigation();
  }

  const footer = document.querySelector(".site-footer");

  if (footer) {
    footer.innerHTML = `
      <div class="container">
        <p><strong>Camilan Lokal</strong></p>
        <p>UMKM Camilan Lokal Berbasis Web</p>
        <p class="small">Proyek E-Business System</p>
      </div>
    `;
  }
}

// Inisialisasi semua halaman.
async function initUI() {
  await initDB();
  renderLayout();
}

// Jalankan saat halaman dibuka.
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await initUI();
  } catch (error) {
    console.error(error);
    showToast(
      "Gagal menginisialisasi aplikasi: " + error.message,
      "error"
    );
  }
});
