
/* =========================
   DATABASE LOCALSTORAGE
========================= */

const DB_TABLES = [
  "customer",
  "category",
  "product",
  "orders",
  "order_detail",
  "payment",
  "staff",
  "delivery"
];

const DB_ID_FIELDS = {
  customer: "customer_id",
  category: "category_id",
  product: "product_id",
  orders: "order_id",
  order_detail: "order_detail_id",
  payment: "payment_id",
  staff: "staff_id",
  delivery: "delivery_id"
};

// Data hanya disiapkan satu kali.
async function initDB() {
  DB_TABLES.forEach(table => {
    if (!localStorage.getItem(table)) {
      localStorage.setItem(table, JSON.stringify([]));
    }
  });

  if (getAll("category").length === 0) {
    insert("category", { category_name: "Keripik" });
    insert("category", { category_name: "Kue Tradisional" });
  }

  if (getAll("product").length === 0) {
    const categories = getAll("category");

    insert("product", {
      category_id: categories[0].category_id,
      product_name: "Keripik Pisang",
      price: 15000,
      stock: 20,
      description: "Keripik pisang renyah dengan rasa manis alami.",
      photo: ""
    });

    insert("product", {
      category_id: categories[1].category_id,
      product_name: "Kue Kacang",
      price: 20000,
      stock: 15,
      description: "Kue kacang tradisional yang cocok untuk camilan.",
      photo: ""
    });

    insert("product", {
      category_id: categories[0].category_id,
      product_name: "Keripik Singkong",
      price: 12000,
      stock: 30,
      description: "Keripik singkong gurih dan renyah.",
      photo: ""
    });

    insert("product", {
      category_id: categories[1].category_id,
      product_name: "Kue Pia",
      price: 18000,
      stock: 12,
      description: "Kue pia dengan isian manis.",
      photo: ""
    });

    insert("product", {
      category_id: categories[0].category_id,
      product_name: "Keripik Jagung",
      price: 10000,
      stock: 25,
      description: "Camilan jagung renyah.",
      photo: ""
    });

    insert("product", {
      category_id: categories[1].category_id,
      product_name: "Kue Kelapa",
      price: 15000,
      stock: 10,
      description: "Kue kelapa tradisional.",
      photo: ""
    });
  }

  if (getAll("customer").length === 0) {
    insert("customer", {
      name: "Andi Demo",
      email: "andi@example.com",
      phone: "081234567890",
      password_hash: await hashPassword("andi123")
    });
  }

  if (getAll("staff").length === 0) {
    const demoStaff = [
      {
        name: "Admin UMKM",
        email: "admin@example.com",
        phone: "081111111111",
        password: "admin123",
        role: "admin"
      },
      {
        name: "Kurir Satu",
        email: "kurir1@example.com",
        phone: "082222222222",
        password: "kurir123",
        role: "kurir"
      },
      {
        name: "Kurir Dua",
        email: "kurir2@example.com",
        phone: "083333333333",
        password: "kurir123",
        role: "kurir"
      },
      {
        name: "Pemilik UMKM",
        email: "pemilik@example.com",
        phone: "084444444444",
        password: "pemilik123",
        role: "pemilik"
      }
    ];

    for (const staff of demoStaff) {
      insert("staff", {
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        password_hash: await hashPassword(staff.password),
        role: staff.role
      });
    }
  }
}

// Ambil semua record.
function getAll(table) {
  validateTable(table);
  return JSON.parse(localStorage.getItem(table) || "[]");
}

// Cari berdasarkan ID.
function getById(table, id) {
  validateTable(table);
  const idField = DB_ID_FIELDS[table];

  return getAll(table).find(item =>
    Number(item[idField]) === Number(id)
  ) || null;
}

// Insert record dengan auto-increment.
function insert(table, data) {
  validateTable(table);

  const rows = getAll(table);
  const idField = DB_ID_FIELDS[table];

  const nextId = rows.length
    ? Math.max(...rows.map(row => Number(row[idField]) || 0)) + 1
    : 1;

  const record = {
    ...data,
    [idField]: nextId
  };

  rows.push(record);
  localStorage.setItem(table, JSON.stringify(rows));

  return record;
}

// Update berdasarkan ID.
function update(table, id, changes) {
  validateTable(table);

  const rows = getAll(table);
  const idField = DB_ID_FIELDS[table];

  const index = rows.findIndex(row =>
    Number(row[idField]) === Number(id)
  );

  if (index === -1) {
    return null;
  }

  rows[index] = {
    ...rows[index],
    ...changes,
    [idField]: Number(id)
  };

  localStorage.setItem(table, JSON.stringify(rows));
  return rows[index];
}

// Delete berdasarkan ID.
function deleteRecord(table, id) {
  validateTable(table);

  const rows = getAll(table);
  const idField = DB_ID_FIELDS[table];

  const filtered = rows.filter(row =>
    Number(row[idField]) !== Number(id)
  );

  localStorage.setItem(table, JSON.stringify(filtered));

  return rows.length !== filtered.length;
}

function validateTable(table) {
  if (!DB_TABLES.includes(table)) {
    throw new Error("Nama tabel tidak valid: " + table);
  }
}

// Hash SHA-256.
async function hashPassword(password) {
  if (!crypto.subtle) {
    throw new Error(
      "SHA-256 tidak tersedia. Jalankan melalui localhost atau browser yang mendukung Web Crypto."
    );
  }

  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}
