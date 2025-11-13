
const API_URL = "http://127.0.0.1:8000";

export async function fetchVehicles() {
  const res = await fetch(`${API_URL}/vehicles`);
  if (!res.ok) throw new Error("Failed to fetch vehicles");
  return res.json();
}

export async function fetchVehicleById(id) {
  const res = await fetch(`${API_URL}/vehicles/${id}`);
  if (!res.ok) throw new Error("Failed to fetch vehicle details");
  return res.json();
}
