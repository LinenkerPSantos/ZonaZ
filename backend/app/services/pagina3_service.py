import re
from app.services.docx_parser import parse_docx, strip_numbering


def _extract_instrucao(paragraphs):
    result = []
    inside = False
    for txt in paragraphs:
        upper = txt.strip().upper()
        if 'INSTRUÇÃO' in upper and 'INICIO' in upper:
            inside = True
            continue
        if 'INSTRUÇÃO' in upper and 'FINAL' in upper:
            break
        if inside:
            result.append(txt)
    return result if result else paragraphs


IMAGE_MAP = {
    'Acadêmico': {
        'img': 'Pagina03/Antecedentes/Academico Homem.png',
        'icon': 'Pagina03/Icone Antecendentes/icon_academico.png'
    },
    'Advogado': {
        'img': 'Pagina03/Antecedentes/Advogada Mulher.png',
        'icon': 'Pagina03/Icone Antecendentes/icon_advogado.png'
    },
    'Agente de Saúde': {
        'img': 'Pagina03/Antecedentes/Agente de Saude.png',
        'icon': 'Pagina03/Icone Antecendentes/icon_agente_saude.png'
    },
    'Artista': {
        'img': 'Pagina03/Antecedentes/Artista.png',
        'icon': 'Pagina03/Icone Antecendentes/icon_artista.png'
    },
    'Chef de Cozinha / Cozinheiro': {
        'img': 'Pagina03/Antecedentes/Chefe de cozinha.png',
        'icon': 'Pagina03/Icone Antecendentes/icon_chefe.png'
    },
    'Criminoso': {
        'img': 'Pagina03/Antecedentes/Crimonoso.png',
        'icon': 'Pagina03/Icone Antecendentes/icon_criminoso.png'
    },
    'Empresário': {
        'img': 'Pagina03/Antecedentes/Empresário.png',
        'icon': 'Pagina03/Icone Antecendentes/icon_empresario.png'
    },
    'Esportista Profissional': {
        'img': 'Pagina03/Antecedentes/Atleta.png',
        'icon': 'Pagina03/Icone Antecendentes/icon_esportista.png'
    },
    'Farmacêutico': {
        'img': 'Pagina03/Antecedentes/Farmaceutico.png',
        'icon': 'Pagina03/Icone Antecendentes/icon_farmaceutico.png'
    },
    'Jornalista': {
        'img': 'Pagina03/Antecedentes/Reporte.png',
        'icon': 'Pagina03/Icone Antecendentes/icon_jornalista.png'
    },
    'Mensageiro / Entregador Urbano': {
        'img': 'Pagina03/Antecedentes/Mensageira.png',
        'icon': 'Pagina03/Icone Antecendentes/icon_mensageiro.png'
    },
    'Militar': {
        'img': 'Pagina03/Antecedentes/Militar.png',
        'icon': 'Pagina03/Icone Antecendentes/icon_militar.png'
    },
    'Operário': {
        'img': 'Pagina03/Antecedentes/Operario.png',
        'icon': 'Pagina03/Icone Antecendentes/icon_operario.png'
    },
    'Policial': {
        'img': 'Pagina03/Antecedentes/Policial.png',
        'icon': 'Pagina03/Icone Antecendentes/icon_policial.png'
    },
    'Religioso': {
        'img': 'Pagina03/Antecedentes/Padre.png',
        'icon': 'Pagina03/Icone Antecendentes/icon_religioso.png'
    },
    'Segurança Privado': {
        'img': 'Pagina03/Antecedentes/Segurança.png',
        'icon': 'Pagina03/Icone Antecendentes/icon_segurancao.png'
    },
    'Sem Experiência': {
        'img': 'Pagina03/Antecedentes/Sem Esperiência.png',
        'icon': 'Pagina03/Icone Antecendentes/icon_semexperiencia.png'
    },
    'Servidor Público': {
        'img': 'Pagina03/Antecedentes/Servidor Publico.png',
        'icon': 'Pagina03/Icone Antecendentes/icon_servidor.png'
    },
    'Técnico de TI': {
        'img': 'Pagina03/Antecedentes/TI.png',
        'icon': 'Pagina03/Icone Antecendentes/icon_ti.png'
    },
    'Trabalhador Rural': {
        'img': 'Pagina03/Antecedentes/Trabalhador Rural.png',
        'icon': 'Pagina03/Icone Antecendentes/icon_trabalhadorrural.png'
    }
}

