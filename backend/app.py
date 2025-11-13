import os
from typing import List, Optional
from datetime import datetime

import asyncpg
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv


load_dotenv()


DB_DSN = os.getenv("DATABASE_URL")

if not DB_DSN:
    raise ValueError("DATABASE_URL not found in environment variables")

app = FastAPI(
    title="CarsTool API",
    version="1.0.0",
    description="Backend API for CarsTool: Vehicle maintenance intelligence platform."
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
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



class Trim(BaseModel):
    trim_name: str


class Engine(BaseModel):
    engine_name: str
    horsepower: Optional[int] = None
    torque: Optional[int] = None


class FluidSpec(BaseModel):
    system: str
    spec: str
    capacity_liters: Optional[float]
    notes: Optional[str]


class MaintenanceInterval(BaseModel):
    miles_every: Optional[int]
    months_every: Optional[int]
    miles_first_at: Optional[int]
    months_first_at: Optional[int]


class MaintenanceItem(BaseModel):
    code: str
    name: str
    details: Optional[str]
    severity: str
    interval: Optional[MaintenanceInterval]


class CommonIssue(BaseModel):
    title: str
    description: str
    severity: str
    ts: datetime


class VehicleSummary(BaseModel):
    id: int
    year: int
    make: str
    model: str
    drivetrain: Optional[str]
    body_style: Optional[str]


class VehicleDetail(BaseModel):
    id: int
    year: int
    make: str
    model: str
    drivetrain: Optional[str]
    body_style: Optional[str]
    trims: List[Trim]
    engines: List[Engine]
    fluids: List[FluidSpec]
    maintenance: List[MaintenanceItem]
    common_issues: List[CommonIssue]



@app.get("/healthz")
async def health():
    return {"status": "ok"}


@app.get("/vehicles", response_model=List[VehicleSummary])
async def list_vehicles(
    make: Optional[str] = None,
    model: Optional[str] = None,
    year: Optional[int] = None,
):
    query = """
        SELECT 
            v.id,
            v.year,
            v.body_style,
            v.drivetrain,
            mk.name AS make,
            md.name AS model
        FROM vehicle v
        JOIN model md ON v.model_id = md.id
        JOIN make mk ON md.make_id = mk.id
        WHERE 1=1
    """

    params = []

    if make:
        query += f" AND mk.name ILIKE ${len(params) + 1}"
        params.append(f"%{make}%")

    if model:
        query += f" AND md.name ILIKE ${len(params) + 1}"
        params.append(f"%{model}%")

    if year:
        query += f" AND v.year = ${len(params) + 1}"
        params.append(year)

    query += " ORDER BY mk.name, md.name, v.year"

    return await fetch_all(query, *params)


@app.get("/vehicles/{vehicle_id}", response_model=VehicleDetail)
async def get_vehicle(vehicle_id: int):

    
    vehicle = await fetch_one("""
        SELECT 
            v.id,
            v.year,
            v.body_style,
            v.drivetrain,
            mk.name AS make,
            md.name AS model
        FROM vehicle v
        JOIN model md ON v.model_id = md.id
        JOIN make mk ON md.make_id = mk.id
        WHERE v.id = $1
    """, vehicle_id)

    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    
    trims = await fetch_all("""
        SELECT trim_name
        FROM trim
        WHERE vehicle_id = $1
        ORDER BY trim_name
    """, vehicle_id)

    
    engines = await fetch_all("""
        SELECT engine_name, horsepower, torque
        FROM engine
        WHERE vehicle_id = $1
        ORDER BY engine_name
    """, vehicle_id)

    
    fluids = await fetch_all("""
        SELECT system, spec, capacity_liters, notes
        FROM fluid_spec
        WHERE vehicle_id = $1
        ORDER BY system
    """, vehicle_id)

    
    maint_rows = await fetch_all("""
        SELECT 
            mi.code,
            mi.name,
            mi.details,
            mi.severity::text AS severity,
            iv.miles_every,
            iv.months_every,
            iv.miles_first_at,
            iv.months_first_at
        FROM maintenance_item mi
        LEFT JOIN maintenance_interval iv
            ON iv.maintenance_item_id = mi.id
        WHERE mi.vehicle_id = $1
        ORDER BY mi.code
    """, vehicle_id)

    maintenance_items = []

    for m in maint_rows:
        interval = None
        if any([m.get("miles_every"), m.get("months_every"),
                m.get("miles_first_at"), m.get("months_first_at")]):
            interval = MaintenanceInterval(
                miles_every=m.get("miles_every"),
                months_every=m.get("months_every"),
                miles_first_at=m.get("miles_first_at"),
                months_first_at=m.get("months_first_at"),
            )

        maintenance_items.append(MaintenanceItem(
            code=m["code"],
            name=m["name"],
            details=m.get("details"),
            severity=m["severity"],
            interval=interval
        ))

    
    issues = await fetch_all("""
        SELECT 
            title,
            description,
            severity::text AS severity,
            ts
        FROM common_issue
        WHERE vehicle_id = $1
        ORDER BY ts DESC
    """, vehicle_id)

    
    return VehicleDetail(
        id=vehicle["id"],
        year=vehicle["year"],
        body_style=vehicle["body_style"],
        drivetrain=vehicle["drivetrain"],
        make=vehicle["make"],
        model=vehicle["model"],
        trims=[Trim(**t) for t in trims],
        engines=[Engine(**e) for e in engines],
        fluids=[FluidSpec(**f) for f in fluids],
        maintenance=maintenance_items,
        common_issues=[CommonIssue(**i) for i in issues],
    )



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)