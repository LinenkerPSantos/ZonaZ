import os
import re
import unicodedata
from app.services.docx_parser import parse_docx

_cache = {}

FIELD_PATTERN = re.compile(
    r'^(Tipo|Carga|Dano Base|Dano|Modificador|Alcance|Mão Usada|Descrição|'
    r'Efeito Adicional|Efeito|Defesa|Região do Corpo|Penalidade|Nome|'
    r'Capacidade|Munição|Som|Categoria|Pré-[Rr]equisito|Equipamento|Uso|Durabilidade)\s*:\s*(.+)',
    re.IGNORECASE
)

FIELD_KEY_MAP = {
    'tipo': 'tipo', 'carga': 'carga', 'dano base': 'dano_base',
    'dano': 'dano', 'modificador': 'modificador', 'alcance': 'alcance',
    'mão usada': 'mao_usada', 'descrição': 'descricao',
    'efeito adicional': 'efeito_adicional', 'efeito': 'efeito',
    'defesa': 'defesa', 'região do corpo': 'regiao_corpo',
    'penalidade': 'penalidade', 'nome': 'nome', 'capacidade': 'capacidade',
    'munição': 'municao', 'som': 'som', 'categoria': 'categoria',
    'pré-requisito': 'pre_requisito', 'equipamento': 'equipamento',
    'uso': 'uso',
    'durabilidade': 'durabilidade',
}


NAME_CORRECTIONS = {
    'Lança com Ponta de Portão': 'Lança com Ponta de Faca',
}


def _norm(text):
    text = text.strip().lower()
    nfkd = unicodedata.normalize('NFKD', text)
    return ''.join(c for c in nfkd if not unicodedata.combining(c))


def _build_image_index(img_root):
    index = {}
    p4 = os.path.join(img_root, 'Pagina04')
    if not os.path.isdir(p4):
        return index
    for dirpath, _, files in os.walk(p4):
        for f in files:
            if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                stem = os.path.splitext(f)[0].strip()
                rel = os.path.relpath(os.path.join(dirpath, f), img_root).replace('\\', '/')
                index[_norm(stem)] = rel
    return index


def _find_image(name, idx):
    n = _norm(name)
    if n in idx:
        return idx[n]
    for part in name.split('/'):
        p = _norm(part.strip())
        if p in idx:
            return idx[p]
    base = re.sub(r'\s*\(.*?\)', '', name).strip()
    bn = _norm(base)
    if bn and bn != n and bn in idx:
        return idx[bn]
    # Try with _ instead of / and spaces
    alt = _norm(name.replace('/', '_').replace(' ', '_'))
    if alt in idx:
        return idx[alt]
    alt2 = _norm(name.replace(' / ', '_'))
    if alt2 in idx:
        return idx[alt2]
    # Substring match — only if the shorter string covers most of the longer one
    for key, path in idx.items():
        shorter = min(len(n), len(key))
        longer = max(len(n), len(key))
        if shorter > 5 and (n in key or key in n) and shorter / longer > 0.7:
            return path
    return ''


def _field_key(raw):
    return FIELD_KEY_MAP.get(raw.lower().strip(), raw.lower().strip().replace(' ', '_'))


def _flatten_lines(content):
    lines = []
    for p in content:
        tipo = p.get('tipo', 'paragrafo')
        txt = p['texto'].strip()

        if tipo == 'titulo-sobrevivencia':
            lines.append({'text': txt, 'meta': 'titulo-open'})
            continue
        if tipo == 'titulo-fim':
            lines.append({'text': '', 'meta': 'titulo-close'})
            continue
        if tipo == 'grupo-open':
            lines.append({'text': txt, 'meta': 'grupo-open'})
            continue
        if tipo == 'bracket-close':
            lines.append({'text': '', 'meta': 'bracket-close'})
            continue
        if tipo == 'card':
            if '\n' in txt:
                parts = [l.strip() for l in txt.split('\n') if l.strip()]
                lines.append({'text': parts[0], 'meta': 'card-name'})
                for part in parts[1:]:
                    lines.append({'text': part, 'meta': None})
            else:
                lines.append({'text': txt, 'meta': 'card-name'})
            continue
        if tipo in ('subtitulo', 'marcador', 'introducao'):
            lines.append({'text': txt, 'meta': tipo})
            continue

        if not txt:
            continue
        upper = txt.upper()
        if 'INSTRUÇÃO' in upper:
            continue
        for line in txt.split('\n'):
            line = line.strip()
            if line:
                lines.append({'text': line, 'meta': None})
    return lines


