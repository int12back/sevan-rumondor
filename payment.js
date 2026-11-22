
/* =====================================
   CAMILAN LOKAL - PAYMENT SYSTEM
===================================== */

document.addEventListener("DOMContentLoaded", function () {
    renderOrders();
});

/* ---------- STORAGE ---------- */

function getOrders() {
    const possibleKeys = [
        "orders",
        "orderHistory",
        "order_history",
        "transactions"
    ];

    for (const key of possibleKeys) {
        const data = localStorage.getItem(key);

        if (data) {
            try {
                const parsed = JSON.parse(data);

                if (Array.isArray(parsed)) {
                    return parsed;
                }

                if (parsed && Array.isArray(parsed.orders)) {
                    return parsed.orders;
                }
            } catch (error) {
                console.warn("Data pesanan tidak valid:", key);
            }
        }
    }

    return [];
}

function saveOrders(orders) {
    localStorage.setItem("orders", JSON.stringify(orders));
}

/* ---------- HELPERS ---------- */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
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

function formatRupiah(amount) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(amount) || 0);
}

function getOrderId(order, index) {
    return order.id || order.orderId || order.invoice || `ORD-${index + 1}`;
}

function getOrderDate(order) {
    const date = order.date || order.createdAt || order.created_at;

    if (!date) return "Tanggal tidak tersedia";

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
        return String(date);
    }

    return parsedDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function getOrderTotal(order) {
    return Number(
        order.total ??
        order.totalPrice ??
        order.total_price ??
        order.amount ??
        0
    );
}

function getPaymentStatus(order) {
    const status = String(
        order.paymentStatus || order.payment_status || order.status || "pending"
    ).toLowerCase();

    if (
        status.includes("paid") ||
        status.includes("lunas") ||
        status.includes("dibayar")
    ) {
        return "paid";
    }

    if (
        status.includes("completed") ||
        status.includes("selesai")
    ) {
        return "completed";
    }

    if (
        status.includes("processing") ||
        status.includes("diproses")
    ) {
        return "processing";
    }

    return "pending";
}

function getStatusLabel(status) {
    const labels = {
        pending: "Menunggu Pembayaran",
        paid: "Lunas",
        processing: "Diproses",
        completed: "Selesai"
    };

    return labels[status] || "Menunggu Pembayaran";
}

/* ---------- SUMMARY ---------- */

function renderSummary(orders) {
    const total = orders.length;

    const pending = orders.filter(order =>
        getPaymentStatus(order) === "pending"
    ).length;

    const completed = orders.filter(order =>
        getPaymentStatus(order) === "completed"
    ).length;

    document.getElementById("totalOrders").textContent = total;
    document.getElementById("pendingOrders").textContent = pending;
    document.getElementById("completedOrders").textContent = completed;
}

/* ---------- PRODUCT LIST ---------- */

function getProducts(order) {
    return order.items || order.products || order.cart || [];
}

function renderProducts(order) {
    const products = getProducts(order);

    if (!Array.isArray(products) || products.length === 0) {
        return `
            <div class="order-product">
                <span>Detail produk tidak tersedia</span>
            </div>
        `;
    }

    return products.map(product => {
        const name = product.name || product.title || "Produk";
        const quantity = Number(
            product.quantity || product.qty || 1
        );

        const price = Number(
            product.price || product.productPrice || 0
        );

        return `
            <div class="order-product">
                <span>
                    ${escapeHTML(name)}
                    × ${quantity}
                </span>

                <span>
                    ${formatRupiah(price * quantity)}
                </span>
            </div>
        `;
    }).join("");
}

/* ---------- PAYMENT PROOF ---------- */

function renderPaymentBox(order, index, status) {
    if (status !== "pending") {
        return `
            <div class="payment-box">
                <h3>Status Pembayaran</h3>

                <p>
                    Pembayaran untuk pesanan ini
                    telah memiliki status:
                    <strong>${escapeHTML(getStatusLabel(status))}</strong>
                </p>

                ${
                    order.paymentProofName
                    ? `<div class="payment-proof">
                        Bukti: ${escapeHTML(order.paymentProofName)}
                       </div>`
                    : ""
                }
            </div>
        `;
    }

    return `
        <div class="payment-box">
            <h3>Konfirmasi Pembayaran</h3>

            <p>
                Pilih file bukti pembayaran.
                Format yang didukung: JPG, PNG, PDF.
                Maksimum 1 MB.
            </p>

            <input
                type="file"
                id="proof-${index}"
                accept=".jpg,.jpeg,.png,.pdf"
            >

            <button
                class="payment-btn"
                onclick="uploadPaymentProof(${index})"
            >
                Upload Bukti Pembayaran
            </button>

            <div
                class="payment-info"
                id="payment-info-${index}"
            ></div>
        </div>
    `;
}

