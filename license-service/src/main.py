from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import sys
from pathlib import Path

# Add src directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from data import read_licenses, write_licenses

app = FastAPI(title="License Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LicenseStatus(BaseModel):
    id: str
    isValidSeat: bool
    seatType: Optional[str] = None
    expirationDate: Optional[str] = None

# REST API endpoint: GET /users/:id/authorizations
@app.get("/users/{user_id}/authorizations", response_model=LicenseStatus)
async def get_user_authorizations(user_id: str):
    try:
        # Read licenses from file on each request
        license_data = read_licenses()
        license_info = license_data.get(user_id)
        
        if not license_info:
            # Return default values if user not found
            return LicenseStatus(
                id=user_id,
                isValidSeat=False,
                seatType=None,
                expirationDate=None
            )
        
        # Ensure id is set (use user_id as id)
        license_info['id'] = user_id
        return LicenseStatus(**license_info)
    except Exception as e:
        print(f"Error reading license data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Health check endpoint
@app.get("/health")
async def health():
    return {"status": "ok", "service": "license-service"}

@app.on_event("startup")
async def startup_event():
    """Verify data file is accessible on startup"""
    try:
        read_licenses()
        print("License Service started - reading data from file on each request")
    except Exception as e:
        print(f"Warning: Could not read license data file: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

