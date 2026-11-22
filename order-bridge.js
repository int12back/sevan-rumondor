
/* =====================================
   CAMILAN LOKAL - ORDER BRIDGE
   Penghubung Checkout & Orders
===================================== */

(function () {
    "use strict";

    window.createLocalOrder = function (orderData) {
        if (!orderData || typeof orderData !== "object") {
            throw new Error("Data pesanan tidak valid.");
        }

        const items = orderData.items || orderData.products;

        if (!Array.isArray(items) || items.length === 0) {
            throw new Error("Keranjang masih kosong.");
        }

        const orders = JSON.parse(
            localStorage.getItem("orders") || "[]"
        );

        const newOrder = {
            id: "ORD-" + Date.now(),
            date: new Date().toISOString(),

            items: items.map(item => ({
                name: item.name || item.title || "Produk",
                price: Number(item.price || 0),
                quantity: Number(item.quantity || item.qty || 1)
            })),

            total: Number(orderData.total || 0),

            paymentStatus: "pending",
            orderStatus: "menunggu pembayaran",

            customer: orderData.customer || {},
            paymentMethod: orderData.paymentMethod || "transfer"
        };

        if (!newOrder.total) {
            newOrder.total = newOrder.items.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
            );
        }

        orders.unshift(newOrder);

        localStorage.setItem("orders", JSON.stringify(orders));

        return newOrder;
    };

})();
/* ---------- CHECKOUT & REDIRECT ---------- */

window.checkoutAndGo = function (checkoutData) {
    try {
        const order = window.createLocalOrder(checkoutData);

        if (!order) {
            alert("Pesanan gagal dibuat.");
            return;
        }

        alert("Pesanan berhasil dibuat!");

        window.location.href = "orders.html";

    } catch (error) {
        alert(error.message || "Terjadi kesalahan saat checkout.");
    }
};