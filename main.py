from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from openai import AsyncOpenAI

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Riddhi AI Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://frontend-gib4j5oay-mehefuz-and-riddhi.vercel.app",
        "https://frontend-csubf7vp1-mehefuz-and-riddhi.vercel.app",
        "https://frontend-f9gakx3kh-mehefuz-and-riddhi.vercel.app",
        "https://frontend-1bf2gqqmt-mehefuz-and-riddhi.vercel.app"
    ],  # Only allow requests from deployed Vercel frontends
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL")
mongo_client = AsyncIOMotorClient(MONGODB_URL)
db = mongo_client.riddhi_ai

# Global exception handler to log all errors
import logging
from fastapi.responses import JSONResponse
from fastapi.requests import Request
from fastapi import status

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc)},
    )

# OpenAI client
openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Models
class ChatMessage(BaseModel):
    mode: str  # "personal" or "academy"
    message: str
    user_id: str

class UserMemory(BaseModel):
    user_id: str
    favorites: Dict[str, str] = {}
    mood: Optional[str] = None

# Memory management endpoints
@app.get("/memory/{user_id}")
async def get_user_memory(user_id: str):
    memory = await db.user_memories.find_one({"user_id": user_id})
    if not memory:
        return UserMemory(user_id=user_id)
    return memory

@app.post("/memory")
async def update_user_memory(memory: UserMemory):
    await db.user_memories.update_one(
        {"user_id": memory.user_id},
        {"$set": memory.dict()},
        upsert=True
    )
    return {"status": "success"}

# Chat endpoint

@app.get("/test-error")
async def test_error():
    print("Test error endpoint hit!")
    raise Exception("This is a test error!")
@app.post("/chat")
async def chat(message: ChatMessage):
    print("/chat endpoint hit!")
    print("Received message:", message)
    # Get user memory
    memory = await get_user_memory(message.user_id)
    
    # Prepare system message based on mode
    if message.mode == "personal":
        system_message = f"You are Riddhi AI, a loving and caring boyfriend-style AI. User's favorite things: {memory.favorites}. Current mood: {memory.mood}. Respond in a romantic and caring way."
    else:  # academy mode
        system_message = "You are Riddhi AI, an expert tutor specializing in NCERT/CBSE Class 10 subjects. Provide clear, detailed explanations using examples when appropriate."

    # Call OpenAI API
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": message.message}
            ]
        )
        return {"response": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Root endpoint
@app.get("/")
def root():
    return {"message": "Backend is live!"}

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}