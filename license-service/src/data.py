import json
import os
from pathlib import Path
from typing import Dict, Any

DATA_DIR = Path(__file__).parent.parent / 'data'
LICENSES_FILE = DATA_DIR / 'licenses.json'


def ensure_data_dir():
    """Ensure data directory exists"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def read_licenses() -> Dict[str, Any]:
    """Read licenses from file"""
    try:
        ensure_data_dir()
        if not LICENSES_FILE.exists():
            # File doesn't exist, create empty structure
            print('Licenses file not found, creating empty file...')
            empty_licenses = {}
            write_licenses(empty_licenses)
            return empty_licenses
        
        with open(LICENSES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f'Error reading licenses file: {e}')
        raise


def write_licenses(licenses: Dict[str, Any]):
    """Write licenses to file"""
    try:
        ensure_data_dir()
        with open(LICENSES_FILE, 'w', encoding='utf-8') as f:
            json.dump(licenses, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f'Error writing licenses file: {e}')
        raise



