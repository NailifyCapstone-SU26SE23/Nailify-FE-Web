export function errorHandler(error, fallbackMessage = "Something went wrong.") {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}
