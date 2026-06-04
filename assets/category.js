const params = new URLSearchParams(window.location.search);

let CATEGORY_NAME =
  window.DEALZONE_CATEGORY_NAME ||
  params.get("category") ||
  "Fashion";

const titleEl = document.getElementById("categoryTitle"),
  descEl = document.getElementById("categoryDescription"),
  gridEl = document.getElementById("categoryProductGrid"),
  countEl = document.getElementById("categoryCount"),
  searchInput = document.getElementById("categorySearch"),
  sortSelect = document.getElementById("sortProducts"),
  warningEl = document.getElementById("setupWarning");

const DESCRIPTIONS = {
  "Fashion":
    "Shop DealZone PK fashion collection including shirts, t-shirts, hoodies and daily wear.",

  "Mobile Accessories":
    "Explore mobile chargers, cables, earbuds, power banks and useful mobile accessories.",

  "Laptop Accessories":
    "Find laptop stands, mouse, keyboards, cooling pads and smart laptop accessories.",

  "Microphones":
    "Browse wireless mics, podcast mics, condenser mics and audio recording accessories.",

  "Car Accessories":
    "Shop car phone holders, chargers, dash cams, Bluetooth adapters and car gadgets.",

  "Tools & Hardware":
    "Browse tool kits, screwdrivers, pliers, hammers, measuring tapes and hardware essentials."
};

function getSupabaseSettings() {
  const local = JSON.parse(
    localStorage.getItem("dealzone_supabase_settings") || "{}"
  );

  return {
    url: local.url || window.DEALZONE_CONFIG.supabaseUrl,
    key: local.key || window.DEALZONE_CONFIG.supabaseAnonKey
  };
}

function getSupabaseClient() {
  const s = getSupabaseSettings();

  if (!s.url || !s.key) return null;

  return window.supabase.createClient(s.url, s.key);
}

async function getProducts() {
  const c = getSupabaseClient();

  if (!c) {
    warningEl.classList.remove("hidden");
    warningEl.textContent = "Store setup is not completed yet.";
    return [];
  }

  warningEl.classList.add("hidden");

  const { data, error } = await c
    .from("products")
    .select("*")
    .eq("category", CATEGORY_NAME)
    .order("created_at", { ascending: false });

  if (error) {
    warningEl.classList.remove("hidden");
    warningEl.textContent = "Unable to load products right now.";
    return [];
  }

  return data || [];
}

function productCard(p) {
  const msg = encodeURIComponent(
    `Hello DealZone PK, I want to order: ${p.name} - ${p.price}`
  );

  return `
    <article class="product-card">
      <div class="product-image">
        <img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy">
      </div>

      <div class="product-info">
        <span class="product-category">${escapeHtml(p.category)}</span>

        <h4>${escapeHtml(p.name)}</h4>

        <p>${escapeHtml(p.description)}</p>

        <div class="product-meta-box">
          <div class="meta-item price-meta">
            <span>Price</span>
            <strong>${escapeHtml(p.price)}</strong>
          </div>

          <div class="meta-item stock-meta">
            <span>Available Stock</span>
            <strong>${escapeHtml(p.stock || "In Stock")}</strong>
          </div>
        </div>

        <div class="card-actions">
          <a class="read-more-btn" href="product.html?id=${encodeURIComponent(p.id)}">
            Read More
          </a>

          <a class="wa-card"
             target="_blank"
             href="https://wa.me/${window.DEALZONE_CONFIG.whatsappNumber}?text=${msg}">
            Order on WhatsApp
          </a>
        </div>
      </div>
    </article>
  `;
}

let allProducts = [];

async function renderProducts() {
  titleEl.textContent = CATEGORY_NAME;

  descEl.textContent =
    DESCRIPTIONS[CATEGORY_NAME] ||
    "Browse DealZone PK category products.";

  allProducts = await getProducts();

  applyFilters();
}

function priceNumber(p) {
  return Number(String(p.price || "").replace(/[^\d.]/g, "")) || 0;
}

function applyFilters() {
  let list = [...allProducts];

  const q = (searchInput?.value || "").toLowerCase().trim();

  if (q) {
    list = list.filter(
      (p) =>
        String(p.name).toLowerCase().includes(q) ||
        String(p.description).toLowerCase().includes(q) ||
        String(p.price).toLowerCase().includes(q)
    );
  }

  const s = sortSelect?.value || "newest";

  if (s === "price-low") {
    list.sort((a, b) => priceNumber(a) - priceNumber(b));
  }

  if (s === "price-high") {
    list.sort((a, b) => priceNumber(b) - priceNumber(a));
  }

  drawProducts(list);
}

function drawProducts(products) {
  countEl.textContent =
    `${products.length} Product${products.length === 1 ? "" : "s"}`;

  gridEl.innerHTML = products.length
    ? products.map(productCard).join("")
    : `
      <div class="empty-category">
        <strong>No products in ${escapeHtml(CATEGORY_NAME)} yet</strong>
        <span>Upload products from admin panel and select this category.</span>
      </div>
    `;
}

if (searchInput) {
  searchInput.addEventListener("input", applyFilters);
}

if (sortSelect) {
  sortSelect.addEventListener("change", applyFilters);
}

function escapeHtml(t) {
  return String(t || "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

renderProducts();
