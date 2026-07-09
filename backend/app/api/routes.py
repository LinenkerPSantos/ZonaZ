from flask import Blueprint, jsonify, send_from_directory
from app.services.db_service import get_pagina_from_db
from app.services.pagina1_service import get_pagina1_data
from app.services.pagina2_service import get_pagina2_data
from app.services.pagina3_service import get_pagina3_data
from app.services.pagina4_service import get_pagina4_data
from app.services.pagina5_service import get_pagina5_data
from app.services.pagina6_service import get_pagina6_data
from app.services.pagina7_service import get_pagina7_data
from config.settings import IMG_DIR

api_bp = Blueprint('api', __name__)

DOCX_SERVICES = {
    1: get_pagina1_data,
    2: get_pagina2_data,
    3: get_pagina3_data,
    4: get_pagina4_data,
    5: get_pagina5_data,
    6: get_pagina6_data,
    7: get_pagina7_data,
}


def _get_pagina(numero):
    data = get_pagina_from_db(numero)
    if data:
        return data
    return DOCX_SERVICES[numero]()


@api_bp.route('/pagina/<int:numero>', methods=['GET'])
def pagina(numero):
    if numero < 1 or numero > 7:
        return jsonify({'erro': 'Página não encontrada'}), 404
    data = _get_pagina(numero)
    return jsonify(data)


@api_bp.route('/img/<path:filename>', methods=['GET'])
def serve_image(filename):
    return send_from_directory(IMG_DIR, filename)
