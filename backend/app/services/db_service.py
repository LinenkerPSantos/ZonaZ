import json
import sqlite3
import os
from config.settings import DB_PATH


def db_exists():
    return os.path.exists(DB_PATH)


def get_pagina_from_db(numero):
    if not db_exists():
        return None
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute(
        'SELECT dados FROM paginas WHERE numero = ?', (numero,)
    ).fetchone()
    conn.close()
    if row:
        return json.loads(row[0])
    return None
