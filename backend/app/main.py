from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, checklists, dashboard, export, jira, permissions, projects, roles, tasks, users

app = FastAPI(
    title="DeliverIt API",
    description="Task tracker that keeps teams focused and accountable",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers under /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(roles.router, prefix="/api")
app.include_router(permissions.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(checklists.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(jira.router, prefix="/api")
app.include_router(export.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/health")
async def api_health():
    return {"status": "ok", "service": "deliverit-backend"}
