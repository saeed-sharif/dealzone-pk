const CONFIG = window.DEALZONE_CONFIG;
const PASSWORD_KEY = "dealzone_admin_password";
const CLOUDINARY_KEY = "dealzone_cloudinary_settings";
const loginBox = document.getElementById("loginBox");
const adminPanel = document.getElementById("adminPanel");

function getPassword() {
  return localStorage.getItem(PASSWORD_KEY) || CONFIG.initialPassword;
}

function login() {
  const pass = document.getElementById("passwordInput").value;
  if (pass === getPassword()) {
    sessionStorage.setItem("dealzone_admin_session", "yes");
    showAdmin();
  } else {
    alert("Wrong password");
  }
}

function logout() {
  sessionStorage.removeItem("dealzone_admin_session");
  location.reload();
}

function showAdmin() {
  loginBox.classList.add("hidden");
  adminPanel.classList.remove("hidden");
  loadCloudinarySettings();
  renderAdminProducts();
}

if (sessionStorage.getItem("dealzone_admin_session") === "yes") {
  showAdmin();
}

function changePassword() {
  const current = document.getElementById("currentPassword").value;
  const next = document.getElementById("newPassword").value;
  const confirmNext = document.getElementById("confirmPassword").value;

  if (current !== getPassword()) return alert("Current password is wrong.");
  if (next.length < 8) return alert("New password must be at least 8 characters.");
  if (next !== confirmNext) return alert("New passwords do not match.");

  localStorage.setItem(PASSWORD_KEY, next);
  document.getElementById("currentPassword").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmPassword").value = "";
  alert("Password changed successfully.");
}

function resetPassword() {
  if (!confirm("Reset password to saeed@1122?")) return;
  localStorage.removeItem(PASSWORD_KEY);
  alert("Password reset to initial password: saeed@1122");
}

function getProducts() {
  return JSON.parse(localStorage.getItem("dealzone_products") || "[]");
}

function saveProducts(products) {
  localStorage.setItem("dealzone_products", JSON.stringify(products));
}

function getCloudinarySettings() {
  return JSON.parse(localStorage.getItem(CLOUDINARY_KEY) || "{}");
}

function saveCloudinarySettings() {
  const cloudName = document.getElementById("cloudName").value.trim();
  const uploadPreset = document.getElementById("uploadPreset").value.trim();

  if (!cloudName || !uploadPreset) {
    return alert("Please enter both Cloud Name and Upload Preset.");
  }

  localStorage.setItem(CLOUDINARY_KEY, JSON.stringify({ cloudName, uploadPreset }));
  alert("Cloudinary settings saved.");
}

function loadCloudinarySettings() {
  const settings = getCloudinarySettings();
  document.getElementById("cloudName").value = settings.cloudName || "";
  document.getElementById("uploadPreset").value = settings.uploadPreset || "";
}

async function uploadToCloudinary(file) {
  const { cloudName, uploadPreset } = getCloudinarySettings();
  if (!cloudName || !uploadPreset) return null;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "dealzone_pk_products");

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("Cloudinary upload failed. Check Cloud Name and Upload Preset.");
  }

  const data = await response.json();
  return data.secure_url;
}

function fileToDataUrl(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

document.getElementById("productForm").addEventListener("submit", async function (event) {
  event.preventDefault();

  const productName = document.getElementById("productName").value.trim();
  const productPrice = document.getElementById("productPrice").value.trim();
  const productCategory = document.getElementById("productCategory").value;
  const productStock = document.getElementById("productStock").value.trim() || "In Stock";
  const productDescription = document.getElementById("productDescription").value.trim();
  const imageUrlInput = document.getElementById("productImageUrl").value.trim();
  const file = document.getElementById("productImage").files[0];

  let image = imageUrlInput;

  try {
    if (!image && file) {
      const cloudUrl = await uploadToCloudinary(file);
      image = cloudUrl || await fileToDataUrl(file);
    }

    if (!image) return alert("Please upload an image or paste an image URL.");

    const products = getProducts();
    products.unshift({
      id: Date.now(),
      name: productName,
      price: productPrice,
      category: productCategory,
      stock: productStock,
      description: productDescription,
      image
    });

    saveProducts(products);
    document.getElementById("productForm").reset();
    renderAdminProducts();

    alert(image.startsWith("data:")
      ? "Product saved locally for demo. Configure Cloudinary for live image hosting."
      : "Product saved successfully with online image URL.");
  } catch (error) {
    alert(error.message);
  }
});

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;
  saveProducts(getProducts().filter(product => product.id !== id));
  renderAdminProducts();
}

function clearAllProducts() {
  if (!confirm("Delete all uploaded products?")) return;
  localStorage.removeItem("dealzone_products");
  renderAdminProducts();
}

function renderAdminProducts() {
  const box = document.getElementById("adminProducts");
  const products = getProducts();
  box.innerHTML = "";

  if (products.length === 0) {
    box.innerHTML = "<p>No products added yet.</p>";
    return;
  }

  products.forEach(product => {
    const item = document.createElement("div");
    item.className = "admin-item";
    item.innerHTML = `
      <img src="${product.image}" alt="${escapeHtml(product.name)}">
      <h3>${escapeHtml(product.name)}</h3>
      <p><b>${escapeHtml(product.price)}</b></p>
      <p>${escapeHtml(product.category)} | ${escapeHtml(product.stock || "In Stock")}</p>
      <p>${escapeHtml(product.description)}</p>
      <button class="btn danger full" onclick="deleteProduct(${product.id})">Delete</button>
    `;
    box.appendChild(item);
  });
}

function exportProducts() {
  document.getElementById("exportBox").value = JSON.stringify(getProducts(), null, 2);
}

function escapeHtml(text) {
  return String(text || "").replace(/[&<>"']/g, match => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[match]));
}
