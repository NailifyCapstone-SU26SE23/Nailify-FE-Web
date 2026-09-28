export function getErrorMessage(error, fallbackMessage = "Something went wrong.") {
  const data = error?.response?.data;
  
  if (data) {
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message.trim();
    }
    
    // ASP.NET Core validation errors
    if (data.errors && typeof data.errors === "object") {
      const firstKey = Object.keys(data.errors)[0];
      if (firstKey && Array.isArray(data.errors[firstKey]) && data.errors[firstKey][0]) {
        return data.errors[firstKey][0];
      }
    }
    
    if (typeof data.title === "string" && data.title.trim()) {
      return data.title.trim();
    }
  }

  if (error instanceof Error && typeof error.message === "string" && error.message.trim() && !error.message.includes("status code")) {
    return error.message.trim();
  }

  if (typeof error?.message === "string" && error.message.trim() && !error.message.includes("status code")) {
    return error.message.trim();
  }

  return fallbackMessage;
}
