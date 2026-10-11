import os
import sys
import uvicorn

if __name__ == "__main__":
    # Ensure root project is in sys.path
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"🚀 Démarrage du backend FastAPI OUMALYA sur http://{host}:{port}...")
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)
