import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from config.settings import DEBUG, HOST, PORT

app = create_app()

if __name__ == '__main__':
    # Render injeta a variavel PORT; em dev local usa a porta fixa de settings.py.
    port = int(os.environ.get('PORT', PORT))
    # use_reloader=False: o reloader do Werkzeug trava (WinError 10038) neste
    # ambiente Windows ao detectar mudanca de arquivo durante o dev.
    # threaded=True: o servidor de dev e' de 1 conexao por vez por padrao;
    # com varias abas/fetches do frontend mantendo conexao aberta (keep-alive),
    # ele trava esperando a conexao antiga em vez de aceitar a nova.
    app.run(debug=DEBUG, host=HOST, port=port, use_reloader=False, threaded=True)
