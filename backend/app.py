import os
import asyncpg
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from contextlib import asynccontextmanager

load_dotenv()

DB_DSN = os.getenv("DATABASE_URL")
if not DB_DSN:
    raise ValueError("DATABASE_URL not found in environment variables")

# Global connection pool
db_pool = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create connection pool
    global db_pool
    try:
        db_pool = await asyncpg.create_pool(
            dsn=DB_DSN,
            min_size=1,
            max_size=10,
            command_timeout=60
        )
        print("✓ Database pool created successfully")
    except Exception as e:
        print(f"✗ Failed to create database pool: {e}")
        raise
    
    yield
    
    # Shutdown: Close pool
    if db_pool:
        await db_pool.close()
        print("✓ Database pool closed")

app = FastAPI(title="CarsTool API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def fetch_all(query: str, *args):
    """Execute query and return all rows as list of dicts"""
    if not db_pool:
        raise HTTPException(status_code=500, detail="Database pool not initialized")
    
    async with db_pool.acquire() as conn:
        try:
            rows = await conn.fetch(query, *args)
            return [dict(r) for r in rows]
        except Exception as e:
            print(f"Query error: {e}")
            print(f"Query: {query}")
            raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")

async def fetch_one(query: str, *args):
    """Execute query and return one row as dict or None"""
    if not db_pool:
        raise HTTPException(status_code=500, detail="Database pool not initialized")
    
    async with db_pool.acquire() as conn:
        try:
            row = await conn.fetchrow(query, *args)
            return dict(row) if row else None
        except Exception as e:
            print(f"Query error: {e}")
            print(f"Query: {query}")
            raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")


# Pydantic Models
class VehicleSummary(BaseModel):
    id: int
    year_start: int
    year_end: int
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
    details: Optional[str] = None


class Maintenance(BaseModel):
    id: int
    name: str
    interval_miles: Optional[int] = None
    interval_months: Optional[int] = None
    details: Optional[str] = None


class VehicleDetail(BaseModel):
    id: int
    year_start: int
    year_end: int
    make: str
    model: str
    trims: List[Trim]
    engines: List[Engine]
    drivetrains: List[str]
    issues: List[Issue]
    maintenance: List[Maintenance]


# API Endpoints
@app.get("/")
async def root():
    return {"message": "CarsTool API", "status": "running"}


@app.get("/healthz")
async def health():
    """Health check endpoint"""
    try:
        # Test database connection
        if not db_pool:
            return {"status": "error", "message": "Database pool not initialized"}
        
        async with db_pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/vehicles", response_model=List[VehicleSummary])
async def list_vehicles():
    """Get all vehicles"""
    try:
        vehicles = await fetch_all("""
            SELECT id, year_start, year_end, make, model 
            FROM vehicles 
            ORDER BY make, model, year_start;
        """)
        print(f"✓ Fetched {len(vehicles)} vehicles")
        return vehicles
    except Exception as e:
        print(f"✗ Error fetching vehicles: {e}")
        raise


@app.get("/vehicles/{vehicle_id}", response_model=VehicleDetail)
async def get_vehicle(vehicle_id: int):
    """Get detailed information about a specific vehicle"""
    
    try:
        # Get base vehicle info
        v = await fetch_one("""
            SELECT id, year_start, year_end, make, model
            FROM vehicles
            WHERE id = $1
        """, vehicle_id)

        if not v:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        # Get trims
        trims = await fetch_all("""
            SELECT id, vehicle_id, name AS trim_name
            FROM trims
            WHERE vehicle_id = $1
            ORDER BY name
        """, vehicle_id)

        # Get engines
        engines = await fetch_all("""
            SELECT DISTINCT e.id, e.name AS engine_name
            FROM engines e
            JOIN trim_engines te ON te.engine_id = e.id
            JOIN trims t ON t.id = te.trim_id
            WHERE t.vehicle_id = $1
            ORDER BY e.name
        """, vehicle_id)

        # Get drivetrains
        drivetrains = await fetch_all("""
            SELECT DISTINCT d.type AS name
            FROM drivetrains d
            JOIN trim_drivetrains td ON td.drivetrain_id = d.id
            JOIN trims t ON t.id = td.trim_id
            WHERE t.vehicle_id = $1
            ORDER BY d.type
        """, vehicle_id)

        # Get issues
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

        # Get maintenance
        maintenance = await fetch_all("""
            SELECT m.id, m.name, m.interval_miles, m.interval_months, m.details
            FROM maintenance m
            JOIN vehicle_maintenance vm ON vm.maintenance_id = m.id
            WHERE vm.vehicle_id = $1
            ORDER BY m.name
        """, vehicle_id)

        return VehicleDetail(
            id=v["id"],
            year_start=v["year_start"],
            year_end=v["year_end"],
            make=v["make"],
            model=v["model"],
            trims=trims,
            engines=engines,
            drivetrains=[d["name"] for d in drivetrains],
            issues=issues,
            maintenance=maintenance
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"✗ Error fetching vehicle {vehicle_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching vehicle: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)