from flask import Flask
from flask_cors import CORS


def create_app():
    app = Flask(__name__)
    CORS(app)

    from app.api.routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    from app.api.character_builder import builder_bp
    app.register_blueprint(builder_bp)

    return app
