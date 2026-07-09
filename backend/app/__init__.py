import os
from flask import Flask, send_from_directory
from flask_cors import CORS

FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'dist'))


def create_app():
    app = Flask(__name__)
    CORS(app)

    from app.api.routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    from app.api.character_builder import builder_bp
    app.register_blueprint(builder_bp)

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
