import os

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATABASE_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'Database'))
IMG_DIR = os.path.join(DATABASE_DIR, 'img')

DB_PATH = os.path.join(BASE_DIR, 'zona_z.db')

DEBUG = True
HOST = '0.0.0.0'
PORT = 5000
