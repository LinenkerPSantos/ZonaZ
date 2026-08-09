from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from app.api.decorators import requer_papel
from app.services import mesas_service

mesas_bp = Blueprint('mesas', __name__)


@mesas_bp.route('', methods=['GET'])
def listar():
    usuario_id = current_user.id if current_user.is_authenticated else None
    return jsonify(mesas_service.listar_mesas(usuario_id))


@mesas_bp.route('', methods=['POST'])
@requer_papel('mestre')
def criar():
    body = request.get_json(silent=True) or {}
    nome = (body.get('nome') or '').strip()
    if not nome:
        return jsonify({'erro': 'Nome da mesa é obrigatório'}), 400

    max_jogadores = body.get('jogadores')
    try:
        max_jogadores = int(max_jogadores) if max_jogadores not in (None, '') else None
    except (TypeError, ValueError):
        return jsonify({'erro': 'Número de jogadores inválido'}), 400

    mesa = mesas_service.criar_mesa(
        current_user.id, nome, body.get('data'), body.get('local'), max_jogadores,
        senha=(body.get('senha') or '').strip() or None,
    )
    return jsonify(mesa), 201


@mesas_bp.route('/minhas', methods=['GET'])
@requer_papel('mestre')
def minhas():
    return jsonify(mesas_service.listar_minhas_mesas(current_user.id))


@mesas_bp.route('/<int:mesa_id>', methods=['PATCH'])
@requer_papel('mestre')
def atualizar(mesa_id):
    body = request.get_json(silent=True) or {}
    try:
        mesa = mesas_service.atualizar_mesa(mesa_id, current_user.id, body)
    except mesas_service.MesaError as e:
        return jsonify({'erro': str(e)}), 400
    return jsonify(mesa)


@mesas_bp.route('/<int:mesa_id>', methods=['DELETE'])
@requer_papel('mestre')
def excluir(mesa_id):
    try:
        mesas_service.excluir_mesa(mesa_id, current_user.id)
    except mesas_service.MesaError as e:
        return jsonify({'erro': str(e)}), 403
    return jsonify({'ok': True})


@mesas_bp.route('/<int:mesa_id>/jogadores', methods=['GET'])
@requer_papel('mestre')
def jogadores(mesa_id):
    mesa = mesas_service.buscar_mesa(mesa_id)
    if not mesa:
        return jsonify({'erro': 'Mesa não encontrada'}), 404
    if mesa['mestre_id'] != current_user.id:
        return jsonify({'erro': 'Você não é o mestre desta mesa'}), 403
    return jsonify(mesas_service.listar_jogadores_mesa(mesa_id))


@mesas_bp.route('/<int:mesa_id>/inscrever', methods=['POST'])
@login_required
def inscrever(mesa_id):
    body = request.get_json(silent=True) or {}
    try:
        mesas_service.inscrever(mesa_id, current_user.id, body.get('ficha_id'), body.get('senha'))
    except mesas_service.MesaError as e:
        return jsonify({'erro': str(e)}), 409
    return jsonify({'ok': True}), 201


@mesas_bp.route('/<int:mesa_id>/inscrever', methods=['DELETE'])
@login_required
def sair(mesa_id):
    mesas_service.sair_mesa(mesa_id, current_user.id)
    return jsonify({'ok': True})


@mesas_bp.route('/<int:mesa_id>/inscrever', methods=['PATCH'])
@login_required
def atualizar_inscricao(mesa_id):
    body = request.get_json(silent=True) or {}
    try:
        mesas_service.atualizar_ficha_inscricao(mesa_id, current_user.id, body.get('ficha_id'))
    except mesas_service.MesaError as e:
        return jsonify({'erro': str(e)}), 404
    return jsonify({'ok': True})


@mesas_bp.route('/<int:mesa_id>/mensagens', methods=['GET'])
@login_required
def mensagens(mesa_id):
    if not mesas_service.usuario_pertence_mesa(mesa_id, current_user.id):
        return jsonify({'erro': 'Você não participa desta mesa'}), 403
    return jsonify(mesas_service.listar_mensagens(mesa_id))


@mesas_bp.route('/<int:mesa_id>/mensagens', methods=['POST'])
@login_required
def enviar_mensagem(mesa_id):
    if not mesas_service.usuario_pertence_mesa(mesa_id, current_user.id):
        return jsonify({'erro': 'Você não participa desta mesa'}), 403
    body = request.get_json(silent=True) or {}
    texto = (body.get('texto') or '').strip()
    if not texto:
        return jsonify({'erro': 'Mensagem vazia'}), 400
    return jsonify(mesas_service.criar_mensagem(mesa_id, current_user.id, texto)), 201


@mesas_bp.route('/<int:mesa_id>/jogadores/<int:jogador_id>', methods=['DELETE'])
@requer_papel('mestre')
def remover_jogador(mesa_id, jogador_id):
    try:
        mesas_service.remover_jogador(mesa_id, jogador_id, current_user.id)
    except mesas_service.MesaError as e:
        return jsonify({'erro': str(e)}), 403
    return jsonify({'ok': True})
