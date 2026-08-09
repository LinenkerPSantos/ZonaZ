import smtplib
from email.mime.text import MIMEText

from config.settings import (
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, FRONTEND_BASE_URL,
)


def enviar_email_redefinicao(destinatario, token):
    link = f'{FRONTEND_BASE_URL}/resetar-senha?token={token}'

    if not SMTP_HOST or not SMTP_USER or not SMTP_PASSWORD:
        # Sem SMTP configurado (dev local): loga o link em vez de falhar, pra dar
        # pra testar o fluxo de "esqueci a senha" sem credencial de e-mail real.
        print(f'[email_service] SMTP não configurado. Link de redefinição para '
              f'{destinatario}: {link}', flush=True)
        return

    corpo = (
        'Olá,\n\n'
        'Recebemos um pedido para redefinir a senha da sua conta na Zona-Z.\n'
        f'Para criar uma nova senha, acesse o link abaixo (válido por 1 hora):\n\n'
        f'{link}\n\n'
        'Se você não pediu essa redefinição, ignore este e-mail.'
    )
    msg = MIMEText(corpo, 'plain', 'utf-8')
    msg['Subject'] = 'Zona-Z — Redefinição de senha'
    msg['From'] = SMTP_FROM
    msg['To'] = destinatario

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as servidor:
        servidor.starttls()
        servidor.login(SMTP_USER, SMTP_PASSWORD)
        servidor.sendmail(SMTP_FROM, [destinatario], msg.as_string())
