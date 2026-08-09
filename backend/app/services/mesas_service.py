from werkzeug.security import generate_password_hash, check_password_hash

from app.services.turso_service import execute, row_to_dict, rows_to_dicts

MESA_COLUNAS = ['id', 'nome', 'data', 'local', 'status', 'mestre_id', 'max_jogadores',
                 'senha_hash', 'criado_em', 'atualizado_em']


class MesaError(Exception):
    pass


def _mesa_de_linha(linha):
    return {
        'id': linha['id'],
        'nome': linha['nome'],
        'data': linha['data'],
        'local': linha['local'],
        'status': linha['status'],
        'mestre_id': linha['mestre_id'],
        'max_jogadores': linha['max_jogadores'],
        'tem_senha': bool(linha['senha_hash']),
        'criado_em': linha['criado_em'],
        'atualizado_em': linha['atualizado_em'],
    }


def _linha_bruta_mesa(mesa_id):
    rs = execute(f"SELECT {', '.join(MESA_COLUNAS)} FROM mesas WHERE id = ?", [int(mesa_id)])
    if not rs.rows:
        return None
    return row_to_dict(rs.rows[0], rs.columns)


def criar_mesa(mestre_id, nome, data, local, max_jogadores, senha=None):
    senha_hash = generate_password_hash(senha) if senha else None
    rs = execute(
        'INSERT INTO mesas (nome, data, local, mestre_id, max_jogadores, senha_hash) '
        'VALUES (?, ?, ?, ?, ?, ?)',
        [nome, data, local, mestre_id, max_jogadores, senha_hash],
    )
    return buscar_mesa(rs.last_insert_rowid)


def buscar_mesa(mesa_id):
    linha = _linha_bruta_mesa(mesa_id)
    return _mesa_de_linha(linha) if linha else None


def _contagem_jogadores(mesa_ids):
    if not mesa_ids:
        return {}
    marcadores = ', '.join('?' for _ in mesa_ids)
    rs = execute(
        f'SELECT mesa_id, COUNT(*) as total FROM mesa_jogadores '
        f'WHERE mesa_id IN ({marcadores}) GROUP BY mesa_id',
        list(mesa_ids),
    )
    return {linha['mesa_id']: linha['total'] for linha in rows_to_dicts(rs)}


def listar_mesas(usuario_id=None):
    rs = execute(f"SELECT {', '.join(MESA_COLUNAS)} FROM mesas ORDER BY criado_em DESC")
    mesas = [_mesa_de_linha(linha) for linha in rows_to_dicts(rs)]

    contagens = _contagem_jogadores([m['id'] for m in mesas])

    inscricoes = {}
    if usuario_id:
        rs_insc = execute(
            'SELECT mesa_id, ficha_id FROM mesa_jogadores WHERE jogador_id = ?', [usuario_id]
        )
        inscricoes = {linha['mesa_id']: linha['ficha_id'] for linha in rows_to_dicts(rs_insc)}

    for m in mesas:
        m['total_jogadores'] = contagens.get(m['id'], 0)
        m['inscrito'] = m['id'] in inscricoes
        m['minha_ficha_id'] = inscricoes.get(m['id'])
    return mesas


def listar_minhas_mesas(mestre_id):
    rs = execute(
        f"SELECT {', '.join(MESA_COLUNAS)} FROM mesas WHERE mestre_id = ? ORDER BY criado_em DESC",
        [mestre_id],
    )
    mesas = [_mesa_de_linha(linha) for linha in rows_to_dicts(rs)]
    contagens = _contagem_jogadores([m['id'] for m in mesas])
    for m in mesas:
        m['total_jogadores'] = contagens.get(m['id'], 0)
    return mesas


def atualizar_mesa(mesa_id, mestre_id, campos):
    mesa = buscar_mesa(mesa_id)
    if not mesa:
        raise MesaError('Mesa não encontrada')
    if mesa['mestre_id'] != mestre_id:
        raise MesaError('Você não é o mestre desta mesa')

    permitidos = {'data', 'local', 'status'}
    atualizacoes = {k: v for k, v in campos.items() if k in permitidos}
    if 'status' in atualizacoes and atualizacoes['status'] not in ('em_criacao', 'em_andamento'):
        raise MesaError('Status inválido')
    if 'senha' in campos:
        nova_senha = (campos['senha'] or '').strip()
        atualizacoes['senha_hash'] = generate_password_hash(nova_senha) if nova_senha else None

    if not atualizacoes:
        return mesa

    set_clause = ', '.join(f'{campo} = ?' for campo in atualizacoes)
    execute(
        f"UPDATE mesas SET {set_clause}, atualizado_em = datetime('now') WHERE id = ?",
        [*atualizacoes.values(), mesa_id],
    )
    return buscar_mesa(mesa_id)


