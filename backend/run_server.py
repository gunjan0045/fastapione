#!/usr/bin/env python
import sys
import os
import subprocess
from pathlib import Path

os.chdir(Path(__file__).parent)
result = subprocess.run(
    [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"],
    capture_output=False,
    text=True
)
sys.exit(result.returncode)