from fastapi import FastAPI
from scanner.router import router as scanner_router

app = FastAPI(title="Invasive Plant Scanner API")

# Include the scanner router
app.include_router(scanner_router, prefix="/scanner", tags=["Scanner"])

@app.get("/")
def root():
    return {"message": "API is running. Go to /docs to test the scanner."}

if __name__ == "__main__":
    import uvicorn
    # Run server accessible on local network (host 0.0.0.0)
    uvicorn.run(app, host="0.0.0.0", port=8000)