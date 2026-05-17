const api = require("../../config/axios");

const getProfile = async (token) => {
  const res = await api.get("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};

module.exports = {
  getProfile,
};
