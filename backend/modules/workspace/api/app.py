"""
Main FastAPI application.
"""

from fastapi import FastAPI

from workspace.api.router import api_router

app = FastAPI(title="CataChess Workspace API", version="1.0.0")

# Include main API router
app.include_router(api_router)
