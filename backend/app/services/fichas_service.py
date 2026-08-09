import json

from app.services.turso_service import execute, row_to_dict, rows_to_dicts

FICHA_COLUNAS = ['id', 'usuario_id', 'nome_personagem', 'payload', 'criado_em', 'atualizado_em']


class FichaError(Exception):
    pass


def _linha_para_ficha(linha):
    return {
        'id': linha['id'],
        'usuario_id': linha['usuario_id'],
        'nome_personagem': linha['nome_personagem'],
        'criado_em': linha['criado_em'],
        'atualizado_em': linha['atualizado_em'],
        **json.loads(linha['payload']),
    }


def criar_ficha(usuario_id, payload):
    nome_personagem = (payload.get('ficha') or {}).get('nome') or ''
    rs = execute(
        'INSERT INTO fichas (usuario_id, nome_personagem, payload) VALUES (?, ?, ?)',
        [usuario_id, nome_personagem, json.dumps(payload)],
    )
    return buscar_ficha(rs.last_insert_rowid)


def buscar_ficha(ficha_id):
    rs = execute(f"SELECT {', '.join(FICHA_COLUNAS)} FROM fichas WHERE id = ?", [int(ficha_id)])
    if not rs.rows:
        return None
    return _linha_para_ficha(row_to_dict(rs.rows[0], rs.columns))


def listar_fichas_usuario(usuario_id):
    rs = execute(
        f"SELECT {', '.join(FICHA_COLUNAS)} FROM fichas WHERE usuario_id = ? ORDER BY atualizado_em DESC",
        [usuario_id],
    )
    return [_linha_para_ficha(linha) for linha in rows_to_dicts(rs)]


def excluir_ficha(ficha_id, usuario_id):
    ficha = buscar_ficha(ficha_id)
    if not ficha:
        raise FichaError('Ficha não encontrada')
    if ficha['usuario_id'] != usuario_id:
        raise FichaError('Você não é o dono desta ficha')
    execute('UPDATE mesa_jogadores SET ficha_id = NULL WHERE ficha_id = ?', [ficha_id])
    execute('DELETE FROM fichas WHERE id = ?', [ficha_id])
