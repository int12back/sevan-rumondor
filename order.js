
/* =========================
   CHECKOUT DAN PESANAN
========================= */

// Validasi stok sebelum checkout.
// Stok tidak berkurang pada tahap ini.
function validateCheckoutStock(cartItems) {
  for (const item of cartItems) {
    const product = getById("product", item.product_id);

    if (!product || item.quantity > product.stock) {
      throw new Error(
        "stok tidak cukup: " + (product?.product_name || "Produk")
      );
    }
  }

  return true;
}

// Membuat pesanan.
function createOrder(shippingAddress) {
  const user = getSession();

  if (!user || user.role !== "pelanggan") {
    throw new Error("Silakan login sebagai pelanggan.");
  }

  const cartItems = getCartItems();

  if (!cartItems.length) {
    throw new Error("Keranjang masih kosong.");
  }

  if (!shippingAddress.trim()) {
    throw new Error("Alamat pengiriman wajib diisi.");
  }

  // D1: Validasi stok sebelum record dibuat.
  validateCheckoutStock(cartItems);

  const total = cartItems.reduce((sum, item) =>
    sum + (item.price * item.quantity), 0);

  // INSERT orders.
  const order = insert("orders", {
    customer_id: user.id,
    order_date: new Date().toISOString(),
    total,
    shipping_address: shippingAddress.trim(),
    order_status: "menunggu pembayaran"
  });

  // INSERT order_detail.
  cartItems.forEach(item => {
    insert("order_detail", {
      order_id: order.order_id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price
    });
  });

  // Stok belum dikurangi.
  clearCart();

  return order;
}

// Render checkout.
function renderCheckout() {
  const container = document.getElementById("checkout-summary");
  if (!container) return;

  const items = getCartItems();

  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>Keranjang kosong</h2>
        <a href="index.html" class="btn">Kembali ke Katalog</a>
      </div>
    `;

    const form = document.getElementById("checkout-form");
    if (form) form.hidden = true;
    return;
  }

  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Produk</th>
            <th>Jumlah</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${escapeHTML(item.product_name)}</td>
              <td>${item.quantity}</td>
              <td>${formatRupiah(item.subtotal)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <div class="flex-between">
      <strong>Total pesanan</strong>
      <strong class="price">${formatRupiah(getCartTotal())}</strong>
    </div>
  `;
}

// Proses checkout.
function handleCheckout(event) {
  event.preventDefault();

  const address = document.getElementById("shipping-address").value;
  const errorBox = document.getElementById("checkout-error");
  const resultBox = document.getElementById("checkout-result");

  errorBox.textContent = "";
  resultBox.innerHTML = "";

  try {
    const order = createOrder(address);

    resultBox.innerHTML = `
      <article class="card success-box">
        <h2>Pesanan berhasil dibuat!</h2>

        <p>Nomor pesanan:
          <strong>#${order.order_id}</strong>
        </p>

        <p>Total:
          <strong>${formatRupiah(order.total)}</strong>
        </p>

        <p>Status:
          <strong>${escapeHTML(order.order_status)}</strong>
        </p>

        <hr>

        <h3>Instruksi Transfer</h3>
        <p>Bank: BCA (simulasi)</p>
        <p>Nomor rekening: <strong>1234567890</strong></p>
        <p>Nama rekening: UMKM Camilan Lokal</p>
        <p>Jumlah transfer: <strong>${formatRupiah(order.total)}</strong></p>

        <p class="small">
          Ini adalah rekening contoh untuk simulasi tugas.
          Tidak perlu melakukan transfer nyata.
        </p>

        <hr>

        <p>
          Silakan buka halaman Pesanan untuk mengunggah
          bukti transfer pada tahap berikutnya.
        </p>

        <a href="orders.html" class="btn">
          Lihat Pesanan
        </a>
      </article>
    `;

    document.getElementById("checkout-form").hidden = true;
    showToast("Pesanan berhasil dibuat.");

  } catch (error) {
    errorBox.textContent = error.message;

    if (error.message.toLowerCase().includes("stok tidak cukup")) {
      showToast("stok tidak cukup", "error");
    } else {
      showToast(error.message, "error");
    }
  }
}
