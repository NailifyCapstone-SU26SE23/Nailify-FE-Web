import { axiosClient } from "../../../../lib/axiosClient";
import { jwtDecode } from "jwt-decode";
import { ROLES } from "../../../../shared/constants/roles";

function normalizeRole(role) {
  const normalizedRole = String(role ?? "").trim().toLowerCase();

  switch (normalizedRole) {
    case "admin":
      return ROLES.admin;
    case "manager":
      return ROLES.manager;
    case "staff_artist":
      return ROLES.staff;
    default:
      return normalizedRole;
  }
}

export const authService = {
  async login({ email, password }) {
    try {
      const response = await axiosClient.post("/Auth/login", {
        email: email.trim(),
        password,
      });
      const token = response.data?.data?.token;

      if (!token) {
        throw new Error("Login response did not include a token.");
      }

      const claims = jwtDecode(token);
      const normalizedRole = normalizeRole(claims.role);

      return {
        accessToken: token,
        user: {
          id: claims.sub ?? claims.nameid ?? claims.jti ?? claims.email,
          email: claims.email ?? email.trim().toLowerCase(),
          fullName: claims.name ?? claims.email ?? "Nailify User",
          role: normalizedRole,
        },
      };
    } catch (error) {
      const apiMessage = error.response?.data?.message;
      throw new Error(apiMessage || error.message || "Sign-in failed.", {
        cause: error,
      });
    }
  },
};
