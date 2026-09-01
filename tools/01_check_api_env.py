# -*- coding: utf-8 -*-
import sys
import importlib

def check(title: str, module_name: str, required: bool = True) -> bool:
    try:
        mod = importlib.import_module(module_name)
        ver = getattr(mod, "__version__", None) or "OK"
        print(f"[OK] {title:<18}: {ver}")
        return True
    except Exception as e:
        tag = "WARN" if not required else "FAIL"
        print(f"[{tag}] {title:<18}: {e}")
        return not required

def main():
    print("=" * 45)
    print(" OpenHarmony Cloud Environment Check")
    print("=" * 45)
    
    all_ok = True
    all_ok &= check("Python", "sys")
    all_ok &= check("FastAPI", "fastapi")
    all_ok &= check("Uvicorn", "uvicorn")
    all_ok &= check("SQLAlchemy", "sqlalchemy")
    all_ok &= check("Pydantic", "pydantic")
    all_ok &= check("Requests", "requests")
    all_ok &= check("SQLite3", "sqlite3")
    
    print("-" * 45)
    if all_ok:
        print("[SUCCESS] All dependencies are ready!")
    else:
        print("[FAIL] Missing dependencies, please run: pip install -r requirements.txt")
    print("=" * 45)

if __name__ == "__main__":
    main()
