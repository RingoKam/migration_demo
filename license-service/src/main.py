from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import sys
from pathlib import Path

# Add src directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from data import read_licenses, write_licenses
from kafka_producer import kafka_producer
from kafka_consumer import kafka_consumer

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

class UpdateLicenseInput(BaseModel):
    isValidSeat: Optional[bool] = None
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

# REST API endpoint: PUT /users/:id/authorizations
@app.put("/users/{user_id}/authorizations")
async def update_user_authorizations(user_id: str, input: UpdateLicenseInput):
    try:
        # Read current licenses
        license_data = read_licenses()
        
        # Get existing license or create new
        license_info = license_data.get(user_id, {})
        
        # Prepare updates
        updates = {}
        if input.isValidSeat is not None:
            license_info['isValidSeat'] = input.isValidSeat
            updates['isValidSeat'] = input.isValidSeat
        if input.seatType is not None:
            license_info['seatType'] = input.seatType
            updates['seatType'] = input.seatType
        if input.expirationDate is not None:
            license_info['expirationDate'] = input.expirationDate
            updates['expirationDate'] = input.expirationDate
        
        if not updates:
            raise HTTPException(status_code=400, detail="No updates provided")
        
        # Persist to file
        license_data[user_id] = license_info
        write_licenses(license_data)
        
        # Publish LICENSE_UPDATED event to Kafka
        try:
            kafka_producer.publish_event('LICENSE_UPDATED', user_id, updates)
        except Exception as e:
            print(f"Failed to publish license updated event: {e}")
            # Don't fail the request if Kafka publish fails
        
        return LicenseStatus(
            id=user_id,
            isValidSeat=license_info.get('isValidSeat', False),
            seatType=license_info.get('seatType'),
            expirationDate=license_info.get('expirationDate')
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating license data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Health check endpoint
@app.get("/health")
async def health():
    return {"status": "ok", "service": "license-service"}

@app.on_event("startup")
async def startup_event():
    """Verify data file is accessible on startup and start Kafka consumer"""
    try:
        read_licenses()
        print("License Service started - reading data from file on each request")
        # Start Kafka consumer
        kafka_consumer.start()
    except Exception as e:
        print(f"Warning: Could not read license data file: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Close Kafka producer and consumer on shutdown"""
    try:
        kafka_producer.close()
        kafka_consumer.close()
    except Exception as e:
        print(f"Error closing Kafka connections: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

