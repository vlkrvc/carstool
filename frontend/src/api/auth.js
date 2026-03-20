// src/api/auth.js
const BASE = "http://localhost:8000";

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function apiRegister(email, password, name) {
  const r = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.detail || "Registration failed");
  return data;
}

export async function apiLogin(email, password) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.detail || "Login failed");
  return data;
}

export async function fetchGarage(token) {
  const r = await fetch(`${BASE}/garage`, { headers: authHeaders(token) });
  if (!r.ok) throw new Error("Failed to fetch garage");
  return r.json();
}

export async function addToGarage(token, vehicleId, nickname, currentMileage) {
  const r = await fetch(`${BASE}/garage`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      vehicle_id: vehicleId,
      nickname: nickname || null,
      current_mileage: currentMileage,
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.detail || "Failed to add vehicle");
  return data;
}

export async function removeFromGarage(token, garageId) {
  const r = await fetch(`${BASE}/garage/${garageId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!r.ok) throw new Error("Failed to remove vehicle");
  return r.json();
}

export async function updateMileage(token, garageId, mileage) {
  const r = await fetch(`${BASE}/garage/${garageId}/mileage`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ current_mileage: mileage }),
  });
  if (!r.ok) throw new Error("Failed to update mileage");
  return r.json();
}

export async function fetchServiceLog(token, garageId) {
  const r = await fetch(`${BASE}/garage/${garageId}/log`, {
    headers: authHeaders(token),
  });
  if (!r.ok) throw new Error("Failed to fetch service log");
  return r.json();
}

export async function addServiceLog(token, garageId, entry) {
  const r = await fetch(`${BASE}/garage/${garageId}/log`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(entry),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.detail || "Failed to log service");
  return data;
}

export async function deleteServiceLog(token, garageId, logId) {
  const r = await fetch(`${BASE}/garage/${garageId}/log/${logId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!r.ok) throw new Error("Failed to delete log entry");
  return r.json();
}
