// src/config/api.js
import axios from "axios";

// API 기본 URL 설정
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10초 타임아웃
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터 - JWT 토큰 자동 추가
apiClient.interceptors.request.use(
  (config) => {
    // localStorage에서 사용자 정보 가져오기
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 Unauthorized - 토큰 만료 또는 유효하지 않음
    if (error.response?.status === 401) {
      // 로그아웃 처리
      localStorage.removeItem("user");
      window.location.href = "/";
    }

    // 403 Forbidden - 권한 없음
    if (error.response?.status === 403) {
      console.error("Access denied:", error.response.data.message);
    }

    return Promise.reject(error);
  }
);

export { API_URL, apiClient };
export default apiClient;
