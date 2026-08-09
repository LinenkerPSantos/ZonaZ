import re

from flask import Blueprint, jsonify, request
from flask_login import current_user

from app.api.decorators import requer_papel
from app.services import auth_service

admin_bp = Blueprint('admin', __name__)

EMAIL_REGEX = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')


@admin_bp.route('/usuarios', methods=['GET'])
@requer_papel('administrador')
def listar():
    return jsonify(auth_service.listar_usuarios())


@admin_bp.route('/usuarios', methods=['POST'])
@requer_papel('administrador')
def criar():
    body = request.get_json(silent=True) or {}
    nome_usuario = (body.get('nome_usuario') or '').strip()
    email = (body.get('email') or '').strip().lower() or None
    senha = body.get('senha') or ''
    papel = body.get('papel') or 'jogador'
    nome_exibicao = (body.get('nome_exibicao') or '').strip() or None

    if not nome_usuario:
        return jsonify({'erro': 'Nome de usuário é obrigatório'}), 400
    if email and not EMAIL_REGEX.match(email):
        return jsonify({'erro': 'E-mail inválido'}), 400
    if len(senha) < 6:
        return jsonify({'erro': 'A senha deve ter pelo menos 6 caracteres'}), 400
    if papel not in auth_service.PAPEIS_VALIDOS:
        return jsonify({'erro': 'Papel inválido'}), 400

    try:
        usuario = auth_service.criar_usuario(
            email=email, senha=senha, papel=papel,
            nome_usuario=nome_usuario, nome_exibicao=nome_exibicao,
        )
    except auth_service.EmailJaCadastradoError:
        return jsonify({'erro': 'Nome de usuário ou e-mail já cadastrado'}), 409

    return jsonify(usuario.to_dict()), 201


@admin_bp.route('/usuarios/<int:usuario_id>', methods=['DELETE'])
@requer_papel('administrador')
def excluir(usuario_id):
    if usuario_id == current_user.id:
        return jsonify({'erro': 'Você não pode excluir sua própria conta'}), 400
    auth_service.excluir_usuario(usuario_id)
    return jsonify({'ok': True})
