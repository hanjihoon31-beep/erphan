import React, { createContext, useContext, useState } from "react";
import axios from "axios";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (employeeId, password) => {
    try {
      const res = await axios.post("http://localhost:3001/api/auth/login", {
        employeeId,
        password,
      });

      const loggedInUser = {
        token: res.data.token,
        role: res.data.role,
        name: res.data.name,
        employeeId: res.data.employeeId,
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
