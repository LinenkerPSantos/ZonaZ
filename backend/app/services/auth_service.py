import os
import secrets
from datetime import datetime, timedelta

from werkzeug.security import generate_password_hash, check_password_hash

from app.models.usuario import Usuario
from app.services.turso_service import execute, row_to_dict, rows_to_dicts

# Valor padrao serve so pra dev local. Em producao (repo publico), defina
# SEED_ADMIN_USUARIO/SEED_ADMIN_SENHA no ambiente do Render com credenciais
# proprias - senao essa conta (com poderes de administrador) fica com senha
# publica no GitHub. Contas de mestre nao sao mais semeadas automaticamente:
# o administrador cria mestres pelo painel /admin conforme a necessidade.
ADMIN_TESTE_USUARIO = os.environ.get('SEED_ADMIN_USUARIO', 'administrador')
ADMIN_TESTE_SENHA = os.environ.get('SEED_ADMIN_SENHA', 'adm@321')

PAPEIS_VALIDOS = ('jogador', 'mestre', 'administrador')

USUARIO_COLUNAS = ['id', 'nome_usuario', 'email', 'senha_hash', 'papel', 'nome_exibicao']


class EmailJaCadastradoError(Exception):
    pass


def _usuario_de_linha(rs, i=0):
    if not rs.rows:
        return None
    return Usuario(row_to_dict(rs.rows[i], rs.columns))


def buscar_usuario_por_id(usuario_id):
    rs = execute(
        f"SELECT {', '.join(USUARIO_COLUNAS)} FROM usuarios WHERE id = ?", [int(usuario_id)]
    )
    return _usuario_de_linha(rs)


def buscar_usuario_por_login(identificador):
    rs = execute(
        f"SELECT {', '.join(USUARIO_COLUNAS)} FROM usuarios WHERE email = ? OR nome_usuario = ?",
        [identificador, identificador],
    )
    return _usuario_de_linha(rs)


def criar_usuario(email, senha, papel='jogador', nome_usuario=None, nome_exibicao=None):
    nome_usuario = nome_usuario or email
    if not nome_usuario:
        raise ValueError('E-mail ou nome de usuário são obrigatórios')
    nome_exibicao = nome_exibicao or (email.split('@')[0] if email else nome_usuario)
    senha_hash = generate_password_hash(senha)

    existente = execute(
        'SELECT id FROM usuarios WHERE nome_usuario = ? OR (email IS NOT NULL AND email = ?)',
        [nome_usuario, email],
    )
    if existente.rows:
        raise EmailJaCadastradoError('E-mail já cadastrado')

    rs = execute(
        'INSERT INTO usuarios (nome_usuario, email, senha_hash, papel, nome_exibicao) '
        'VALUES (?, ?, ?, ?, ?)',
        [nome_usuario, email, senha_hash, papel, nome_exibicao],
    )
    return buscar_usuario_por_id(rs.last_insert_rowid)


def autenticar(identificador, senha):
    usuario = buscar_usuario_por_login(identificador)
    if not usuario or not check_password_hash(usuario.senha_hash, senha):
        return None
    return usuario


def garantir_usuario_administrador_teste():
    if buscar_usuario_por_login(ADMIN_TESTE_USUARIO):
        return
    criar_usuario(
        email=None,
        senha=ADMIN_TESTE_SENHA,
        papel='administrador',
        nome_usuario=ADMIN_TESTE_USUARIO,
        nome_exibicao='Administrador',
    )


def listar_usuarios():
    rs = execute(
        'SELECT id, nome_usuario, email, papel, nome_exibicao, criado_em FROM usuarios '
        'ORDER BY criado_em DESC'
    )
    return rows_to_dicts(rs)


def excluir_usuario(usuario_id):
    # Sem PRAGMA foreign_keys=ON garantido na conexao libsql, entao a limpeza
    # das tabelas dependentes e feita manualmente aqui (mesmo padrao de
    # mesas_service.excluir_mesa).
    execute('DELETE FROM mesa_jogadores WHERE jogador_id = ?', [usuario_id])
    execute('DELETE FROM mesa_mensagens WHERE usuario_id = ?', [usuario_id])
    execute('DELETE FROM fichas WHERE usuario_id = ?', [usuario_id])
    execute('DELETE FROM tokens_redefinicao_senha WHERE usuario_id = ?', [usuario_id])
    mesas_do_usuario = execute('SELECT id FROM mesas WHERE mestre_id = ?', [usuario_id])
    for linha in rows_to_dicts(mesas_do_usuario):
        execute('DELETE FROM mesa_jogadores WHERE mesa_id = ?', [linha['id']])
    execute('DELETE FROM mesas WHERE mestre_id = ?', [usuario_id])
    execute('DELETE FROM usuarios WHERE id = ?', [usuario_id])


def criar_token_redefinicao(usuario_id):
    token = secrets.token_urlsafe(32)
    expira_em = (datetime.utcnow() + timedelta(hours=1)).isoformat()
    execute(
        'INSERT INTO tokens_redefinicao_senha (token, usuario_id, expira_em) VALUES (?, ?, ?)',
        [token, usuario_id, expira_em],
    )
    return token


def validar_e_consumir_token(token):
    rs = execute(
        'SELECT usuario_id, expira_em, usado FROM tokens_redefinicao_senha WHERE token = ?',
        [token],
    )
    if not rs.rows:
        return None
    linha = row_to_dict(rs.rows[0], rs.columns)
    if linha['usado']:
        return None
    if datetime.fromisoformat(linha['expira_em']) < datetime.utcnow():
        return None
    execute('UPDATE tokens_redefinicao_senha SET usado = 1 WHERE token = ?', [token])
    return linha['usuario_id']


def redefinir_senha(usuario_id, nova_senha):
    execute(
        'UPDATE usuarios SET senha_hash = ? WHERE id = ?',
        [generate_password_hash(nova_senha), usuario_id],
    )
