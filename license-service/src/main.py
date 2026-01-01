from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="License Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock license data
license_data = {
    '1': {
        'isValidSeat': True,
        'seatType': 'Premium',
        'expirationDate': '2024-12-31'
    },
    '2': {
        'isValidSeat': True,
        'seatType': 'Standard',
        'expirationDate': '2024-06-30'
    },
    '3': {
        'isValidSeat': False,
        'seatType': 'Trial',
        'expirationDate': '2023-12-31'
    }
}

class LicenseStatus(BaseModel):
    isValidSeat: bool
    seatType: Optional[str] = None
    expirationDate: Optional[str] = None

# REST API endpoint: GET /users/:id/authorizations
@app.get("/users/{user_id}/authorizations", response_model=LicenseStatus)
async def get_user_authorizations(user_id: str):
    license_info = license_data.get(user_id)
    
    if not license_info:
        # Return default values if user not found
        return LicenseStatus(
            isValidSeat=False,
            seatType=None,
            expirationDate=None
        )
    
    return LicenseStatus(**license_info)

# Health check endpoint
@app.get("/health")
async def health():
    return {"status": "ok", "service": "license-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

