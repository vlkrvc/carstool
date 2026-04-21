import os
import asyncpg
import httpx
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, date
import bcrypt
import jwt

load_dotenv()

DB_DSN = os.getenv("DATABASE_URL")
if not DB_DSN:
    raise ValueError("DATABASE_URL not found in environment variables")

JWT_SECRET = os.getenv("JWT_SECRET", "carstool-dev-secret-change-in-prod")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 30

db_pool = None
security = HTTPBearer()


@asynccontextmanager
async def lifespan(app: FastAPI):
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
    if db_pool:
        await db_pool.close()
        print("✓ Database pool closed")


app = FastAPI(title="CarsTool API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DB HELPERS
# ============================================================

async def fetch_all(query: str, *args):
    if not db_pool:
        raise HTTPException(status_code=500, detail="Database pool not initialized")
    async with db_pool.acquire() as conn:
        try:
            rows = await conn.fetch(query, *args)
            return [dict(r) for r in rows]
        except Exception as e:
            print(f"Query error: {e}")
            raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")

async def fetch_one(query: str, *args):
    if not db_pool:
        raise HTTPException(status_code=500, detail="Database pool not initialized")
    async with db_pool.acquire() as conn:
        try:
            row = await conn.fetchrow(query, *args)
            return dict(row) if row else None
        except Exception as e:
            print(f"Query error: {e}")
            raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")

async def execute(query: str, *args):
    if not db_pool:
        raise HTTPException(status_code=500, detail="Database pool not initialized")
    async with db_pool.acquire() as conn:
        try:
            return await conn.execute(query, *args)
        except Exception as e:
            print(f"Query error: {e}")
            raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")


# ============================================================
# AUTH HELPERS
# ============================================================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: int, email: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=JWT_EXPIRY_DAYS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = int(payload["sub"])
        user = await fetch_one("SELECT id, email, name FROM users WHERE id = $1", user_id)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ============================================================
# PYDANTIC MODELS
# ============================================================

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
    notes: Optional[str] = None

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

class Recall(BaseModel):
    campaign_number: str
    component: str
    summary: str
    consequence: Optional[str] = None
    remedy: Optional[str] = None
    report_date: Optional[str] = None

# Auth models
class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    token: str
    user: dict

# Garage models
class AddGarageRequest(BaseModel):
    vehicle_id: int
    nickname: Optional[str] = None
    current_mileage: int = 0

class UpdateMileageRequest(BaseModel):
    current_mileage: int

class MaintenanceDueItem(BaseModel):
    maintenance_id: int
    name: str
    interval_miles: Optional[int]
    interval_months: Optional[int]
    notes: Optional[str]
    details: Optional[str]
    last_service_mileage: Optional[int]
    last_service_date: Optional[str]
    miles_until_due: Optional[int]
    status: str

class GarageEntry(BaseModel):
    id: int
    vehicle_id: int
    nickname: Optional[str]
    current_mileage: int
    created_at: str
    make: str
    model: str
    year_start: int
    year_end: int
    maintenance_due: List[MaintenanceDueItem]

class AddServiceLogRequest(BaseModel):
    maintenance_id: int
    service_date: str
    mileage: int
    notes: Optional[str] = None
    cost: Optional[float] = None

class ServiceLogEntry(BaseModel):
    id: int
    maintenance_id: int
    maintenance_name: str
    service_date: str
    mileage: int
    notes: Optional[str]
    cost: Optional[float]


# ============================================================
# MAINTENANCE DUE CALCULATION
# ============================================================

def calculate_due_status(
    interval_miles: Optional[int],
    current_mileage: int,
    last_service_mileage: Optional[int]
) -> tuple:
    if not interval_miles or last_service_mileage is None:
        return None, "unknown"
    next_due_mileage = last_service_mileage + interval_miles
    miles_until_due = next_due_mileage - current_mileage
    if miles_until_due <= 0:
        return miles_until_due, "due"
    elif miles_until_due <= 1000:
        return miles_until_due, "due_soon"
    else:
        return miles_until_due, "ok"


# ============================================================
# GENERAL ENDPOINTS
# ============================================================

@app.get("/")
async def root():
    return {"message": "CarsTool API", "status": "running"}

@app.get("/healthz")
async def health():
    try:
        if not db_pool:
            return {"status": "error", "message": "Database pool not initialized"}
        async with db_pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ============================================================
# VEHICLE ENDPOINTS
# ============================================================

@app.get("/vehicles", response_model=List[VehicleSummary])
async def list_vehicles():
    vehicles = await fetch_all("""
        SELECT id, year_start, year_end, make, model 
        FROM vehicles 
        ORDER BY make, model, year_start;
    """)
    return vehicles

@app.get("/vehicles/{vehicle_id}", response_model=VehicleDetail)
async def get_vehicle(vehicle_id: int):
    v = await fetch_one("""
        SELECT id, year_start, year_end, make, model
        FROM vehicles WHERE id = $1
    """, vehicle_id)
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    trims = await fetch_all("""
        SELECT id, vehicle_id, name AS trim_name
        FROM trims WHERE vehicle_id = $1 ORDER BY name
    """, vehicle_id)

    engines = await fetch_all("""
        SELECT DISTINCT e.id, e.name AS engine_name
        FROM engines e
        JOIN trim_engines te ON te.engine_id = e.id
        JOIN trims t ON t.id = te.trim_id
        WHERE t.vehicle_id = $1 ORDER BY e.name
    """, vehicle_id)

    drivetrains = await fetch_all("""
        SELECT DISTINCT d.type AS name
        FROM drivetrains d
        JOIN trim_drivetrains td ON td.drivetrain_id = d.id
        JOIN trims t ON t.id = td.trim_id
        WHERE t.vehicle_id = $1 ORDER BY d.type
    """, vehicle_id)

    issues = await fetch_all("""
        SELECT i.id, i.name AS issue, i.severity, i.details
        FROM issues i
        JOIN vehicle_issues vi ON vi.issue_id = i.id
        WHERE vi.vehicle_id = $1
        ORDER BY CASE i.severity
            WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4
        END
    """, vehicle_id)

    maintenance = await fetch_all("""
        SELECT m.id, m.name, m.interval_miles, m.interval_months, m.details, vm.notes
        FROM maintenance m
        JOIN vehicle_maintenance vm ON vm.maintenance_id = m.id
        WHERE vm.vehicle_id = $1 ORDER BY m.name
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


# ============================================================
# NHTSA RECALLS ENDPOINT
# ============================================================

@app.get("/vehicles/{vehicle_id}/recalls", response_model=List[Recall])
async def get_recalls(vehicle_id: int):
    v = await fetch_one("""
        SELECT make, model, year_start, year_end FROM vehicles WHERE id = $1
    """, vehicle_id)
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    seen = set()
    recalls = []

    async with httpx.AsyncClient(timeout=10.0) as client:
        for year in range(v["year_start"], v["year_end"] + 1):
            try:
                url = (
                    f"https://api.nhtsa.gov/recalls/recallsByVehicle"
                    f"?make={v['make']}&model={v['model']}&modelYear={year}"
                )
                resp = await client.get(url)
                if resp.status_code != 200:
                    continue
                for r in resp.json().get("results", []):
                    campaign = r.get("NHTSACampaignNumber", "")
                    if campaign in seen:
                        continue
                    seen.add(campaign)
                    recalls.append(Recall(
                        campaign_number=campaign,
                        component=r.get("Component", "Unknown"),
                        summary=r.get("Summary", "No summary available"),
                        consequence=r.get("Consequence") or None,
                        remedy=r.get("Remedy") or None,
                        report_date=r.get("ReportReceivedDate") or None,
                    ))
            except Exception as e:
                print(f"NHTSA error {v['make']} {v['model']} {year}: {e}")
                continue

    recalls.sort(key=lambda x: x.campaign_number, reverse=True)
    return recalls


# ============================================================
# AUTH ENDPOINTS
# ============================================================

@app.post("/auth/register", response_model=AuthResponse)
async def register(body: RegisterRequest):
    existing = await fetch_one("SELECT id FROM users WHERE email = $1", body.email.lower())
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    password_hash = hash_password(body.password)
    user = await fetch_one("""
        INSERT INTO users (email, password_hash, name)
        VALUES ($1, $2, $3)
        RETURNING id, email, name
    """, body.email.lower(), password_hash, body.name)
    token = create_token(user["id"], user["email"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"]}}


@app.post("/auth/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    user = await fetch_one("""
        SELECT id, email, name, password_hash FROM users WHERE email = $1
    """, body.email.lower())
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"], user["email"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"]}}


@app.get("/auth/me")
async def me(current_user=Depends(get_current_user)):
    return current_user


# ============================================================
# GARAGE ENDPOINTS
# ============================================================

@app.get("/garage", response_model=List[GarageEntry])
async def get_garage(current_user=Depends(get_current_user)):
    entries = await fetch_all("""
        SELECT g.id, g.vehicle_id, g.nickname, g.current_mileage,
               g.created_at, v.make, v.model, v.year_start, v.year_end
        FROM garage g
        JOIN vehicles v ON v.id = g.vehicle_id
        WHERE g.user_id = $1
        ORDER BY g.created_at DESC
    """, current_user["id"])

    result = []
    for entry in entries:
        maintenance_items = await fetch_all("""
            SELECT m.id, m.name, m.interval_miles, m.interval_months, m.details, vm.notes
            FROM maintenance m
            JOIN vehicle_maintenance vm ON vm.maintenance_id = m.id
            WHERE vm.vehicle_id = $1
            ORDER BY m.name
        """, entry["vehicle_id"])

        due_items = []
        for item in maintenance_items:
            last_service = await fetch_one("""
                SELECT mileage, service_date
                FROM service_log
                WHERE garage_id = $1 AND maintenance_id = $2
                ORDER BY mileage DESC
                LIMIT 1
            """, entry["id"], item["id"])

            last_mileage = last_service["mileage"] if last_service else None
            last_date = str(last_service["service_date"]) if last_service else None

            miles_until_due, status = calculate_due_status(
                item["interval_miles"],
                entry["current_mileage"],
                last_mileage
            )

            due_items.append(MaintenanceDueItem(
                maintenance_id=item["id"],
                name=item["name"],
                interval_miles=item["interval_miles"],
                interval_months=item["interval_months"],
                notes=item["notes"],
                details=item["details"],
                last_service_mileage=last_mileage,
                last_service_date=last_date,
                miles_until_due=miles_until_due,
                status=status
            ))

        status_order = {"due": 0, "due_soon": 1, "unknown": 2, "ok": 3}
        due_items.sort(key=lambda x: status_order.get(x.status, 99))

        result.append(GarageEntry(
            id=entry["id"],
            vehicle_id=entry["vehicle_id"],
            nickname=entry["nickname"],
            current_mileage=entry["current_mileage"],
            created_at=str(entry["created_at"]),
            make=entry["make"],
            model=entry["model"],
            year_start=entry["year_start"],
            year_end=entry["year_end"],
            maintenance_due=due_items
        ))

    return result


@app.post("/garage")
async def add_to_garage(body: AddGarageRequest, current_user=Depends(get_current_user)):
    vehicle = await fetch_one("SELECT id FROM vehicles WHERE id = $1", body.vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    entry = await fetch_one("""
        INSERT INTO garage (user_id, vehicle_id, nickname, current_mileage)
        VALUES ($1, $2, $3, $4)
        RETURNING id
    """, current_user["id"], body.vehicle_id, body.nickname, body.current_mileage)
    return {"id": entry["id"], "message": "Vehicle added to garage"}


@app.patch("/garage/{garage_id}/mileage")
async def update_mileage(
    garage_id: int,
    body: UpdateMileageRequest,
    current_user=Depends(get_current_user)
):
    entry = await fetch_one("""
        SELECT id FROM garage WHERE id = $1 AND user_id = $2
    """, garage_id, current_user["id"])
    if not entry:
        raise HTTPException(status_code=404, detail="Garage entry not found")
    await execute("""
        UPDATE garage SET current_mileage = $1 WHERE id = $2
    """, body.current_mileage, garage_id)
    return {"message": "Mileage updated"}


@app.delete("/garage/{garage_id}")
async def remove_from_garage(garage_id: int, current_user=Depends(get_current_user)):
    entry = await fetch_one("""
        SELECT id FROM garage WHERE id = $1 AND user_id = $2
    """, garage_id, current_user["id"])
    if not entry:
        raise HTTPException(status_code=404, detail="Garage entry not found")
    await execute("DELETE FROM garage WHERE id = $1", garage_id)
    return {"message": "Vehicle removed from garage"}


# ============================================================
# SERVICE LOG ENDPOINTS
# ============================================================

@app.get("/garage/{garage_id}/log", response_model=List[ServiceLogEntry])
async def get_service_log(garage_id: int, current_user=Depends(get_current_user)):
    entry = await fetch_one("""
        SELECT id FROM garage WHERE id = $1 AND user_id = $2
    """, garage_id, current_user["id"])
    if not entry:
        raise HTTPException(status_code=404, detail="Garage entry not found")
    logs = await fetch_all("""
        SELECT sl.id, sl.maintenance_id, m.name AS maintenance_name,
               sl.service_date, sl.mileage, sl.notes, sl.cost
        FROM service_log sl
        JOIN maintenance m ON m.id = sl.maintenance_id
        WHERE sl.garage_id = $1
        ORDER BY sl.mileage DESC
    """, garage_id)
    return [
        ServiceLogEntry(
            id=log["id"],
            maintenance_id=log["maintenance_id"],
            maintenance_name=log["maintenance_name"],
            service_date=str(log["service_date"]),
            mileage=log["mileage"],
            notes=log["notes"],
            cost=float(log["cost"]) if log["cost"] else None
        )
        for log in logs
    ]


@app.post("/garage/{garage_id}/log")
async def add_service_log(
    garage_id: int,
    body: AddServiceLogRequest,
    current_user=Depends(get_current_user)
):
    entry = await fetch_one("""
        SELECT id FROM garage WHERE id = $1 AND user_id = $2
    """, garage_id, current_user["id"])
    if not entry:
        raise HTTPException(status_code=404, detail="Garage entry not found")
    
    from datetime import date
    
    log = await fetch_one("""
        INSERT INTO service_log (garage_id, maintenance_id, service_date, mileage, notes, cost)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
    """, garage_id, body.maintenance_id,
        date.fromisoformat(body.service_date), body.mileage, body.notes, body.cost)
    return {"id": log["id"], "message": "Service logged"}


@app.delete("/garage/{garage_id}/log/{log_id}")
async def delete_service_log(
    garage_id: int,
    log_id: int,
    current_user=Depends(get_current_user)
):
    entry = await fetch_one("""
        SELECT id FROM garage WHERE id = $1 AND user_id = $2
    """, garage_id, current_user["id"])
    if not entry:
        raise HTTPException(status_code=404, detail="Garage entry not found")
    await execute("""
        DELETE FROM service_log WHERE id = $1 AND garage_id = $2
    """, log_id, garage_id)
    return {"message": "Log entry deleted"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
