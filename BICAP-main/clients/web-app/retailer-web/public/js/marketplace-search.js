document.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector(".live-search");
  const grid = document.getElementById("productGrid");

  if (!input || !grid) return;

  let controller;

  input.addEventListener("input", async () => {
    const keyword = input.value.trim();

    // Abort request cũ
    if (controller) controller.abort();
    controller = new AbortController();

    try {
      // 🔹 Có keyword → search
      // 🔹 Không keyword → load full marketplace
      const url = keyword
        ? `/api/fetch-marketplace-products?name=${encodeURIComponent(keyword)}`
        : `/api/fetch-marketplace-products`;

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        console.error("Search failed:", res.status);
        return;
      }

      const products = await res.json();

      if (!products || products.length === 0) {
        grid.innerHTML = `<p>Không tìm thấy sản phẩm</p>`;
        return;
      }

      // ✅ RENDER CARD MỚI (CÓ ĐỦ DATA + CLASS)
      grid.innerHTML = products
        .map(
          (p) => `
          <div class="product-card">

            <!-- IMAGE (onerror=null prevents infinite blink loop) -->
            <div class="product-image">
              <img src="${p.imageUrl || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22%3E%3Crect fill=%22%23f3f6f4%22 width=%22160%22 height=%22160%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2212%22%3ENo image%3C/text%3E%3C/svg%3E'}" alt="${p.name}" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22%3E%3Crect fill=%22%23f3f6f4%22 width=%22160%22 height=%22160%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2212%22%3ENo image%3C/text%3E%3C/svg%3E'">
            </div>

            <!-- INFO -->
            <div class="product-info">
              <h3>${p.name}</h3>
              <p class="farm">Farm ID: ${p.farmId}</p>
              <p class="price">${Number(p.price).toLocaleString()} VND</p>
            </div>

            <!-- ACTION -->
            <div class="product-actions">
              <button class="btn-outline" onclick="openProductDetail(${p.id})">
                Xem chi tiết
              </button>
              <button
                class="btn-primary add-to-cart-btn"
                data-id="${p.id}"
                data-name="${p.name}"
                data-price="${p.price}"
              >
                Thêm vào giỏ
              </button>
            </div>

          </div>
        `
        )
        .join("");
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Search error:", err);
      }
    }
  });
});

/* ================= ADD TO CART ================= */

// ✅ EVENT DELEGATION – BẮT CẢ BUTTON RENDER SAU SEARCH
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-to-cart-btn");
  if (!btn) return;

  const product = {
    id: Number(btn.dataset.id),
    name: btn.dataset.name,
    price: Number(btn.dataset.price),
  };

  fetch("/cart/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product }),
  }).then((res) => {
    if (res.ok) {
      alert("Đã thêm vào giỏ hàng");
    } else {
      alert("Sản phẩm đã có trong giỏ");
    }
  });
});
