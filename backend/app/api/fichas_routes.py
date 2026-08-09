from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from app.services import fichas_service

fichas_bp = Blueprint('fichas', __name__)


@fichas_bp.route('', methods=['POST'])
@login_required
def criar():
    body = request.get_json(silent=True) or {}
    if not body.get('ficha'):
        return jsonify({'erro': 'Ficha inválida'}), 400
    ficha = fichas_service.criar_ficha(current_user.id, body)
    return jsonify(ficha), 201


@fichas_bp.route('/minhas', methods=['GET'])
@login_required
def minhas():
    return jsonify(fichas_service.listar_fichas_usuario(current_user.id))


@fichas_bp.route('/<int:ficha_id>', methods=['GET'])
def obter(ficha_id):
    ficha = fichas_service.buscar_ficha(ficha_id)
    if not ficha:
        return jsonify({'erro': 'Ficha não encontrada'}), 404
    return jsonify(ficha)


@fichas_bp.route('/<int:ficha_id>', methods=['DELETE'])
@login_required
def excluir(ficha_id):
    try:
        fichas_service.excluir_ficha(ficha_id, current_user.id)
    except fichas_service.FichaError as e:
        return jsonify({'erro': str(e)}), 403
    return jsonify({'ok': True})
