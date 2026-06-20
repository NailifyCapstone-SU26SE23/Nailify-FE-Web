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
      const profileResponse = await axiosClient.get("/Profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const profilePayload = profileResponse.data;

      if (!profilePayload?.isSucceeded) {
        throw new Error(profilePayload?.message || "Failed to load user profile.");
      }

      const profile = profilePayload.data ?? {};
      const fullName =
        [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
        claims.name ||
        claims.email ||
        "Nailify User";

      return {
        accessToken: token,
        user: {
          id: profile.userId ?? claims.sub ?? claims.nameid ?? claims.jti ?? claims.email,
          userId: profile.userId ?? claims.sub ?? claims.nameid ?? claims.jti ?? claims.email,
          staffId: profile.staffId ?? null,
          salonId: profile.salonId ?? null,
          email: profile.email ?? claims.email ?? email.trim().toLowerCase(),
          phone: profile.phone ?? null,
          firstName: profile.firstName ?? "",
          lastName: profile.lastName ?? "",
          avatarUrl: profile.avatarUrl ?? "",
          fullName,
          status: profile.status ?? "",
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
