import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from config.settings import DEBUG, HOST, PORT

app = create_app()

if __name__ == '__main__':
    # Render injeta a variavel PORT; em dev local usa a porta fixa de settings.py.
    port = int(os.environ.get('PORT', PORT))
    app.run(debug=DEBUG, host=HOST, port=port)
