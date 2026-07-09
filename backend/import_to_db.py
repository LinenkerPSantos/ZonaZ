"""
Importa os dados dos arquivos .docx para o banco SQLite.

Uso:
    python import_to_db.py          # importa todas as páginas
    python import_to_db.py 5        # importa apenas a página 5

Rode este script sempre que alterar um .docx.
Em produção, só o arquivo zona_z.db precisa ser enviado (não os .docx).
"""
import sys
import os
import json
import sqlite3

sys.path.insert(0, os.path.dirname(__file__))

from config.settings import DB_PATH
from app.services.pagina1_service import get_pagina1_data
from app.services.pagina2_service import get_pagina2_data
from app.services.pagina3_service import get_pagina3_data
from app.services.pagina4_service import get_pagina4_data
from app.services.pagina5_service import get_pagina5_data
from app.services.pagina6_service import get_pagina6_data
from app.services.pagina7_service import get_pagina7_data


SERVICES = {
    1: ('Apresentação', get_pagina1_data),
    2: ('Mecânicas', get_pagina2_data),
    3: ('Antecedentes', get_pagina3_data),
    4: ('Equipamentos', get_pagina4_data),
    5: ('Guia do Mestre', get_pagina5_data),
    6: ('Ameaças', get_pagina6_data),
    7: ('Complementos', get_pagina7_data),
}


def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS paginas (
            numero INTEGER PRIMARY KEY,
            nome TEXT NOT NULL,
            dados JSON NOT NULL,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    return conn


def import_page(conn, numero):
    nome, service_fn = SERVICES[numero]
    print(f'  Importando página {numero} ({nome})...', end=' ')
    try:
        data = service_fn()
        json_data = json.dumps(data, ensure_ascii=False)
        conn.execute(
            'INSERT OR REPLACE INTO paginas (numero, nome, dados, atualizado_em) '
            'VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
            (numero, nome, json_data)
        )
        conn.commit()
        size_kb = len(json_data) / 1024
        print(f'OK ({size_kb:.1f} KB)')
    except Exception as e:
        print(f'ERRO: {e}')


def main():
    pages = None
    if len(sys.argv) > 1:
        pages = [int(x) for x in sys.argv[1:]]

    print(f'Banco de dados: {DB_PATH}')
    print()

    conn = init_db()

    for num in (pages or sorted(SERVICES.keys())):
        if num not in SERVICES:
            print(f'  Página {num} não existe (1-7)')
            continue
        import_page(conn, num)

    conn.close()
    print()
    print('Importação concluída!')
    print(f'Arquivo: {DB_PATH}')
    db_size = os.path.getsize(DB_PATH) / 1024
    print(f'Tamanho: {db_size:.1f} KB')


if __name__ == '__main__':
    main()
