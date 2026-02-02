from fastapi import APIRouter, HTTPException, Body
from ..services.ai import ai_service

router = APIRouter()

@router.post("/analyze")
async def analyze_fund(data: dict = Body(...)):
    """
    Analyze fund based on provided info (id, name, estRate, etc.)
    """
    try:
        result = await ai_service.analyze_fund(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
