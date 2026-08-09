import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_login import LoginManager

from config.settings import SECRET_KEY, FRONTEND_BASE_URL

FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'dist'))


def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = SECRET_KEY

    # supports_credentials=True e' obrigatorio para o cookie de sessao do
    # Flask-Login viajar em requests com credentials:'include' do frontend;
    # origem explicita (nao coringa) e' exigencia do navegador quando
    # credentials estao envolvidas.
    CORS(app, supports_credentials=True, origins=[
        FRONTEND_BASE_URL, 'http://localhost:3000', 'http://127.0.0.1:3000',
    ])

    login_manager = LoginManager()
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        from app.services.auth_service import buscar_usuario_por_id
        return buscar_usuario_por_id(user_id)

    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify({'erro': 'Não autenticado'}), 401

    try:
        from app.services.turso_service import init_schema
        from app.services.auth_service import (
            garantir_usuario_mestre_teste, garantir_usuario_administrador_teste,
        )
        init_schema()
        garantir_usuario_mestre_teste()
        garantir_usuario_administrador_teste()
    except Exception as e:
        # Nao derruba o app inteiro por causa disso: paginas do rulebook
        # (conteudo docx/zona_z.db) continuam funcionando mesmo sem o banco
        # de usuarios/mesas configurado ainda.
        print(f'[app] Aviso: banco de usuarios/mesas indisponivel ({e})')

    from app.api.routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    from app.api.character_builder import builder_bp
    app.register_blueprint(builder_bp)

    from app.api.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    from app.api.mesas_routes import mesas_bp
    app.register_blueprint(mesas_bp, url_prefix='/api/mesas')

    from app.api.fichas_routes import fichas_bp
    app.register_blueprint(fichas_bp, url_prefix='/api/fichas')

    from app.api.admin_routes import admin_bp
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    # Em producao (Render), o frontend ja vem buildado (frontend/dist) e o
    # proprio Flask serve os arquivos estaticos + index.html (SPA). Em dev,
    # ninguem bate aqui porque o Vite dev server atende direto.
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        full_path = os.path.join(FRONTEND_DIST, path)
        if path and os.path.isfile(full_path):
            return send_from_directory(FRONTEND_DIST, path)
        return send_from_directory(FRONTEND_DIST, 'index.html')

    return app
