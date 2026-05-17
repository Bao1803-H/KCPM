document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("toggleBtn");
  const userArea = document.getElementById("userMenu");
  const userDropdown = document.querySelector(".user-dropdown");


  /* ========== TOGGLE SIDEBAR ========== */
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      sidebar.classList.toggle("collapsed");
    });
  }

  /* ========== USER MENU ========== */
  if (userArea && userDropdown) {
    userArea.addEventListener("click", (e) => {
  e.stopPropagation();
  userArea.classList.toggle("open");
});

    // ✅ THÊM CHẶN CLICK TRONG DROPDOWN
  userDropdown.addEventListener("click", (e) => {
    e.stopPropagation();
  });

    document.addEventListener("click", () => {
      userArea.classList.remove("open");
    });
  }

  /* ========== TOOLTIP ICON ========== */
  const menuItems = document.querySelectorAll(".sidebar-item");

  menuItems.forEach(item => {
    item.addEventListener("mouseenter", () => {
      if (sidebar.classList.contains("collapsed")) {
        item.classList.add("show-tooltip");
      }
    });

    item.addEventListener("mouseleave", () => {
      item.classList.remove("show-tooltip");
    });
  });
});
/* PRODUCT DETAIL POPUP */
async function openProductDetail(productId) {
  const overlay = document.getElementById("productDetailOverlay");
  if (!overlay) return;
  try {
    const res = await fetch(`/api/fetch-marketplace-products/${productId}`);
    if (!res.ok) throw new Error("Không tải được chi tiết sản phẩm");
    const p = await res.json();
    const img = document.getElementById("productDetailImg");
    const validImg = p.imageUrl ? p.imageUrl : "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23f3f6f4%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23999%22%3ENo image%3C/text%3E%3C/svg%3E";
    const svgFallback = "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23f3f6f4%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23999%22%3ENo image%3C/text%3E%3C/svg%3E";
    if (img) { img.src = validImg; img.alt = p.name; img.onerror = function() { this.onerror=null; this.src=svgFallback; }; }
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || ""; };
    set("productDetailName", p.name);
    set("productDetailFarm", "Farm ID: " + (p.farmId || "N/A"));
    set("productDetailPrice", (p.price ? Number(p.price).toLocaleString() : "0") + " VND");
    set("productDetailDesc", p.description || "Không có mô tả.");
    const addBtn = document.getElementById("productDetailAddCart");
    if (addBtn) {
      addBtn.onclick = () => {
        fetch("/cart/add", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product: { id: p.id, name: p.name, price: p.price } }) })
          .then(r => r.ok ? (alert("Đã thêm vào giỏ"), closeProductDetail()) : alert("Sản phẩm đã có trong giỏ"));
      };
    }
    overlay.classList.add("show");
  } catch (e) {
    console.error(e);
    alert("Không tải được chi tiết sản phẩm");
  }
}

function closeProductDetail() {
  const overlay = document.getElementById("productDetailOverlay");
  if (overlay) overlay.classList.remove("show");
}

function openQr(id) { openProductDetail(id); }
function closeQr() { closeProductDetail(); }