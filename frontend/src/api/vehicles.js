const API_BASE = "http://localhost:8000";


export async function fetchVehicles() {
  try {
    const res = await fetch(`${API_BASE}/vehicles`);
    if (!res.ok) throw new Error("Failed to load vehicles");
    return await res.json();
  } catch (err) {
    console.error("API error:", err);
    return [];
  }
}


export async function fetchVehicle(id) {
  try {
    const res = await fetch(`${API_BASE}/vehicles/${id}`);
    if (!res.ok) throw new Error("Failed to load vehicle");
    return await res.json();
  } catch (err) {
    console.error("API error:", err);
    return null;
  }
}
