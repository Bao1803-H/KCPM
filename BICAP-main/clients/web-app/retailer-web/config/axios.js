const axios = require("axios");

const api = axios.create({
  baseURL: process.env.API_GATEWAY_BASE_URL || "http://localhost:8000", // KONG GATEWAY
  timeout: 10000,
  withCredentials: true,
});

module.exports = api;
