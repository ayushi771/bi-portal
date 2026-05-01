const API_BASE = "http://127.0.0.1:8000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchFavorites() {
  const res = await fetch(`${API_BASE}/favorites`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load favorites");
  return await res.json();
}

export async function toggleFavorite(payload) {
  const res = await fetch(`${API_BASE}/favorites/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to toggle favorite");
  return await res.json();
}