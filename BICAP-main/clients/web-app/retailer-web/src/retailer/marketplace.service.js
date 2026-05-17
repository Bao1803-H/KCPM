const api = require("../../config/axios");

const getMarketplaceProducts = async (keyword = "", token) => {
  try {
    let url = "/api/fetch-marketplace-products";

    if (keyword && keyword.trim() !== "") {
      url += `?name=${encodeURIComponent(keyword.trim())}`;
    }

    const res = await api.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;
  } catch (err) {
    console.error("Marketplace API error:", err.message);
    return [];
  }
};

module.exports = {
  getMarketplaceProducts,
};
