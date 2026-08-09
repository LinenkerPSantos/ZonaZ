import json
import urllib.error
import urllib.request

from config.settings import SENDGRID_API_KEY, EMAIL_FROM, FRONTEND_BASE_URL


def enviar_email_redefinicao(destinatario, token):
    link = f'{FRONTEND_BASE_URL}/resetar-senha?token={token}'

    if not SENDGRID_API_KEY or not EMAIL_FROM:
        # Sem API key/remetente configurados (dev local): loga o link em vez
        # de falhar, pra dar pra testar o fluxo de "esqueci a senha" sem
        # credencial de e-mail real.
        print(f'[email_service] Envio de e-mail não configurado. Link de '
              f'redefinição para {destinatario}: {link}', flush=True)
        return

    corpo = (
        'Olá,\n\n'
        'Recebemos um pedido para redefinir a senha da sua conta na Zona-Z.\n'
        f'Para criar uma nova senha, acesse o link abaixo (válido por 1 hora):\n\n'
        f'{link}\n\n'
        'Se você não pediu essa redefinição, ignore este e-mail.'
    )

    # Envio via API HTTPS do SendGrid (porta 443) em vez de SMTP - hosts como
    # o Render bloqueiam as portas de SMTP (25/465/587) na saida. O remetente
    # (EMAIL_FROM) precisa estar verificado como "Single Sender" no SendGrid.
    payload = json.dumps({
        'personalizations': [{'to': [{'email': destinatario}]}],
        'from': {'email': EMAIL_FROM},
        'subject': 'Zona-Z — Redefinição de senha',
        'content': [{'type': 'text/plain', 'value': corpo}],
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.sendgrid.com/v3/mail/send',
        data=payload,
        method='POST',
        headers={
            'Authorization': f'Bearer {SENDGRID_API_KEY}',
            'Content-Type': 'application/json',
            'User-Agent': 'zona-z-backend/1.0',
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            resp.read()
    except urllib.error.HTTPError as e:
        print(f'[email_service] Falha ao enviar e-mail ({e.code}): {e.read()}', flush=True)
    except urllib.error.URLError as e:
        print(f'[email_service] Falha ao enviar e-mail: {e}', flush=True)
