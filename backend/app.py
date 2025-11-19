import os
import asyncpg
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

DB_DSN = os.getenv("DATABASE_URL")
if not DB_DSN:
    raise ValueError("DATABASE_URL not found")

app = FastAPI(title="CarsTool API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:5173",
        "http://127.0.0.1",
        "http://127.0.0.1:5173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def fetch_all(query: str, *args):
    conn = await asyncpg.connect(dsn=DB_DSN)
    try:
        rows = await conn.fetch(query, *args)
        return [dict(r) for r in rows]
    finally:
        await conn.close()

async def fetch_one(query: str, *args):
    conn = await asyncpg.connect(dsn=DB_DSN)
    try:
        row = await conn.fetchrow(query, *args)
        return dict(row) if row else None
    finally:
        await conn.close()




class VehicleSummary(BaseModel):
    id: int
    year: int
    make: str
    model: str


class Trim(BaseModel):
    id: int
    vehicle_id: int
    trim_name: str


class Engine(BaseModel):
    id: int
    engine_name: str


class Issue(BaseModel):
    id: int
    issue: str
    severity: str
    details: str


class Maintenance(BaseModel):
    id: int
    name: str
    interval_miles: Optional[int]
    interval_months: Optional[int]
    details: Optional[str]



class VehicleDetail(BaseModel):
    id: int
    year: int
    make: str
    model: str
    trims: List[Trim]
    engines: List[Engine]
    drivetrains: List[str]
    issues: List[Issue]
    maintenance: List[Maintenance]



@app.get("/healthz")
async def health():
    return {"status": "ok"}



@app.get("/vehicles", response_model=List[VehicleSummary])
async def list_vehicles():
    return await fetch_all("""
        SELECT id, year, make, model 
        FROM vehicles 
        ORDER BY make, model, year;
    """)



@app.get("/vehicles/{vehicle_id}", response_model=VehicleDetail)
async def get_vehicle(vehicle_id: int):


    v = await fetch_one("""
        SELECT id, year, make, model
        FROM vehicles
        WHERE id = $1
    """, vehicle_id)

    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")


    trims = await fetch_all("""
        SELECT id, vehicle_id, name AS trim_name
        FROM trims
        WHERE vehicle_id = $1
        ORDER BY name
    """, vehicle_id)


    engines = await fetch_all("""
        SELECT DISTINCT e.id, e.name AS engine_name
        FROM engines e
        JOIN trim_engines te ON te.engine_id = e.id
        JOIN trims t ON t.id = te.trim_id
        WHERE t.vehicle_id = $1
        ORDER BY e.name
    """, vehicle_id)

    
    drivetrains = await fetch_all("""
        SELECT DISTINCT d.type AS name
        FROM drivetrains d
        JOIN trim_drivetrains td ON td.drivetrain_id = d.id
        JOIN trims t ON t.id = td.trim_id
        WHERE t.vehicle_id = $1
        ORDER BY d.type
    """, vehicle_id)

    
    issues = await fetch_all("""
        SELECT i.id, i.name AS issue, i.severity, i.details
        FROM issues i
        JOIN vehicle_issues vi ON vi.issue_id = i.id
        WHERE vi.vehicle_id = $1
        ORDER BY 
            CASE i.severity
                WHEN 'high' THEN 1
                WHEN 'medium' THEN 2
                WHEN 'low' THEN 3
                ELSE 4
            END
    """, vehicle_id)

    
    maintenance = await fetch_all("""
        SELECT m.id, m.name, m.interval_miles, m.interval_months, m.details
        FROM maintenance m
        JOIN vehicle_maintenance vm ON vm.maintenance_id = m.id
        WHERE vm.vehicle_id = $1
        ORDER BY m.name
    """, vehicle_id)

    return VehicleDetail(
        id=v["id"],
        year=v["year"],
        make=v["make"],
        model=v["model"],
        trims=trims,
        engines=engines,
        drivetrains=[d["name"] for d in drivetrains],
        issues=issues,
        maintenance=maintenance
    )