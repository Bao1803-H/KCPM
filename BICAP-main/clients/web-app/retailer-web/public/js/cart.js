/************************************
 * INIT CART ITEMS
 ************************************/
window.cartItems = [];

function syncCartItemsFromDOM() {
  window.cartItems = [];
  document.querySelectorAll(".cart-item").forEach(item => {
    window.cartItems.push({
      id: Number(item.dataset.id),
      price: Number(item.dataset.price),
      quantity: Number(item.querySelector(".qty").innerText)
    });
  });
}

/************************************
 * TOTAL
 ************************************/
function updateGrandTotal() {
  let total = 0;

  document.querySelectorAll(".cart-item").forEach(row => {
    const price = Number(row.dataset.price || 0);
    const qty = Number(row.querySelector(".qty")?.innerText || 0);

    const itemTotal = price * qty;
    row.querySelector(".item-total").innerText = itemTotal + " VND";

    total += itemTotal;
  });

  const totalEl = document.getElementById("grandTotal");
  if (totalEl) totalEl.innerText = total;

  return total;
}

document.addEventListener("DOMContentLoaded", () => {
  syncCartItemsFromDOM();
  updateGrandTotal();
});

/************************************
 * FIX + / − BUTTON
 ************************************/
document.addEventListener("click", e => {
  // TĂNG
  if (e.target.classList.contains("plus")) {
    const row = e.target.closest(".cart-item");
    const qtyEl = row.querySelector(".qty");
    qtyEl.innerText = Number(qtyEl.innerText) + 1;

    syncCartItemsFromDOM();
    updateGrandTotal();
  }

  // GIẢM
  if (e.target.classList.contains("minus")) {
    const row = e.target.closest(".cart-item");
    const qtyEl = row.querySelector(".qty");
    const current = Number(qtyEl.innerText);

    if (current > 1) {
      qtyEl.innerText = current - 1;
      syncCartItemsFromDOM();
      updateGrandTotal();
    }
  }

  // XOÁ
  if (e.target.classList.contains("remove-btn")) {
    e.target.closest(".cart-item").remove();
    syncCartItemsFromDOM();
    updateGrandTotal();
  }
});

/************************************
 * ADD TO CART (from marketplace)
 ************************************/
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("add-to-cart-btn")) {
    const btn = e.target;

    const product = {
      id: Number(btn.dataset.id),
      name: btn.dataset.name,
      price: Number(btn.dataset.price),
    };

    fetch("/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("exists");
        return res.json();
      })
      .then(() => {
        alert("✅ Đã thêm vào giỏ hàng");
      })
      .catch(() => {
        alert("⚠️ Sản phẩm đã có trong giỏ");
      });
  }
});

/************************************
 * PAYMENT POPUP
 ************************************/
document.querySelector(".btn-checkout")?.addEventListener("click", () => {
  document.getElementById("paymentTotal").innerText = updateGrandTotal();
  document.getElementById("paymentOverlay")?.classList.add("show");
});

function closePayment() {
  document.getElementById("paymentOverlay")?.classList.remove("show");
}

/************************************
 * MOMO DEMO FLOW
 ************************************/
let currentPaymentToken = null;

/**
 * NEXT
 */
async function handlePaymentNext() {
  console.log("🔥 CLICK NEXT OK");

  const method = document.querySelector(
    "input[name='paymentMethod']:checked"
  )?.value;

  if (method !== "momo") {
    alert("Vui lòng chọn MoMo");
    return;
  }

  const addressInput = document.getElementById("shippingAddress");
  const shippingAddress = addressInput?.value.trim();

  if (!shippingAddress) {
    alert("Vui lòng nhập địa chỉ giao hàng");
    addressInput.focus();
    return;
  }

  window.shippingAddress = shippingAddress;
  await startMomoPayment();
}

/**
 * CREATE PAYMENT (DEMO MODE)
 */
async function startMomoPayment() {
  try {
    if (!window.cartItems.length) {
      alert("Giỏ hàng trống");
      return;
    }

    const res = await fetch("/api/payments/momo", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: window.cartItems.map(i => ({
          productId: i.id,
          quantity: i.quantity
        })),
        shippingAddress: window.shippingAddress
      })
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(text);
      throw new Error("Create payment failed");
    }

    const data = await res.json();
    currentPaymentToken = data.paymentToken;

    // Ẩn popup thanh toán
    document.getElementById("paymentOverlay").classList.remove("show");

    // HIỆN POPUP DEMO (KHÔNG redirect)
    const qrOverlay = document.getElementById("qrOverlay");

    qrOverlay.classList.remove("hidden");
    qrOverlay.classList.add("show");
    
    document.getElementById("qrTotal").innerText = data.amount;

  } catch (err) {
    console.error(err);
    alert("Không tạo được thanh toán MoMo");
  }
}

/**
 * CONFIRM PAYMENT (DEMO)
 */
async function confirmMomoPayment() {
  try {
    if (!currentPaymentToken) {
      alert("Thiếu payment token");
      return;
    }

    const res = await fetch(
      `/api/payments/momo/success/${currentPaymentToken}`,
      {
        method: "GET",
        credentials: "include"
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error(text);
      throw new Error("Confirm failed");
    }

    const order = await res.json();

    // Redirect order detail
    window.location.href = `/orders/${order.orderId}`;

  } catch (err) {
    console.error(err);
    alert("Thanh toán thất bại");
  }
}
