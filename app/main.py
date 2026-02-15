
from fastapi import FastAPI

app = FastAPI(title="Final Year Project Backend")

@app.get("/")
def home():
    return {"message": "Backend is working"}
