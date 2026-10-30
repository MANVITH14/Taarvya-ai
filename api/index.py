"""
Vercel Serverless Function entrypoint for Taarvya AI backend.
"""
import os
import sys

# Add backend directory to sys.path so app modules are importable
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(root_dir, "backend")

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Set database path to /tmp on Vercel serverless environment
if os.environ.get("VERCEL"):
    os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:////tmp/taarvya.db")
    os.environ.setdefault("ENVIRONMENT", "production")

from app.main import app

# Vercel's Python runtime looks for 'app'
handler = app
