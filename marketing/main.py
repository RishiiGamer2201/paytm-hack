import uvicorn
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional
import os

from ml_pipeline import MLPipeline
from notification import NotificationService

app = FastAPI(title="Smart Marketing App")

# Mount static files for EDA images and index.html
if not os.path.exists("static/eda"):
    os.makedirs("static/eda")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Load ML Pipeline (Data/Models)
pipeline = MLPipeline("munimai_dataset_5000.csv")

# Initialize Notification Service
notifier = NotificationService()

class ComboApproval(BaseModel):
    combo: List[str]
    confidence: Optional[float] = 0.0

@app.get("/", response_class=HTMLResponse)
async def read_root():
    with open("static/index.html", "r", encoding="utf-8") as f:
        return f.read()

@app.get("/campaigns/suggest")
async def suggest_campaigns(festival: str = None, season: str = None):
    # 1. Apriori rules
    combos = pipeline.get_combo_suggestions(festival=festival, season=season)
    
    # 2. Prophet forecasting for next 7 days
    forecast = pipeline.forecast_sales(periods=7)
    
    # 3. Request early owner approval via FCM
    if combos:
        notifier.request_owner_approval(festival or season or "Upcoming Event", combos[0])

    return {
        "combos": combos,
        "forecast": forecast
    }

@app.post("/campaigns/approve")
async def approve_campaign(combo: ComboApproval):
    # Simulate Owner clicking "Approve" -> triggers WhatsApp broadcast
    success = notifier.broadcast_whatsapp_campaign({
        "combo": combo.combo,
        "confidence": combo.confidence
    })
    if success:
        return {"status": "success", "message": "Campaign broadcasted to users via WhatsApp"}
    else:
        return {"status": "error", "message": "Failed to broadcast campaign"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
