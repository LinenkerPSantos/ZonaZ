import json
import urllib.error
import urllib.request

from config.settings import RESEND_API_KEY, EMAIL_FROM, FRONTEND_BASE_URL


def enviar_email_redefinicao(destinatario, token):
    link = f'{FRONTEND_BASE_URL}/resetar-senha?token={token}'

    if not RESEND_API_KEY:
        # Sem API key configurada (dev local): loga o link em vez de falhar,
        # pra dar pra testar o fluxo de "esqueci a senha" sem credencial real.
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

    # Envio via API HTTPS da Resend (porta 443) em vez de SMTP - hosts como o
    # Render bloqueiam as portas de SMTP (25/465/587) na saida.
    payload = json.dumps({
        'from': EMAIL_FROM,
        'to': [destinatario],
        'subject': 'Zona-Z — Redefinição de senha',
        'text': corpo,
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.resend.com/emails',
        data=payload,
        method='POST',
        headers={
            'Authorization': f'Bearer {RESEND_API_KEY}',
            'Content-Type': 'application/json',
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            resp.read()
    except urllib.error.HTTPError as e:
        print(f'[email_service] Falha ao enviar e-mail ({e.code}): {e.read()}', flush=True)
    except urllib.error.URLError as e:
        print(f'[email_service] Falha ao enviar e-mail: {e}', flush=True)
