const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");
const fetch = global.fetch; // Node 18+

const auth = require("./src/auth/authentication");
const retailerController = require("./src/retailer/retailer.controller");

const app = express();
const PORT = 3000;

/* ================= VIEW ENGINE ================= */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "front-end", "template"));

/* ================= STATIC ================= */
app.use("/css", express.static(path.join(__dirname, "front-end", "css")));
app.use("/js", express.static(path.join(__dirname, "public", "js")));
app.use("/img", express.static(path.join(__dirname, "public", "img")));

/* ================= MIDDLEWARE ================= */
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

/* ================= SESSION (CART) ================= */
app.use(
  session({
    secret: "bicap-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

/* ================= PUBLIC ROUTES ================= */
app.get("/login", auth.showLogin);
app.post("/login", auth.login);
app.post("/logout", auth.logout);
app.get("/register", auth.showRegister);
app.post("/register", auth.register);

/* ================= PROTECTED PAGES ================= */
app.get("/marketplace", auth.requireAuth, retailerController.showMarketplace);
app.get("/my-orders", auth.requireAuth, retailerController.showMyOrders);
app.get("/orders/:id", auth.requireAuth, retailerController.showOrderDetail);
app.get("/profile", auth.requireAuth, retailerController.showProfile);

/* ================= CART PAGE ================= */
app.get("/cart", auth.requireAuth, (req, res) => {
  res.render("cart", {
    user: req.user,
    cart: req.session.cart || [],
    pageTitle: "Giỏ hàng",
  });
});

/* ================= CART API ================= */

/* ADD TO CART */
app.post("/cart/add", auth.requireAuth, (req, res) => {
  const { product } = req.body;

  if (!req.session.cart) {
    req.session.cart = [];
  }

  const exists = req.session.cart.find((i) => i.id === product.id);
  if (exists) {
    return res.status(400).json({ message: "Sản phẩm đã có trong giỏ" });
  }

  req.session.cart.push({
    id: product.id,
    name: product.name,
    price: product.price,
    quantity: 1,
  });

  res.json({ message: "Đã thêm vào giỏ hàng" });
});

/* UPDATE QTY */
app.post("/cart/update", auth.requireAuth, (req, res) => {
  const { id, delta } = req.body;

  if (!req.session.cart) {
    return res.json({ success: false });
  }

  const item = req.session.cart.find((i) => i.id == id);
  if (!item) {
    return res.json({ success: false });
  }

  item.quantity += delta;
  if (item.quantity < 1) item.quantity = 1;

  res.json({
    success: true,
    quantity: item.quantity,
  });
});

/* REMOVE ITEM */
app.post("/cart/remove", auth.requireAuth, (req, res) => {
  const { id } = req.body;

  if (!req.session.cart) {
    return res.json({ success: false });
  }

  req.session.cart = req.session.cart.filter((i) => i.id != id);
  res.json({ success: true });
});

/* ================= HOME REDIRECT ================= */
app.get("/", (req, res) => {
  const token = req.cookies.retailer_token || req.cookies.auth_token; // legacy fallback
  if (token) {
    res.redirect("/marketplace");
  } else {
    res.redirect("/login");
  }
});

/* =================================================
   🔥 API PROXY → KONG (ĐÃ FIX)
   ================================================= */
app.use("/api", auth.requireAuth, async (req, res) => {
  try {
    const kongBase = process.env.API_GATEWAY_BASE_URL || "http://localhost:8000";
    const kongUrl = `${kongBase}${req.originalUrl}`;
    const authToken = req.cookies.retailer_token || req.cookies.auth_token; // legacy fallback

    const response = await fetch(kongUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body:
        req.method === "GET" || req.method === "HEAD"
          ? undefined
          : JSON.stringify(req.body),
    });

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const text = await response.text();
      res.status(response.status).send(text);
    }

  } catch (err) {
    console.error("API proxy error:", err);
    res.status(502).json({ message: "Gateway error" });
  }
});

/* ================= START SERVER ================= */
app.listen(PORT, () => {
  console.log(`✅ Retailer Web running at http://localhost:${PORT}`);
});
