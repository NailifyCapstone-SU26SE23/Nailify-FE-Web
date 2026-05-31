import { mockUsers } from "./mockUsers";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  async login({ email, password }) {
    await wait(500);

    const normalizedEmail = email.trim().toLowerCase();
    const matchedUser = mockUsers.find((user) => user.email === normalizedEmail);

    if (!matchedUser || matchedUser.password !== password) {
      throw new Error("Invalid email or password.");
    }

    const user = Object.fromEntries(
      Object.entries(matchedUser).filter(([key]) => key !== "password"),
    );

    return {
      accessToken: `mock-token-${user.id}`,
      user,
    };
  },
};
