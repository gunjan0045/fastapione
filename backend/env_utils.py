from __future__ import annotations

import os
from pathlib import Path
from typing import Dict


def read_env_file(path: Path) -> Dict[str, str]:
    if not path.exists():
        return {}

    raw_text = None
    for encoding in ("utf-8-sig", "utf-16", "utf-8"):
        try:
            raw_text = path.read_text(encoding=encoding)
            break
        except UnicodeError:
            continue

    if raw_text is None:
        return {}

    values: Dict[str, str] = {}
    for raw_line in raw_text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue

        if line.startswith("export "):
            line = line[len("export "):].lstrip()

        if "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()

        if not key:
            continue

        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]

        values[key] = value

    return values


def load_env_file(path: Path, override: bool = False) -> Dict[str, str]:
    values = read_env_file(path)
    for key, value in values.items():
        if override or key not in os.environ:
            os.environ[key] = value
    return values
