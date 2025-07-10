#!/usr/bin/env python3
"""
Korean Embedding Server Startup Script
"""
import subprocess
import sys
import os

def main():
    print("Starting Korean Embedding Server...")
    print("Model: jhgan/ko-sroberta-multitask")
    print("Port: 8000")
    print("=" * 50)
    
    # 서버 실행
    subprocess.run([
        sys.executable, "-m", "uvicorn", 
        "embedding_server:app", 
        "--host", "0.0.0.0", 
        "--port", "8000",
        "--reload"
    ])

if __name__ == "__main__":
    main() 