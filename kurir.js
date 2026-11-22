
/* =====================================
   CAMILAN LOKAL - COURIER SYSTEM
===================================== */

document.addEventListener("DOMContentLoaded", renderCourierOrders);

/* ---------- STORAGE ---------- */

function courierGetOrders() {
    try {
        const data = JSON.parse(localStorage.getItem("orders") || "[]");

        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Data pesanan tidak valid.");
        return [];
    }
}

function courierSaveOrders(orders) {
    localStorage.setItem("orders", JSON.stringify(orders));
}

/* ---------- HELPERS ---------- */

function courierPaymentStatus(order) {
    return String(order.paymentStatus || "pending").toLowerCase();
}

function courierOrderStatus(order) {
    return String(order.orderStatus || "menunggu pembayaran").toLowerCase();
}

function courierFormatRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}

function courierEscape(value) {
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

function courierDate(order) {
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

function courierId(order, index) {
    return order.id || order.orderId || `ORD-${index + 1}`;
}

function courierTotal(order) {
    return Number(
        order.total ??
        order.totalPrice ??
        order.total_price ??
        order.amount ??
        0
    );
}

function courierItems(order) {
    return order.items || order.products || order.cart || [];
}

/* ---------- ELIGIBLE ORDERS ---------- */

function courierEligible(order) {
    const payment = courierPaymentStatus(order);
    const status = courierOrderStatus(order);

    const isPaid =
        payment.includes("paid") ||
        payment.includes("lunas") ||
        payment.includes("dibayar");

    const isDeliveryOrder =
        status.includes("diproses") ||
        status.includes("dikirim") ||
        status.includes("shipping") ||
        status.includes("selesai") ||
        status.includes("completed") ||
        status.includes("delivered");

    return isPaid && isDeliveryOrder;
}

/* ---------- SUMMARY ---------- */

function renderCourierSummary(orders) {
    const eligible = orders.filter(courierEligible);

    const ready = eligible.filter(order =>
        courierOrderStatus(order).includes("diproses")
    ).length;

    const shipping = eligible.filter(order =>
        courierOrderStatus(order).includes("dikirim") ||
        courierOrderStatus(order).includes("shipping")
    ).length;

    const completed = eligible.filter(order =>
        courierOrderStatus(order).includes("selesai") ||
        courierOrderStatus(order).includes("completed") ||
        courierOrderStatus(order).includes("delivered")
    ).length;

    document.getElementById("courierReady").textContent = ready;
    document.getElementById("courierShipping").textContent = shipping;
    document.getElementById("courierCompleted").textContent = completed;
}

/* ---------- PRODUCTS ---------- */

function renderCourierProducts(order) {
    const items = courierItems(order);

    if (!Array.isArray(items) || items.length === 0) {
        return "<p>Detail produk tidak tersedia.</p>";
    }

    return items.map(item => {
        const name = item.name || item.title || "Produk";
        const quantity = Number(item.quantity || item.qty || 1);
        const price = Number(item.price || 0);

        return `
            <div class="courier-product-row">
                <span>${courierEscape(name)} × ${quantity}</span>

                <span>
                    ${courierFormatRupiah(price * quantity)}
                </span>
            </div>
        `;
    }).join("");
}

/* ---------- CARD ---------- */

function renderCourierCard(order, originalIndex) {
    const id = courierId(order, originalIndex);
    const status = courierOrderStatus(order);

    const options = [
        { value: "diproses", label: "Siap dikirim" },
        { value: "dikirim", label: "Sedang dikirim" },
        { value: "selesai", label: "Pengiriman selesai" }
    ];

    return `
        <article class="courier-card">

            <div class="courier-card-header">
                <div>
                    <h3>Pesanan #${courierEscape(id)}</h3>
                    <p>${courierEscape(courierDate(order))}</p>
                </div>

                <span class="status ${
                    status.includes("selesai")
                    ? "completed"
                    : status.includes("dikirim")
                    ? "processing"
                    : "paid"
                }">
                    ${courierEscape(status)}
                </span>
            </div>

            <div class="courier-products">
                ${renderCourierProducts(order)}
            </div>

            <div class="courier-total">
                <span>Total Pesanan</span>
                <span>${courierFormatRupiah(courierTotal(order))}</span>
            </div>

            <div class="courier-info">
                <h4>Informasi Pengiriman</h4>

                <p>
                    Status pembayaran:
                    ${courierEscape(order.paymentStatus || "pending")}
                </p>

                <p>
                    Pelanggan:
                    ${courierEscape(order.customer?.name || "Tidak tersedia")}
                </p>

                <p>
                    Alamat:
                    ${courierEscape(order.customer?.address || "Tidak tersedia")}
                </p>
            </div>

            <div class="courier-controls">

                <label for="courier-status-${originalIndex}">
                    Perbarui status
                </label>

                <select id="courier-status-${originalIndex}">
                    ${options.map(option => `
                        <option
                            value="${option.value}"
                            ${status === option.value ? "selected" : ""}
                        >
                            ${option.label}
                        </option>
                    `).join("")}
                </select>

                <button
                    class="courier-save-btn"
                    onclick="courierUpdateStatus(${originalIndex})"
                >
                    Simpan Status
                </button>

            </div>

        </article>
    `;
}

/* ---------- RENDER ---------- */

function renderCourierOrders() {
    const orders = courierGetOrders();
    const container = document.getElementById("courierList");

    renderCourierSummary(orders);

    const eligibleOrders = orders
        .map((order, index) => ({ order, index }))
        .filter(entry => courierEligible(entry.order));

    if (eligibleOrders.length === 0) {
        container.innerHTML = `
            <div class="courier-empty">
                <h3>Belum ada pesanan pengiriman</h3>

                <p>
                    Pesanan yang telah dibayar dan siap diproses
                    akan muncul di sini.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML = eligibleOrders.map(entry =>
        renderCourierCard(entry.order, entry.index)
    ).join("");
}

/* ---------- UPDATE STATUS ---------- */

function courierUpdateStatus(index) {
    const orders = courierGetOrders();
    const order = orders[index];

    if (!order) {
        alert("Pesanan tidak ditemukan.");
        return;
    }

    if (!courierEligible(order)) {
        alert("Pesanan belum memenuhi syarat pengiriman.");
        return;
    }

    const select = document.getElementById(`courier-status-${index}`);
    const newStatus = select.value;

    order.orderStatus = newStatus;
    order.updatedAt = new Date().toISOString();

    orders[index] = order;

    courierSaveOrders(orders);

    alert("Status pengiriman berhasil diperbarui.");

    renderCourierOrders();
}
