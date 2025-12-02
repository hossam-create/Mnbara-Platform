from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes import context

app = FastAPI(title="Mnbara Recommendation Service", version="1.0.0")

app.include_router(context.router, prefix="/api/v1/context", tags=["Context"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Recommendation Service is running (Python/FastAPI)"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
