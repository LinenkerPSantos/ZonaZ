from app.services.docx_parser import parse_docx, get_section_nav

_cache = {}


def get_pagina2_data():
    sections = parse_docx('Mecânica.docx')

    return {
        'titulo': 'Mecânicas do Jogo',
        'subtitulo': 'Guia ao Jogador',
        'imagens': {
            'capa': 'Pagina02/pg02_00.png',
            'mecanica': 'Pagina02/pg02_01.png',
            'combate': 'Pagina02/pg02_02.png',
            'exploracao': 'Pagina02/pg02_03.png'
        },
        'capitulos': sections,
        'navegacao': get_section_nav(sections)
    }
