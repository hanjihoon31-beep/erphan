import React, { createContext, useContext, useState } from "react";
import apiClient from "../config/api";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (email, password) => {
    try {
      const res = await apiClient.post("/api/auth/login", {
        email,
        password,
      });

      const loggedInUser = {
        token: res.data.token,
        role: res.data.role,
        name: res.data.name,
        userId: res.data.userId,
      };

      localStorage.setItem("user", JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "로그인 중 오류가 발생했습니다.",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
