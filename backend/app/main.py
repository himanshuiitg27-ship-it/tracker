import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import OperationalError, SQLAlchemyError

from .config import get_settings
from .database import Base, engine
from .routers import periods, stats, symptoms

logger = logging.getLogger("period-tracker")
settings = get_settings()

@asynccontextmanager
async def lifespan(_: FastAPI):
    # Creates tables if they don't exist yet; never drops or alters existing data.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Bloom - Period Tracker API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_handler(_: Request, exc: RequestValidationError):
    """Turn pydantic errors into one friendly message the UI can show."""
    messages = []
    for err in exc.errors():
        loc = ".".join(str(p) for p in err["loc"] if p not in ("body", "query"))
        msg = err["msg"].removeprefix("Value error, ")
        messages.append(f"{loc}: {msg}" if loc and err["type"] != "value_error" else msg)
    return JSONResponse(status_code=422, content={"detail": "; ".join(messages)})


@app.exception_handler(OperationalError)
async def db_down_handler(_: Request, exc: OperationalError):
    logger.exception("Database connection problem")
    return JSONResponse(
        status_code=503,
        content={"detail": "Can't reach the database right now. Please try again in a moment."},
    )


@app.exception_handler(SQLAlchemyError)
async def db_error_handler(_: Request, exc: SQLAlchemyError):
    logger.exception("Database error")
    return JSONResponse(status_code=500, content={"detail": "Something went wrong saving your data."})


@app.get("/api/health", tags=["health"])
def health():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"status": "ok", "database": engine.dialect.name}


app.include_router(periods.router)
app.include_router(symptoms.router)
app.include_router(stats.router)
