import re
from app.services.docx_parser import parse_docx

_MARKER_RE = re.compile(r'^(.{1,40}):\s*(.+)$')


def _is_sentence(texto):
    words = texto.split()
    return len(words) > 6 and texto.endswith(('.', '!', '?'))


def _process_content(content):
    result = []
    for p in content:
        tipo = p.get('tipo', 'paragrafo')
        texto = p['texto']
        if tipo == 'imagem':
            continue

        if tipo == 'paragrafo' and not re.search(r'\w', texto):
            continue

        if tipo == 'paragrafo' and p.get('estilo') == 'Heading 1':
            result.append({'texto': texto, 'tipo': 'subtitulo'})
            continue

        if tipo == 'paragrafo' and p.get('negrito_total'):
            result.append({'texto': texto, 'tipo': 'destaque' if _is_sentence(texto) else 'subtitulo'})
            continue

        if tipo == 'paragrafo' and p.get('texto_marcado'):
            result.append({'texto': p['texto_marcado'], 'tipo': 'paragrafo'})
            continue

        if tipo == 'paragrafo' and len(texto) < 80 and _MARKER_RE.match(texto):
            result.append({'texto': texto, 'tipo': 'marcador'})
            continue

        result.append({'texto': texto, 'tipo': tipo})
    return result


def get_pagina7_data():
    sections = parse_docx('Complementos.docx')

    capitulos = []
    for s in sections:
        if not s.get('titulo', '').strip():
            continue
        cap = {
            'titulo': s['titulo'],
            'conteudo': _process_content(s.get('conteudo', [])),
            'subsecoes': []
        }
        for sub in s.get('subsecoes', []):
            sub_result = {
                'titulo': sub['titulo'],
                'conteudo': _process_content(sub.get('conteudo', [])),
                'subsecoes': []
            }
            for subsub in sub.get('subsecoes', []):
                sub_result['subsecoes'].append({
                    'titulo': subsub['titulo'],
                    'conteudo': _process_content(subsub.get('conteudo', []))
                })
            cap['subsecoes'].append(sub_result)
        capitulos.append(cap)

    return {
        'titulo': 'Complementos',
        'subtitulo': 'Material Adicional',
        'capitulos': capitulos
    }
