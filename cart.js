
/* =========================
   KERANJANG BELANJA
   Simpan pada sessionStorage
========================= */

const CART_KEY = "cart";

// Ambil keranjang.
function getCart() {
  try {
    return JSON.parse(sessionStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

// Simpan keranjang.
function saveCart(cart) {
  sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderNavigation();
}

// Tambah produk.
function addToCart(productId, quantity = 1) {
  const product = getById("product", productId);

  if (!product) {
    throw new Error("Produk tidak ditemukan.");
  }

  if (product.stock <= 0) {
    throw new Error("Produk sedang habis.");
  }

  const cart = getCart();
  const existing = cart.find(item =>
    Number(item.product_id) === Number(productId)
  );

  const currentQuantity = existing ? existing.quantity : 0;
  const newQuantity = currentQuantity + Number(quantity);

  if (newQuantity > product.stock) {
    throw new Error("Stok tidak cukup.");
  }

  if (existing) {
    existing.quantity = newQuantity;
  } else {
    cart.push({
      product_id: Number(productId),
      quantity: Number(quantity)
    });
  }

  saveCart(cart);
  showToast("Produk ditambahkan ke keranjang");
}

// Ubah jumlah.
function updateCartQuantity(productId, quantity) {
  quantity = Number(quantity);

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Jumlah minimal 1.");
  }

  const product = getById("product", productId);

  if (!product || quantity > product.stock) {
    throw new Error("Stok tidak cukup.");
  }

  const cart = getCart();
  const item = cart.find(item =>
    Number(item.product_id) === Number(productId)
  );

  if (!item) {
    throw new Error("Produk tidak ditemukan di keranjang.");
  }

  item.quantity = quantity;
  saveCart(cart);
}

// Hapus produk dari keranjang.
function removeCartItem(productId) {
  const cart = getCart().filter(item =>
    Number(item.product_id) !== Number(productId)
  );

  saveCart(cart);
}

// Kosongkan keranjang.
function clearCart() {
  sessionStorage.removeItem(CART_KEY);
  renderNavigation();
}

// Data keranjang dengan informasi produk.
function getCartItems() {
  return getCart().map(item => {
    const product = getById("product", item.product_id);

    if (!product) return null;

    return {
      ...product,
      quantity: item.quantity,
      subtotal: product.price * item.quantity
    };
  }).filter(Boolean);
}

// Hitung total.
function getCartTotal() {
  return getCartItems().reduce((total, item) =>
    total + item.subtotal, 0);
}

// Render katalog.
function renderProducts(products, containerId = "product-list") {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!products.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Produk tidak ditemukan</h3>
        <p>Silakan coba pencarian lainnya.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(product => {
    const image = product.photo || placeholderImage();
    const stockStatus = product.stock > 0
      ? `<span class="badge badge-success">Tersedia (${product.stock})</span>`
      : `<span class="badge badge-danger">Habis (0)</span>`;

    return `
      <article class="product-card">
        <img src="${image}" alt="${escapeHTML(product.product_name)}"
          onerror="this.src=placeholderImage()">

        <div class="product-card-body">
          <h3>${escapeHTML(product.product_name)}</h3>

          <p class="price">${formatRupiah(product.price)}</p>

          <p>${escapeHTML(product.description)}</p>

          <div class="stock-info">${stockStatus}</div>

          <div class="actions">
            <a class="btn btn-outline"
              href="product.html?id=${product.product_id}">
              Lihat Detail
            </a>

            <button class="btn"
              onclick="handleAddCart(${product.product_id})"
              ${product.stock <= 0 ? "disabled" : ""}>
              Tambah ke Keranjang
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

// Handler tambah dari card.
function handleAddCart(productId) {
  try {
    addToCart(productId);
  } catch (error) {
    showToast(error.message, "error");
  }
}

// Render keranjang.
function renderCart() {
  const container = document.getElementById("cart-content");
  if (!container) return;

  const items = getCartItems();

  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>Keranjang kosong</h2>
        <p>Silakan pilih camilan terlebih dahulu.</p>
        <a href="index.html" class="btn">Belanja Sekarang</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Produk</th>
            <th>Harga</th>
            <th>Jumlah</th>
            <th>Subtotal</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${escapeHTML(item.product_name)}</td>
              <td>${formatRupiah(item.price)}</td>
              <td>
                <input type="number"
                  min="1"
                  max="${item.stock}"
                  value="${item.quantity}"
                  aria-label="Jumlah ${escapeHTML(item.product_name)}"
                  style="width:90px"
                  onchange="handleQuantityChange(${item.product_id}, this.value)">
              </td>
              <td>${formatRupiah(item.subtotal)}</td>
              <td>
                <button class="btn btn-danger"
                  onclick="handleRemoveCart(${item.product_id})">
                  Hapus
                </button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <section class="card">
      <div class="flex-between">
        <h2>Total Belanja</h2>
        <h2 class="price">${formatRupiah(getCartTotal())}</h2>
      </div>

      <div class="flex-row">
        <a href="index.html" class="btn btn-secondary">
          Lanjut Belanja
        </a>

        <a href="checkout.html" class="btn">
          Checkout
        </a>
      </div>
    </section>
  `;
}

// Handler jumlah.
function handleQuantityChange(productId, value) {
  try {
    updateCartQuantity(productId, value);
    renderCart();
    showToast("Jumlah keranjang diperbarui.");
  } catch (error) {
    showToast(error.message, "error");
    renderCart();
  }
}

// Handler hapus.
function handleRemoveCart(productId) {
  if (!confirm("Hapus produk ini dari keranjang?")) return;

  removeCartItem(productId);
  renderCart();
  showToast("Produk dihapus dari keranjang.");
}
