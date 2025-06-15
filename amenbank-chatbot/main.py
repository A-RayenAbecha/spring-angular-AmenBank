from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict
from chatbot.core import Chatbot
import uvicorn
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AmenBank Chatbot API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # Angular dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize chatbot
logger.info("Initializing chatbot...")
chatbot = Chatbot()
logger.info("Chatbot initialized successfully")

class ChatMessage(BaseModel):
    message: str
    user_context: Optional[Dict] = None

class ChatResponse(BaseModel):
    response: str
    intent: str
    confidence: float
    action: Optional[str] = None
    sentiment: str

@app.post("/api/chatbot/message", response_model=ChatResponse)
async def process_message(chat_message: ChatMessage):
    try:
        logger.info(f"Received message: {chat_message.message}")
        result = chatbot.process_message(
            chat_message.message,
            chat_message.user_context
        )
        logger.info(f"Chatbot response: {result}")
        return ChatResponse(**result)
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chatbot/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    logger.info("Starting chatbot server...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 