def _parse_items(content, img_idx):
    lines = _flatten_lines(content)
    items = []
    intro = []
    current = None
    list_mode = None
    current_titulo = ''
    current_subcategoria = ''

    def flush():
        nonlocal current, list_mode
        if current:
            current['nome'] = NAME_CORRECTIONS.get(current['nome'], current['nome'])
            if not current.get('imagem'):
                current['imagem'] = _find_image(current['nome'], img_idx)
            items.append(current)
        current = None
        list_mode = None

    i = 0
    while i < len(lines):
        entry = lines[i]

        if entry.get('meta') == 'titulo-open':
            flush()
            current_titulo = entry['text']
            i += 1
            continue
        if entry.get('meta') == 'grupo-open':
            flush()
            current_subcategoria = entry['text']
            i += 1
            continue
        if entry.get('meta') == 'bracket-close':
            if current:
                flush()
            elif current_subcategoria:
                current_subcategoria = ''
            i += 1
            continue
        if entry.get('meta') == 'card-name':
            flush()
            current = {'nome': entry['text'], 'imagem': '', 'titulo_sobrevivencia': current_titulo,
                       'subcategoria': current_subcategoria}
            list_mode = None
            i += 1
            continue
        if entry.get('meta') in ('subtitulo', 'marcador', 'introducao'):
            flush()
            intro.append({'texto': entry['text'], 'tipo': entry['meta']})
            i += 1
            continue
        if entry.get('meta') == 'titulo-close':
            flush()
            current_titulo = ''
            i += 1
            continue

        line = entry['text']

        if line.startswith('[COMBO]'):
            if current:
                current.setdefault('combo', []).append(line.replace('[COMBO]', '').strip())
            i += 1
            continue

        if line == 'Componentes' or line == 'Componentes:':
            list_mode = 'componentes'
            if current:
                current.setdefault('componentes', [])
            i += 1
            continue

        if re.match(r'^Itens Iniciais', line, re.IGNORECASE):
            list_mode = 'itens_iniciais'
            if current:
                current.setdefault('itens_iniciais', [])
            i += 1
            continue

        if re.match(r'^Materiais Necess', line, re.IGNORECASE) and not FIELD_PATTERN.match(line):
            list_mode = 'materiais'
            if current:
                current.setdefault('materiais', [])
            i += 1
            continue

        fm = FIELD_PATTERN.match(line)
        if fm:
            key_raw = fm.group(1)
            val = fm.group(2).strip()
            key = _field_key(key_raw)

            if key == 'nome':
                flush()
                current = {'nome': val, 'imagem': '', 'titulo_sobrevivencia': current_titulo,
                           'subcategoria': current_subcategoria}
                list_mode = None
            elif current:
                current[key] = val
                list_mode = None
            else:
                if intro:
                    name = intro.pop()
                    current = {'nome': name, 'imagem': '', 'titulo_sobrevivencia': current_titulo,
                               'subcategoria': current_subcategoria, key: val}
                    list_mode = None
            i += 1
            continue

        if re.match(r'^\d+x\s+', line):
            if current:
                current.setdefault('materiais', []).append(line)
            i += 1
            continue

        if list_mode and current:
            is_list_item = (
                re.match(r'^\d+x[\.\s]', line) or
                line.endswith('(caráter narrativo)') or
                line.endswith(')') and len(line) < 80 or
                re.match(r'^\d+\s+Espaço', line)
            )
            if is_list_item:
                if list_mode == 'componentes':
                    current.setdefault('componentes', []).append(line)
                elif list_mode == 'itens_iniciais':
                    current.setdefault('itens_iniciais', []).append(line)
                elif list_mode == 'materiais':
                    current.setdefault('materiais', []).append(line)
                i += 1
                continue
            else:
                list_mode = None

        if re.match(r'^(Armas|Equipamentos?) de\s', line, re.IGNORECASE) and not FIELD_PATTERN.match(line):
            i += 1
            continue
        if re.match(r'^Liberado no\s', line, re.IGNORECASE):
            i += 1
            continue

        def _next_is_structured(pos):
            for j in range(pos + 1, min(pos + 4, len(lines))):
                e = lines[j]
                if e.get('meta'):
                    continue
                nxt = e['text']
                if FIELD_PATTERN.match(nxt):
                    return True
                if re.match(r'^Materiais Necess', nxt, re.IGNORECASE):
                    return True
                if re.match(r'^\d+x\s+', nxt):
                    return True
                if nxt in ('Componentes', 'Componentes:'):
                    return True
            return False

        is_subcategory_label = False
        if len(line) < 60 and not line.endswith('.') and re.match(r'^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÚÇÜ]', line):
            for j in range(i + 1, min(i + 3, len(lines))):
                e = lines[j]
                if e.get('meta'):
                    continue
                nxt = e['text']
                if re.match(r'^Nome:\s', nxt):
                    is_subcategory_label = True
                break

        if is_subcategory_label:
            flush()
            current_subcategoria = line
            i += 1
            continue

        is_name = False
        if len(line) < 100 and not line.endswith('.') and re.match(r'^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÚÇÜ]', line):
            if _next_is_structured(i):
                is_name = True

        if is_name:
            flush()
            current = {'nome': line, 'imagem': '', 'titulo_sobrevivencia': current_titulo,
                       'subcategoria': current_subcategoria}
            list_mode = None
            i += 1
            continue

        if current:
            if 'descricao' in current:
                current['descricao'] += ' ' + line
            else:
                current['descricao'] = line
        else:
            intro.append(line)

        i += 1

    flush()
    return intro, items


