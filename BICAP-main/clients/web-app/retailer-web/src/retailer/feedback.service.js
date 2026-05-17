const api = require("../../config/axios");

const submitFeedback = async (token, payload) => {
  await api.post("/api/order-feedbacks", payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

module.exports = {
  submitFeedback,
};
