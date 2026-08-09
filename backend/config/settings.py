import os
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATABASE_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'Database'))
IMG_DIR = os.path.join(DATABASE_DIR, 'img')

DB_PATH = os.path.join(BASE_DIR, 'zona_z.db')

DEBUG = True
HOST = '0.0.0.0'
PORT = 5000

load_dotenv(os.path.join(BASE_DIR, '.env'))

# Assinatura da sessao (cookie do Flask-Login). Em producao, SEMPRE definir via
# variavel de ambiente - o valor padrao aqui so serve pra nao quebrar o dev local.
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-only-change-me')

# Banco de usuarios/mesas/fichas (Turso/libSQL), separado do zona_z.db (que e so
# cache de conteudo do rulebook, reconstruido do zero a cada deploy). Sem
# TURSO_DATABASE_URL configurada, cai num arquivo local (modo sqlite via libsql)
# pra dar pra testar sem precisar de conta no Turso ainda.
TURSO_DATABASE_URL = os.environ.get('TURSO_DATABASE_URL') or f'file:{os.path.join(BASE_DIR, "app_data.db")}'
TURSO_AUTH_TOKEN = os.environ.get('TURSO_AUTH_TOKEN')

# E-mail de redefinicao de senha via API HTTPS da Resend (resend.com) - SMTP
# tradicional (portas 25/465/587) e' bloqueado na saida por varios hosts free
# tier, incluindo o Render, entao o envio e' feito por HTTPS em vez de SMTP.
# Sem RESEND_API_KEY configurada, o link de redefinicao e' apenas logado no
# console (ver email_service.py) - permite testar o fluxo completo localmente
# sem credencial de e-mail real.
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
EMAIL_FROM = os.environ.get('EMAIL_FROM', 'onboarding@resend.dev')

# Base do frontend, usada para montar o link enviado no e-mail de redefinicao.
FRONTEND_BASE_URL = os.environ.get('FRONTEND_BASE_URL', 'http://localhost:3000')
