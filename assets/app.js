const CATEGORIES = window.DEALZONE_CONFIG.categories.map(name => ({
  name,
  id: "cat-" + name.replaceAll(" ", "-"),
  description: {
    "Fashion": "Shirts, apparel and daily wear products.",
    "Mobile Accessories": "Chargers, cables, earbuds, power banks and mobile essentials.",
    "Laptop Accessories": "Mouse, keyboard, stands, cooling pads and laptop essentials.",
    "Microphones": "Wireless mics, podcast mics, condenser mics and audio products.",
    "Car Accessories": "Car holders, chargers, dash cams and smart car gadgets."
  }[name] || "DealZone PK products."
}));

const categorySections = document.getElementById("categorySections");

function getLocalProducts() {
  return JSON.parse(localStorage.getItem("dealzone_products") || "[]");
}

async function getProducts() {
  const local = getLocalProducts();
  if (local.length) return local;

  try {
    const response = await fetch("assets/products.json", { cache: "no-store" });
    if (!response.ok) return [];
    return await response.json();
  } catch (e) {
    return [];
  }
}

function productCard(product) {
  const message = encodeURIComponent(`Hello DealZone PK, I want to order: ${product.name} - ${product.price}`);
  return `
    <article class="product-card">
      <div class="product-image">
        <img src="${product.image}" alt="${escapeHtml(product.name)}" loading="lazy">
      </div>
      <div class="product-info">
        <span class="product-category">${escapeHtml(product.category)}</span>
        <h4>${escapeHtml(product.name)}</h4>
        <p>${escapeHtml(product.description)}</p>
        <div class="price">${escapeHtml(product.price)}</div>
        <div class="stock">${escapeHtml(product.stock || "In Stock")}</div>
        <a class="wa-card" target="_blank" href="https://wa.me/${window.DEALZONE_CONFIG.whatsappNumber}?text=${message}">Order on WhatsApp</a>
      </div>
    </article>
  `;
}

async function renderCategorySections() {
  const products = await getProducts();
  categorySections.innerHTML = "";

  CATEGORIES.forEach(category => {
    const categoryProducts = products.filter(p => p.category === category.name);
    const block = document.createElement("section");
    block.className = "category-block";
    block.id = category.id;

    const productHtml = categoryProducts.length
      ? `<div class="product-grid">${categoryProducts.map(productCard).join("")}</div>`
      : `<div class="empty-category">
          <strong>No products in ${category.name} yet</strong>
          <span>Products uploaded under "${category.name}" will show here automatically.</span>
        </div>`;

    block.innerHTML = `
      <div class="category-head">
        <div>
          <h3>${category.name}</h3>
          <p>${category.description}</p>
        </div>
        <span class="count-badge">${categoryProducts.length} Product${categoryProducts.length === 1 ? "" : "s"}</span>
      </div>
      ${productHtml}
    `;
    categorySections.appendChild(block);
  });
}

function escapeHtml(text) {
  return String(text || "").replace(/[&<>"']/g, match => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[match]));
}

renderCategorySections();
