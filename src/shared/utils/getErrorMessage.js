export function getErrorMessage(error, fallbackMessage = "Something went wrong.") {
  const apiMessage = error?.response?.data?.message;

  if (typeof apiMessage === "string" && apiMessage.trim()) {
    return apiMessage.trim();
  }

  if (error instanceof Error && typeof error.message === "string" && error.message.trim()) {
    return error.message.trim();
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message.trim();
  }

  return fallbackMessage;
}
