import re

from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required, login_user, logout_user

from app.services import auth_service
from app.services.email_service import enviar_email_redefinicao

auth_bp = Blueprint('auth', __name__)

EMAIL_REGEX = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')


@auth_bp.route('/registrar', methods=['POST'])
def registrar():
    body = request.get_json(silent=True) or {}
    email = (body.get('email') or '').strip().lower()
    senha = body.get('senha') or ''

    if not EMAIL_REGEX.match(email):
        return jsonify({'erro': 'E-mail inválido'}), 400
    if len(senha) < 6:
        return jsonify({'erro': 'A senha deve ter pelo menos 6 caracteres'}), 400

    try:
        usuario = auth_service.criar_usuario(email=email, senha=senha, papel='jogador')
    except auth_service.EmailJaCadastradoError:
        return jsonify({'erro': 'E-mail já cadastrado'}), 409

    login_user(usuario)
    return jsonify({'usuario': usuario.to_dict()}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    body = request.get_json(silent=True) or {}
    identificador = (body.get('identificador') or '').strip().lower()
    senha = body.get('senha') or ''

    usuario = auth_service.autenticar(identificador, senha)
    if not usuario:
        return jsonify({'erro': 'E-mail/usuário ou senha inválidos'}), 401

    login_user(usuario)
    return jsonify({'usuario': usuario.to_dict()})


@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'ok': True})


@auth_bp.route('/me', methods=['GET'])
def me():
    if not current_user.is_authenticated:
        return jsonify({'usuario': None})
    return jsonify({'usuario': current_user.to_dict()})


@auth_bp.route('/esqueci-senha', methods=['POST'])
def esqueci_senha():
    body = request.get_json(silent=True) or {}
    email = (body.get('email') or '').strip().lower()

    usuario = auth_service.buscar_usuario_por_login(email) if email else None
    if usuario and usuario.email:
        token = auth_service.criar_token_redefinicao(usuario.id)
        enviar_email_redefinicao(usuario.email, token)

    # Resposta sempre igual, exista ou nao o e-mail, pra nao permitir
    # descobrir quais e-mails estao cadastrados.
    return jsonify({'mensagem': 'Se o e-mail existir, enviaremos um link de redefinição.'})


@auth_bp.route('/resetar-senha', methods=['POST'])
def resetar_senha():
    body = request.get_json(silent=True) or {}
    token = body.get('token') or ''
    nova_senha = body.get('nova_senha') or ''

    if len(nova_senha) < 6:
        return jsonify({'erro': 'A senha deve ter pelo menos 6 caracteres'}), 400

    usuario_id = auth_service.validar_e_consumir_token(token)
    if not usuario_id:
        return jsonify({'erro': 'Link de redefinição inválido ou expirado'}), 400

    auth_service.redefinir_senha(usuario_id, nova_senha)
    return jsonify({'ok': True})
