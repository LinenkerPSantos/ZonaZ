import os
from app.services.docx_parser import parse_docx
from config.settings import IMG_DIR

_cache = {}


def _find_bg_image(content):
    for p in content:
        if p.get('tipo') == 'imagem-fundo':
            ref = p['texto']
            for ext in ('.png', '.jpg', '.jpeg', '.webp'):
                path = f'Pagina05/{ref}{ext}'
                full = os.path.join(IMG_DIR, path)
                if os.path.exists(full):
                    return path
            return f'Pagina05/{ref}.png'
    return ''


def _process_content(content):
    result = []
    for p in content:
        tipo = p.get('tipo', 'paragrafo')
        if tipo == 'imagem-fundo':
            continue
        if tipo == 'imagem':
            continue
        if tipo == 'table':
            result.append({
                'texto': '',
                'tipo': 'table',
                'headers': p.get('headers', []),
                'rows': p.get('rows', [])
            })
            continue
        if tipo == 'numbered-heading':
            result.append({
                'texto': p['texto'],
                'tipo': 'subtitulo'
            })
            continue
        result.append({
            'texto': p['texto'],
            'tipo': tipo
        })
    return result


def _process_section(section):
    titulo = section['titulo']
    content = section.get('conteudo', [])

    bg = _find_bg_image(content)

    result = {
        'titulo': titulo,
        'imagem_fundo': bg,
        'conteudo': _process_content(content),
        'subsecoes': []
    }

    for sub in section.get('subsecoes', []):
        sub_bg = _find_bg_image(sub.get('conteudo', []))
        sub_result = {
            'titulo': sub['titulo'],
            'imagem_fundo': sub_bg,
            'conteudo': _process_content(sub.get('conteudo', [])),
            'subsecoes': []
        }
        for subsub in sub.get('subsecoes', []):
            subsub_result = {
                'titulo': subsub['titulo'],
                'conteudo': _process_content(subsub.get('conteudo', []))
            }
            sub_result['subsecoes'].append(subsub_result)
        result['subsecoes'].append(sub_result)

    return result


def get_pagina5_data():
    sections = parse_docx('Guia do Mestre.docx')

    intro_content = []
    intro_bg = ''
    capitulos = []

    for s in sections:
        if s.get('tipo') == 'intro':
            intro_bg = _find_bg_image(s.get('conteudo', []))
            intro_content = _process_content(s.get('conteudo', []))
            continue

        h2 = _process_section(s)

        if not h2['imagem_fundo'] and intro_bg and not capitulos:
            h2['imagem_fundo'] = intro_bg
            intro_bg = ''

        capitulos.append(h2)

    return {
        'titulo': 'O Mundo em Detalhes',
        'subtitulo': 'Guia do Mestre',
        'intro': intro_content,
        'capitulos': capitulos
    }
