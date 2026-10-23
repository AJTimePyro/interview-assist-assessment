from fastapi import FastAPI

app = FastAPI(title="Interview Assistant API")


@app.get("/")
async def root():
    return {"message": "Interview Assistant API"}