def listar_jogadores_mesa(mesa_id):
    rs = execute(
        'SELECT mj.jogador_id, u.nome_exibicao, u.email, mj.ficha_id, mj.inscrito_em '
        'FROM mesa_jogadores mj JOIN usuarios u ON u.id = mj.jogador_id '
        'WHERE mj.mesa_id = ? ORDER BY mj.inscrito_em',
        [mesa_id],
    )
    return rows_to_dicts(rs)


def usuario_pertence_mesa(mesa_id, usuario_id):
    linha = _linha_bruta_mesa(mesa_id)
    if not linha:
        return False
    if linha['mestre_id'] == usuario_id:
        return True
    rs = execute(
        'SELECT id FROM mesa_jogadores WHERE mesa_id = ? AND jogador_id = ?',
        [mesa_id, usuario_id],
    )
    return bool(rs.rows)


def listar_mensagens(mesa_id):
    rs = execute(
        'SELECT mm.id, mm.usuario_id, u.nome_exibicao, mm.texto, mm.criado_em '
        'FROM mesa_mensagens mm JOIN usuarios u ON u.id = mm.usuario_id '
        'WHERE mm.mesa_id = ? ORDER BY mm.criado_em ASC',
        [mesa_id],
    )
    return rows_to_dicts(rs)


def criar_mensagem(mesa_id, usuario_id, texto):
    execute(
        'INSERT INTO mesa_mensagens (mesa_id, usuario_id, texto) VALUES (?, ?, ?)',
        [mesa_id, usuario_id, texto],
    )
    return listar_mensagens(mesa_id)[-1]


def inscrever(mesa_id, jogador_id, ficha_id=None, senha=None):
    linha = _linha_bruta_mesa(mesa_id)
    if not linha:
        raise MesaError('Mesa não encontrada')
    if linha['status'] != 'em_criacao':
        raise MesaError('Esta mesa não está mais aceitando inscrições')
    if linha['senha_hash'] and not check_password_hash(linha['senha_hash'], senha or ''):
        raise MesaError('Senha de acesso incorreta')

    rs = execute(
        'SELECT id FROM mesa_jogadores WHERE mesa_id = ? AND jogador_id = ?',
        [mesa_id, jogador_id],
    )
    if rs.rows:
        raise MesaError('Você já está inscrito nesta mesa')

    if linha['max_jogadores']:
        atual = _contagem_jogadores([mesa_id]).get(mesa_id, 0)
        if atual >= linha['max_jogadores']:
            raise MesaError('Esta mesa já atingiu o número máximo de jogadores')

    execute(
        'INSERT INTO mesa_jogadores (mesa_id, jogador_id, ficha_id) VALUES (?, ?, ?)',
        [mesa_id, jogador_id, ficha_id],
    )


def excluir_mesa(mesa_id, mestre_id):
    mesa = buscar_mesa(mesa_id)
    if not mesa:
        raise MesaError('Mesa não encontrada')
    if mesa['mestre_id'] != mestre_id:
        raise MesaError('Você não é o mestre desta mesa')
    # Apagado manualmente (em vez de depender de ON DELETE CASCADE) porque o
    # cliente libsql nao garante PRAGMA foreign_keys=ON na conexao.
    execute('DELETE FROM mesa_jogadores WHERE mesa_id = ?', [mesa_id])
    execute('DELETE FROM mesa_mensagens WHERE mesa_id = ?', [mesa_id])
    execute('DELETE FROM mesas WHERE id = ?', [mesa_id])


def remover_jogador(mesa_id, jogador_id, mestre_id):
    mesa = buscar_mesa(mesa_id)
    if not mesa:
        raise MesaError('Mesa não encontrada')
    if mesa['mestre_id'] != mestre_id:
        raise MesaError('Você não é o mestre desta mesa')
    execute(
        'DELETE FROM mesa_jogadores WHERE mesa_id = ? AND jogador_id = ?',
        [mesa_id, jogador_id],
    )


def sair_mesa(mesa_id, jogador_id):
    execute(
        'DELETE FROM mesa_jogadores WHERE mesa_id = ? AND jogador_id = ?',
        [mesa_id, jogador_id],
    )


def atualizar_ficha_inscricao(mesa_id, jogador_id, ficha_id):
    rs = execute(
        'SELECT id FROM mesa_jogadores WHERE mesa_id = ? AND jogador_id = ?',
        [mesa_id, jogador_id],
    )
    if not rs.rows:
        raise MesaError('Você não está inscrito nesta mesa')
    execute(
        'UPDATE mesa_jogadores SET ficha_id = ? WHERE mesa_id = ? AND jogador_id = ?',
        [ficha_id, mesa_id, jogador_id],
    )