_cache = {}


def _parse_antecedente(section):
    titulo = section['titulo']
    imgs = IMAGE_MAP.get(titulo, {})
    paragrafos = section.get('conteudo', [])

    descricao = []
    tracos = ''
    ocupacoes = ''
    forcas = ''
    fraquezas = ''
    bonus = []
    pacote = []
    pericia_primaria = ''
    pericias_secundarias = ''
    talento_nome = ''
    talento_tipo = ''
    talento_descricao = ''
    talento_efeito = ''

    mode = 'descricao'

    for p in paragrafos:
        txt = p['texto']

        if txt.startswith('Traços marcantes:'):
            tracos = txt.replace('Traços marcantes:', '').strip()
            mode = 'info'
        elif txt.startswith('Possíveis ocupações anteriores:'):
            ocupacoes = txt.replace('Possíveis ocupações anteriores:', '').strip()
        elif txt.startswith('Forças no novo mundo:'):
            forcas = txt.replace('Forças no novo mundo:', '').strip()
        elif txt.startswith('Fraquezas no novo mundo:'):
            fraquezas = txt.replace('Fraquezas no novo mundo:', '').strip()
        elif txt == 'Bônus Inicial':
            mode = 'bonus'
        elif txt == 'Pacote Inicial':
            mode = 'pacote'
        elif txt.startswith('Pericia Primária:') or txt.startswith('Perícia Primária:'):
            pericia_primaria = re.sub(r'^Per[ií]cia Prim[aá]ria:\s*', '', txt)
            mode = 'pericias'
        elif txt.startswith('Pericias Secundárias:') or txt.startswith('Perícias Secundárias:'):
            pericias_secundarias = re.sub(r'^Per[ií]cias Secund[aá]rias:\s*', '', txt)
        elif txt.startswith('Talento Exclus') or txt.startswith('Talento exclus'):
            talento_nome = re.sub(r'^Talento\s+Exclusiv[eo]:\s*', '', txt, flags=re.IGNORECASE).strip()
            mode = 'talento'
        elif txt.startswith('Tipo:') and mode == 'talento':
            talento_tipo = txt.replace('Tipo:', '').strip()
        elif txt.startswith('Descrição:') and mode == 'talento':
            talento_descricao = txt.replace('Descrição:', '').strip()
        elif txt.startswith('Efeito:') and mode == 'talento':
            talento_efeito = txt.replace('Efeito:', '').strip()
        elif mode == 'descricao':
            descricao.append(txt)
        elif mode == 'bonus' and txt.startswith('+'):
            bonus.append(txt)
        elif mode == 'pacote' and txt and not txt.startswith('Pericia') and not txt.startswith('Perícia'):
            pacote.append(txt)

    return {
        'titulo': titulo,
        'imagem': imgs.get('img', ''),
        'icone': imgs.get('icon', ''),
        'descricao': descricao,
        'tracos': tracos,
        'ocupacoes': ocupacoes,
        'forcas': forcas,
        'fraquezas': fraquezas,
        'bonus': bonus,
        'pacote': pacote,
        'pericia_primaria': pericia_primaria,
        'pericias_secundarias': pericias_secundarias,
        'talento': {
            'nome': talento_nome,
            'tipo': talento_tipo,
            'descricao': talento_descricao,
            'efeito': talento_efeito
        }
    }


def get_pagina3_data():
    sections = parse_docx('Antecentens.docx')

    intro = []
    antecedentes = []

    for s in sections:
        if s.get('subsecoes'):
            intro = _extract_instrucao([p['texto'] for p in s.get('conteudo', [])])
            for sub in s['subsecoes']:
                antecedentes.append(_parse_antecedente(sub))
        elif s.get('tipo') == 'secao':
            antecedentes.append(_parse_antecedente(s))

    from app.services.talentos_parser import get_talentos_data
    talentos_data = get_talentos_data()

    return {
            'titulo': 'Antecedentes e Talentos',
            'subtitulo': 'Guia ao Jogador',
            'capa': 'Pagina03/pg03_00.png',
            'intro': intro,
            'antecedentes': antecedentes,
            'talentos': talentos_data['categorias'],
            'talentos_intro': talentos_data['intro']
        }
