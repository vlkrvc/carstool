const API_BASE = "http://localhost:8000";

export async function fetchVehicles() {
  const res = await fetch(`${API_BASE}/vehicles`);
  if (!res.ok) throw new Error("Failed to load vehicles");
  return res.json();
}

export async function fetchVehicle(id) {
  const res = await fetch(`${API_BASE}/vehicles/${id}`);
  if (!res.ok) throw new Error("Failed to load vehicle details");
  return res.json();
}