/* ---------- ORDER TIMELINE ---------- */

function getOrderProgress(order) {
    const status = String(
        order.orderStatus || order.shippingStatus || order.status || ""
    ).toLowerCase();

    if (
        status.includes("selesai") ||
        status.includes("completed") ||
        status.includes("delivered")
    ) {
        return 3;
    }

    if (
        status.includes("dikirim") ||
        status.includes("shipping") ||
        status.includes("delivery")
    ) {
        return 2;
    }

    if (
        status.includes("diproses") ||
        status.includes("processing")
    ) {
        return 1;
    }

    return 0;
}

function renderTimeline(order) {
    const progress = getOrderProgress(order);

    const steps = [
        "Pesanan Dibuat",
        "Diproses",
        "Dikirim",
        "Selesai"
    ];

    return `
        <div class="order-timeline">

            ${steps.map((step, index) => {
                let className = "";

                if (index < progress) {
                    className = "completed";
                } else if (index === progress) {
                    className = "active";
                }

                return `
                    <div class="timeline-step ${className}">
                        <div class="timeline-circle">
                            ${index < progress ? "✓" : index + 1}
                        </div>

                        <div class="timeline-label">
                            ${step}
                        </div>
                    </div>
                `;
            }).join("")}

        </div>
    `;
}

/* ---------- RENDER ORDERS ---------- */

function renderOrders() {
    const orders = getOrders();
    const container = document.getElementById("ordersList");

    renderSummary(orders);

    if (orders.length === 0) {
        container.innerHTML = `
            <div class="empty-orders">
                <h3>Belum ada pesanan</h3>

                <p>
                    Pesanan yang dibuat akan muncul
                    di halaman ini.
                </p>

                <a href="index.html" class="btn">
                    Belanja Sekarang
                </a>
            </div>
        `;

        return;
    }

    container.innerHTML = orders.map((order, index) => {
        const id = getOrderId(order, index);
        const status = getPaymentStatus(order);
        const total = getOrderTotal(order);

        return `
            <article class="order-card">

                <div class="order-top">

                    <div>
                        <div class="order-id">
                            Pesanan #${escapeHTML(id)}
                        </div>

                        <div class="order-date">
                            ${escapeHTML(getOrderDate(order))}
                        </div>
                    </div>

                    <span class="status ${status}">
                        ${escapeHTML(getStatusLabel(status))}
                    </span>

                </div>

                <div class="order-products">
                    ${renderProducts(order)}
                </div>
                    ${renderTimeline(order)} 
                <div class="order-total">
                    <span>Total Pesanan</span>
                    <span>${formatRupiah(total)}</span>
                </div>

                ${renderPaymentBox(order, index, status)}

            </article>
        `;
    }).join("");
}

/* ---------- UPLOAD ---------- */

async function uploadPaymentProof(index) {
    const orders = getOrders();
    const order = orders[index];

    const input = document.getElementById(`proof-${index}`);
    const info = document.getElementById(`payment-info-${index}`);

    if (!order) {
        info.textContent = "Pesanan tidak ditemukan.";
        return;
    }

    if (getPaymentStatus(order) !== "pending") {
        info.textContent = "Pesanan ini tidak menunggu pembayaran.";
        return;
    }

    if (!input.files || input.files.length === 0) {
        info.textContent = "Silakan pilih file terlebih dahulu.";
        return;
    }

    const file = input.files[0];

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "application/pdf"
    ];

    if (!allowedTypes.includes(file.type)) {
        info.textContent = "Gunakan file JPG, PNG, atau PDF.";
        return;
    }

    if (file.size > 1024 * 1024) {
        info.textContent = "Ukuran file maksimal 1 MB.";
        return;
    }

    info.textContent = "Menyimpan bukti pembayaran...";

    try {
        const proofData = await readFileAsDataURL(file);

        order.paymentProofName = file.name;
        order.paymentProofData = proofData;
        order.paymentStatus = "pending";
        order.paymentSubmittedAt = new Date().toISOString();

        orders[index] = order;
        saveOrders(orders);

        info.textContent =
            "Bukti berhasil disimpan. Menunggu verifikasi pembayaran.";

        renderOrders();

    } catch (error) {
        console.error(error);

        info.textContent =
            "Gagal menyimpan bukti pembayaran.";
    }
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);

        reader.readAsDataURL(file);
    });
}