def _process_section(section, img_idx, h2_title=''):
    result = {
        'titulo': section['titulo'],
        'intro': [],
        'itens': [],
        'subsecoes': []
    }

    content = section.get('conteudo', [])
    if content:
        intro, items = _parse_items(content, img_idx)
        result['intro'] = intro
        result['itens'] = items

    for sub in section.get('subsecoes', []):
        sub_result = _process_section(sub, img_idx, h2_title=h2_title)
        result['subsecoes'].append(sub_result)

    return result


def get_pagina4_data():
    from config.settings import IMG_DIR
    sections = parse_docx('Equipamentos.docx')
    img_idx = _build_image_index(IMG_DIR)

    capitulos = []
    for section in sections:
        if section.get('tipo') == 'intro':
            continue

        h2_title = section['titulo']
        h2_intro = []
        for p in section.get('conteudo', []):
            tipo = p.get('tipo', 'paragrafo')
            if tipo in ('subtitulo', 'marcador', 'introducao', 'anotacao', 'destaque'):
                h2_intro.append({'texto': p['texto'], 'tipo': tipo})
            else:
                h2_intro.append(p['texto'])

        capitulo = {
            'titulo': h2_title,
            'intro': h2_intro,
            'secoes': []
        }

        for h3 in section.get('subsecoes', []):
            secao = _process_section(h3, img_idx, h2_title=h2_title)
            capitulo['secoes'].append(secao)

        capitulos.append(capitulo)

    return {
        'titulo': 'Equipamentos e Recursos',
        'subtitulo': 'Guia ao Jogador',
        'capitulos': capitulos
    }
