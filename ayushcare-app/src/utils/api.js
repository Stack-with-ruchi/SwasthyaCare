const API_BASE_URL = import.meta.env.VITE_API_URL;

export async function apiRequest(path, options = {}) {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body && !isFormData
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type") || "";

  // Read response safely
  const rawText = await response.text();

  let data = {};

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error("Server returned non-JSON response:", rawText);

      throw new Error(
        "Server returned HTML instead of JSON. Please check API URL and backend routes.",
      );
    }
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed. Please try again.");
  }

  return data;
}

export { API_BASE_URL };
