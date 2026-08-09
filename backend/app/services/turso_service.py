import libsql_client
from config.settings import TURSO_DATABASE_URL, TURSO_AUTH_TOKEN

_client = None

SCHEMA = [
    """
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_usuario TEXT NOT NULL UNIQUE,
      email TEXT UNIQUE,
      senha_hash TEXT NOT NULL,
      papel TEXT NOT NULL CHECK (papel IN ('jogador', 'mestre', 'administrador')) DEFAULT 'jogador',
      nome_exibicao TEXT,
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS fichas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      nome_personagem TEXT,
      payload TEXT NOT NULL,
      criado_em TEXT NOT NULL DEFAULT (datetime('now')),
      atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS mesas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      data TEXT,
      local TEXT,
      status TEXT NOT NULL CHECK (status IN ('em_criacao', 'em_andamento')) DEFAULT 'em_criacao',
      mestre_id INTEGER NOT NULL REFERENCES usuarios(id),
      max_jogadores INTEGER,
      senha_hash TEXT,
      criado_em TEXT NOT NULL DEFAULT (datetime('now')),
      atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS mesa_mensagens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mesa_id INTEGER NOT NULL REFERENCES mesas(id) ON DELETE CASCADE,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      texto TEXT NOT NULL,
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS mesa_jogadores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mesa_id INTEGER NOT NULL REFERENCES mesas(id) ON DELETE CASCADE,
      jogador_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      ficha_id INTEGER REFERENCES fichas(id),
      inscrito_em TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (mesa_id, jogador_id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS tokens_redefinicao_senha (
      token TEXT PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      expira_em TEXT NOT NULL,
      usado INTEGER NOT NULL DEFAULT 0,
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    )
    """,
]


def get_client():
    global _client
    if _client is None:
        _client = libsql_client.create_client_sync(
            TURSO_DATABASE_URL, auth_token=TURSO_AUTH_TOKEN
        )
    return _client


# Colunas adicionadas depois que tabelas antigas ja existiam: "CREATE TABLE IF
# NOT EXISTS" nao altera uma tabela ja criada, entao a coluna nova precisa
# desse ALTER TABLE avulso. Erro (coluna ja existe) e' esperado e ignorado.
MIGRACOES = [
    "ALTER TABLE mesas ADD COLUMN senha_hash TEXT",
]


def init_schema():
    client = get_client()
    for stmt in SCHEMA:
        client.execute(stmt)
    for stmt in MIGRACOES:
        try:
            client.execute(stmt)
        except Exception:
            pass


def execute(stmt, args=None):
    return get_client().execute(stmt, args or [])


def row_to_dict(row, columns):
    return {col: row[col] for col in columns}


def rows_to_dicts(result_set):
    return [row_to_dict(row, result_set.columns) for row in result_set.rows]
