import axios from "axios";

/* ===============================
   Base API URL
================================ */

const API_BASE =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5001/api";

/* ===============================
   Axios Client
================================ */

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

/* ===============================
   Token Helper
================================ */

const getToken = () => localStorage.getItem("token");

/* ===============================
   Request Interceptor
   (Automatically add token)
================================ */

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ===============================
   Error Handler
================================ */

const handleError = (error) => {
  console.error("API Error:", error);
  return error.response?.data || { error: "Something went wrong" };
};

/* ===============================
   Network / Device APIs
================================ */

export const fetchNetworkMetrics = async () => {
  try {
    const res = await apiClient.get("/metrics");
    return res.data;
  } catch (error) {
    return handleError(error);
  }
};

export const fetchDevices = async () => {
  try {
    const res = await apiClient.get("/devices");
    return res.data;
  } catch (error) {
    return handleError(error);
  }
};

export const fetchPolicies = async () => {
  try {
    const res = await apiClient.get("/policies");
    return res.data;
  } catch (error) {
    return handleError(error);
  }
};

export const createPolicy = async (policy) => {
  try {
    const res = await apiClient.post("/policies", policy);
    return res.data;
  } catch (error) {
    return handleError(error);
  }
};

export const updatePolicy = async (id, policy) => {
  try {
    const res = await apiClient.put(`/policies/${id}`, policy);
    return res.data;
  } catch (error) {
    return handleError(error);
  }
};

export const fetchTrafficLogs = async () => {
  try {
    const res = await apiClient.get("/traffic/logs");
    return res.data;
  } catch (error) {
    return handleError(error);
  }
};

export const sendUserMessage = async (senderId, receiverId, message) => {
  const res = await apiClient.post("/messages/send", {
    senderId,
    receiverId,
    message
  });

  return res.data;
};

export const getConversation = async (user1, user2) => {
  const res = await apiClient.get(`/messages/conversation/${user1}/${user2}`);
  return res.data;
};

/* ===============================
   AUTH
================================ */

export const signup = async (data) => {
  try {
    const res = await apiClient.post("/auth/signup", data);
    return res.data;
  } catch (error) {
    return handleError(error);
  }
};

export const login = async (email, password) => {
  try {
    const res = await apiClient.post("/auth/login", { email, password });
    return res.data;
  } catch (error) {
    return handleError(error);
  }
};

/* ===============================
   LISTINGS
================================ */

export const getListings = async () => {
  try {
    const res = await apiClient.get("/listings/all");
    return res.data;
  } catch (error) {
    return handleError(error);
  }
};

export const getMyListings = async () => {
  try {
    const res = await apiClient.get("/listings/my-listings");
    return res.data;
  } catch (error) {
    return handleError(error);
  }
};

export const createListing = async (data) => {
  try {
    const res = await apiClient.post("/listings/create", data);
    return res.data;
  } catch (error) {
    return handleError(error);
  }
};

export const deleteListing = async (listingId) => {
  try {
    const res = await apiClient.delete(`/listings/${listingId}`);
    return res.data;
  } catch (error) {
    return handleError(error);
  }
};

/* ===============================
   TRANSACTIONS
================================ */

export const getMyTransactions = async () => {
  try {
    const res = await apiClient.get("/transactions/my-transactions");
    return res.data;
  } catch (error) {
    return handleError(error);
  }
};

export const purchaseEnergy = async (listingId, units) => {
  try {
    const res = await apiClient.post("/transactions/purchase", {
      listingId,
      units,
    });
    return res.data;
  } catch (error) {
    return handleError(error);
  }
};

/* ===============================
   USERS / PROFILE
================================ */

export const getProfile = async (userId) => {
  try {
    const res = await apiClient.get(`/users/profile/${userId}`);
    return res.data;
  } catch (error) {
    return handleError(error);
  }
};

export const getMyProfile = async () => {
  try {
    const res = await apiClient.get("/users/me");
    return res.data;
  } catch (error) {
    return handleError(error);
  }
};

export const updateProfile = async (data) => {
  try {
    const res = await apiClient.put("/users/profile", data);
    return res.data;
  } catch (error) {
    return handleError(error);
  }
};

export const addBalance = async (amount) => {
  try {
    const res = await apiClient.post("/users/add-balance", { amount });
    return res.data;
  } catch (error) {
    return handleError(error);
  }
};

/* ===============================
   REVIEWS
================================ */

export const leaveReview = async (
  revieweeId,
  rating,
  comment,
  transactionId
) => {
  try {
    const res = await apiClient.post("/users/review", {
      revieweeId,
      rating,
      comment,
      transactionId,
    });
    return res.data;
  } catch (error) {
    return handleError(error);
  }
};

export const getUserReviews = async (userId) => {
  try {
    const res = await apiClient.get(`/users/reviews/${userId}`);
    return res.data;
  } catch (error) {
    return handleError(error);
  }
};

export const api = {
  signup,
  login,

  getListings,
  getMyListings,
  createListing,
  deleteListing,

  getMyTransactions,
  purchaseEnergy,

  getProfile,
  getMyProfile,
  updateProfile,
  addBalance,

  leaveReview,
  getUserReviews
};