
/* =====================================
   CAMILAN LOKAL - ADMIN ORDERS
===================================== */

document.addEventListener("DOMContentLoaded", renderAdminOrders);

/* ---------- STORAGE ---------- */

function adminGetOrders() {
    try {
        const data = JSON.parse(localStorage.getItem("orders") || "[]");
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Data pesanan tidak valid.");
        return [];
    }
}

function adminSaveOrders(orders) {
    localStorage.setItem("orders", JSON.stringify(orders));
}

/* ---------- HELPERS ---------- */

function adminEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => {
        const map = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return map[char];
    });
}

function adminRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}

function adminStatus(order) {
    const status = String(
        order.paymentStatus || order.payment_status || "pending"
    ).toLowerCase();

    if (
        status.includes("paid") ||
        status.includes("lunas") ||
        status.includes("dibayar")
    ) return "paid";

    if (status.includes("rejected") || status.includes("ditolak")) {
        return "rejected";
    }

    return "pending";
}

function adminDate(order) {
    const value = order.date || order.createdAt || order.created_at;

    if (!value) return "Tanggal tidak tersedia";

    const date = new Date(value);

    if (isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function adminTotal(order) {
    return Number(
        order.total ??
        order.totalPrice ??
        order.total_price ??
        order.amount ??
        0
    );
}

function adminProducts(order) {
    const items = order.items || order.products || order.cart || [];

    if (!Array.isArray(items)) return [];

    return items;
}

/* ---------- SUMMARY ---------- */

function renderAdminSummary(orders) {
    const total = orders.length;

    const pending = orders.filter(order =>
        adminStatus(order) === "pending"
    ).length;

    const paid = orders.filter(order =>
        adminStatus(order) === "paid"
    ).length;

    document.getElementById("adminTotal").textContent = total;
    document.getElementById("adminPending").textContent = pending;
    document.getElementById("adminPaid").textContent = paid;
}

/* ---------- PAYMENT PROOF ---------- */

function renderProof(order, index) {
    if (!order.paymentProofName) {
        return `
            <p>Bukti pembayaran belum diunggah.</p>
        `;
    }

    const name = adminEscape(order.paymentProofName);

    if (
        typeof order.paymentProofData === "string" &&
        (
            order.paymentProofData.startsWith("data:image/") ||
            order.paymentProofData.startsWith("data:application/pdf")
        )
    ) {
        return `
            <p>Bukti pembayaran: ${name}</p>

            <div class="proof-preview">
                <a
                    href="${order.paymentProofData}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Lihat bukti pembayaran
                </a>
            </div>
        `;
    }

    return `
        <p>Bukti pembayaran: ${name}</p>
        <p>Data file tidak tersedia.</p>
    `;
}

/* ---------- PRODUCTS ---------- */

function renderAdminProducts(order) {
    return adminProducts(order).map(item => {
        const name = item.name || item.title || "Produk";
        const quantity = Number(item.quantity || item.qty || 1);
        const price = Number(item.price || 0);

        return `
            <div class="admin-product-row">
                <span>
                    ${adminEscape(name)} × ${quantity}
                </span>

                <span>
                    ${adminRupiah(price * quantity)}
                </span>
            </div>
        `;
    }).join("");
}

/* ---------- ORDER CARD ---------- */

function renderAdminCard(order, index) {
    const id = order.id || order.orderId || `ORD-${index + 1}`;
    const status = adminStatus(order);
    const shippingStatus = order.orderStatus || "menunggu pembayaran";

    const paymentOptions = [
        { value: "pending", label: "Menunggu pembayaran" },
        { value: "paid", label: "Lunas / Dibayar" },
        { value: "rejected", label: "Bukti ditolak" }
    ];

    const shippingOptions = [
        { value: "menunggu pembayaran", label: "Menunggu pembayaran" },
        { value: "diproses", label: "Diproses" },
        { value: "dikirim", label: "Dikirim" },
        { value: "selesai", label: "Selesai" }
    ];

    return `
        <article class="admin-order-card">

            <div class="admin-order-top">
                <div>
                    <h3>Pesanan #${adminEscape(id)}</h3>
                    <p>${adminEscape(adminDate(order))}</p>
                </div>

                <span class="status ${status}">
                    ${status === "paid"
                        ? "Lunas"
                        : status === "rejected"
                        ? "Bukti Ditolak"
                        : "Menunggu Pembayaran"}
                </span>
            </div>

            <div class="admin-order-products">
                ${renderAdminProducts(order)}
            </div>

            <div class="admin-total">
                <span>Total</span>
                <span>${adminRupiah(adminTotal(order))}</span>
            </div>

            <div class="admin-payment-info">
                <h4>Informasi Pembayaran</h4>

                <p>
                    Metode:
                    ${adminEscape(order.paymentMethod || "Tidak tersedia")}
                </p>

                ${renderProof(order, index)}
            </div>

            <div class="admin-controls">

                <div>
                    <label for="payment-${index}">
                        Status Pembayaran
                    </label>

                    <select id="payment-${index}">
                        ${paymentOptions.map(option => `
                            <option
                                value="${option.value}"
                                ${status === option.value ? "selected" : ""}
                            >
                                ${option.label}
                            </option>
                        `).join("")}
                    </select>
                </div>

                <div>
                    <label for="shipping-${index}">
                        Status Pesanan
                    </label>

                    <select id="shipping-${index}">
                        ${shippingOptions.map(option => `
                            <option
                                value="${option.value}"
                                ${shippingStatus === option.value ? "selected" : ""}
                            >
                                ${option.label}
                            </option>
                        `).join("")}
                    </select>
                </div>

            </div>

            <button
                class="admin-save-btn"
                onclick="adminUpdateOrder(${index})"
            >
                Simpan Perubahan
            </button>

        </article>
    `;
}

/* ---------- RENDER ---------- */

function renderAdminOrders() {
    const orders = adminGetOrders();
    const container = document.getElementById("adminOrdersList");

    renderAdminSummary(orders);

    if (orders.length === 0) {
        container.innerHTML = `
            <div class="admin-empty">
                <h3>Belum ada pesanan</h3>
                <p>Pesanan pelanggan akan ditampilkan di sini.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = orders.map((order, index) =>
        renderAdminCard(order, index)
    ).join("");
}

/* ---------- UPDATE ---------- */

function adminUpdateOrder(index) {
    const orders = adminGetOrders();
    const order = orders[index];

    if (!order) {
        alert("Pesanan tidak ditemukan.");
        return;
    }

    const paymentSelect = document.getElementById(`payment-${index}`);
    const shippingSelect = document.getElementById(`shipping-${index}`);

    const paymentStatus = paymentSelect.value;
    const shippingStatus = shippingSelect.value;

    if (
        shippingStatus === "dikirim" ||
        shippingStatus === "selesai"
    ) {
        if (paymentStatus !== "paid") {
            alert("Pembayaran harus berstatus lunas sebelum pesanan dikirim atau diselesaikan.");
            return;
        }
    }

    order.paymentStatus = paymentStatus;
    order.orderStatus = shippingStatus;
    order.updatedAt = new Date().toISOString();

    orders[index] = order;

    adminSaveOrders(orders);

    alert("Perubahan pesanan berhasil disimpan.");

    renderAdminOrders();
}
