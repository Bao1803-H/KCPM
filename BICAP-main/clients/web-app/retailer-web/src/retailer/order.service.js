const api = require("../../config/axios");

const getMyOrders = async (token) => {
  try {
    const res = await api.get("/api/orders/my", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (err) {
    console.error("Order API error:", err.message);
    return [];
  }
};

const getOrderDetail = async (orderId, token) => {
  try {
    const res = await api.get(`/api/orders/detail/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (err) {
    console.error("Order API error:", err.message);
    return null;
  }
};

module.exports = {
  getMyOrders,
  getOrderDetail,
};
