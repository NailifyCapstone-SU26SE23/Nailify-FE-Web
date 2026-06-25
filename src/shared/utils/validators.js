export const validators = {
  email: (value) => /\S+@\S+\.\S+/.test(value ?? ""),
  required: (value) => String(value ?? "").trim().length > 0,
};
