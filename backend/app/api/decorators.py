from functools import wraps
from flask import jsonify
from flask_login import current_user, login_required


def requer_papel(papel):
    def decorador(f):
        @wraps(f)
        @login_required
        def wrapper(*args, **kwargs):
            if current_user.papel != papel:
                return jsonify({'erro': f'Acesso restrito a contas de {papel}'}), 403
            return f(*args, **kwargs)
        return wrapper
    return decorador
