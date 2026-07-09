import os
import re
import unicodedata
from app.services.docx_parser import parse_docx


def _norm(text):
    text = text.strip().lower()
    nfkd = unicodedata.normalize('NFKD', text)
    return ''.join(c for c in nfkd if not unicodedata.combining(c))


def _clean_creature_name(name):
    for i, ch in enumerate(name):
        if ch.isalpha():
            return name[i:].strip()
    return name.strip()


def _build_image_index(img_root):
    index = {}
    p6 = os.path.join(img_root, 'Pagina06')
    if not os.path.isdir(p6):
        return index
    for dirpath, _, files in os.walk(p6):
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
    base = re.sub(r'\s*\(.*?\)', '', name).strip()
    bn = _norm(base)
    if bn and bn != n and bn in idx:
        return idx[bn]
    for key, path in idx.items():
        shorter = min(len(n), len(key))
        longer = max(len(n), len(key))
        if shorter > 5 and (n in key or key in n) and shorter / longer > 0.7:
            return path
    return ''

CREATURE_FIELDS = [
    'CA', 'PV', 'Movimento', 'Ataque', 'Ataques', 'Dano', 'Poder Especial',
    'Crítico', 'Efeito', 'Efeitos', 'Comportamento', 'Redução de Danos',
    'Tipo', 'Munição', 'Observação', 'Observações',
    'Habilidade Única',
]

FIELD_PATTERN = re.compile(
    r'^(' + '|'.join(re.escape(f) for f in CREATURE_FIELDS) + r')\s*:\s*(.+)',
    re.IGNORECASE
)

FIELD_HEADER_ONLY = re.compile(
    r'^(' + '|'.join(re.escape(f) for f in CREATURE_FIELDS) + r')\s*:\s*$',
    re.IGNORECASE
)

EMOJI_PATTERN = re.compile(r'^[\U00010000-\U0010ffff☀-➿⭐-⯿️]')
PET_EMOJI_PATTERN = EMOJI_PATTERN

ARMAS_HEADER = re.compile(r'^(?:Armas|Ataques)\s*:\s*$', re.IGNORECASE)
ATAQUE_SOLO_HEADER = re.compile(r'^Ataque\s*:\s*$', re.IGNORECASE)

PADRAO_ATAQUE = re.compile(
    r'^Padr[aã]o\s+de\s+[Aa]taque\s*:?\s*(.*)', re.IGNORECASE
)

EFEITO_ADICIONAL = re.compile(
    r'^Efeito\s+Adicional\s*:\s*(.*)', re.IGNORECASE
)

PERICIAS_HEADER = re.compile(
    r'^Per[ií]cias?\s*(em\s+Geral)?\s*$', re.IGNORECASE
)

GLUED_FIELD_NAMES = [
    'Ataque', 'Ataques', 'Efeito Adicional', 'Observação', 'Observações',
]
GLUED_SPLIT_PATTERN = re.compile(
    r'(?<=\S)(' + '|'.join(re.escape(f) for f in GLUED_FIELD_NAMES) + r')\s*:\s*',
    re.IGNORECASE
)
SECTION_FIELD_NAMES = ['Comportamento', 'Efeitos', 'Efeito']
SECTION_SPLIT_PATTERN = re.compile(
    r'(?<=[\.\)\!“”„‟"\'])[\s]*(' + '|'.join(re.escape(f) for f in SECTION_FIELD_NAMES) + r')\s*:\s*',
    re.IGNORECASE
)


def _split_glued_fields(line):
    splits = []
    for m in GLUED_SPLIT_PATTERN.finditer(line):
        splits.append(m.start())
    for m in SECTION_SPLIT_PATTERN.finditer(line):
        if m.start() not in splits:
            splits.append(m.start())
    if not splits:
        return [line]
    splits.sort()
    parts = []
    last = 0
    for s in splits:
        if s > last:
            parts.append(line[last:s].rstrip())
        last = s
    parts.append(line[last:])
    return [p for p in parts if p.strip()]


def _normalize_key(key):
    k = key.lower().replace(' ', '_')
    k = k.replace('í', 'i').replace('ã', 'a').replace('ç', 'c').replace('õ', 'o')
    k = k.replace('ú', 'u').replace('á', 'a').replace('é', 'e').replace('ê', 'e')
    if k == 'efeitos':
        k = 'efeito'
    if k == 'observacoes':
        k = 'observacao'
    if k == 'ataques':
        k = 'ataque'
    if k == 'habilidade_unica':
        k = 'habilidade_unica'
    return k


def _is_creature_name(line, creatures, current):
    if len(line) >= 80:
        return False
    if line.endswith('.'):
        return False
    if FIELD_PATTERN.match(line):
        return False
    if FIELD_HEADER_ONLY.match(line):
        return False
    if ARMAS_HEADER.match(line):
        return False
    if ATAQUE_SOLO_HEADER.match(line):
        return False
    if PADRAO_ATAQUE.match(line):
        return False
    if EFEITO_ADICIONAL.match(line):
        return False
    if PERICIAS_HEADER.match(line):
        return False
    if line.startswith('Efeitos de Dano'):
        return False
    if re.match(r'^Equipamentos\s*:\s*$', line, re.IGNORECASE):
        return False
    if re.match(r'^\d+[dD]\d+', line):
        return False
    if re.search(r':\s+\S', line):
        return False
    if EMOJI_PATTERN.match(line):
        return True
    if re.match(r'^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÚÇÜ]', line) and len(line) < 50:
        return True
    return False


def _is_pet_line(line):
    return bool(PET_EMOJI_PATTERN.match(line)) and len(line) < 60


def _parse_creatures(content, img_idx=None):
    img_idx = img_idx or {}
    creatures = []
    intro = []
    current = None
    mode = 'normal'

    all_lines = []
    for p in content:
        txt = p['texto'].strip()
        if not txt:
            continue
        lines = txt.split('\n') if '\n' in txt else [txt]
        for line in lines:
            line = line.strip()
            if line:
                for part in _split_glued_fields(line):
                    part = part.strip()
                    if part:
                        all_lines.append(part)

    i = 0
    while i < len(all_lines):
        line = all_lines[i]

        if line.startswith('Efeitos de Dano'):
            mode = 'dano_locais'
            if current:
                current.setdefault('dano_locais', [])
            i += 1
            continue

        if PERICIAS_HEADER.match(line):
            mode = 'pericias'
            if current:
                current.setdefault('pericias', [])
            i += 1
            continue

        if re.match(r'^Equipamentos\s*:\s*$', line, re.IGNORECASE):
            mode = 'equipamentos'
            if current:
                current.setdefault('equipamentos_lista', [])
            i += 1
            continue

        if ATAQUE_SOLO_HEADER.match(line):
            next_line = all_lines[i + 1] if i + 1 < len(all_lines) else ''
            if FIELD_PATTERN.match(next_line):
                i += 1
                continue
            mode = 'ataque_animal'
            if current:
                current.setdefault('ataque_detalhes', [])
            i += 1
            continue

        if ARMAS_HEADER.match(line):
            mode = 'armas'
            if current:
                current.setdefault('armas_lista', [])
            i += 1
            continue

        if mode == 'dano_locais' and current:
            if ':' in line and any(p in line for p in ['Cabeça', 'Tronco', 'Membros', 'Corpo']):
                current.setdefault('dano_locais', []).append(line)
                i += 1
                continue
            else:
                mode = 'normal'

        if mode == 'pericias' and current:
            ea = EFEITO_ADICIONAL.match(line)
            if ea:
                val = ea.group(1).strip()
                if val:
                    current.setdefault('pericias', []).append(line)
                i += 1
                continue
            if ':' in line and len(line) < 100:
                current.setdefault('pericias', []).append(line)
                i += 1
                continue
            if not ':' in line and len(line) < 80 and not _is_creature_name(line, creatures, current):
                current.setdefault('pericias', []).append(line)
                i += 1
                continue
            mode = 'normal'

        if mode == 'equipamentos' and current:
            if PERICIAS_HEADER.match(line) or line.startswith('Efeitos de Dano') \
                    or FIELD_PATTERN.match(line) or PADRAO_ATAQUE.match(line) \
                    or EFEITO_ADICIONAL.match(line):
                mode = 'normal'
            elif len(line) < 80:
                current.setdefault('equipamentos_lista', []).append(line.rstrip('.').rstrip(','))
                i += 1
                continue
            else:
                mode = 'normal'

        if mode == 'armas' and current:
            fm_check = FIELD_PATTERN.match(line)
            is_known_field = False
            if fm_check:
                fkey = fm_check.group(1).lower()
                if fkey in ('crítico', 'critico'):
                    is_known_field = True

            pa = PADRAO_ATAQUE.match(line)
            if pa:
                is_known_field = True

            if line.startswith('Efeitos de Dano') or PERICIAS_HEADER.match(line):
                is_known_field = True

            if re.match(r'^Equipamentos\s*:\s*$', line, re.IGNORECASE):
                is_known_field = True

            if is_known_field:
                mode = 'normal'
            elif _is_creature_name(line, creatures, current) and not _is_in_armas_context(line):
                mode = 'normal'
            else:
                current.setdefault('armas_lista', []).append(line)
                i += 1
                continue

        if mode == 'ataque_animal' and current:
            fm_check = FIELD_PATTERN.match(line)
            if fm_check:
                fkey = fm_check.group(1).lower()
                if fkey in ('comportamento', 'efeito', 'efeitos'):
                    mode = 'normal'
                else:
                    current.setdefault('ataque_detalhes', []).append(line)
                    i += 1
                    continue
            elif _is_creature_name(line, creatures, current):
                mode = 'normal'
            elif line.startswith('Efeitos de Dano') or PERICIAS_HEADER.match(line):
                mode = 'normal'
            else:
                current.setdefault('ataque_detalhes', []).append(line)
                i += 1
                continue

        pa = PADRAO_ATAQUE.match(line)
        if pa and current:
            val = pa.group(1).strip()
            if val:
                current['padrao_ataque'] = val
            else:
                j = i + 1
                parts = []
                while j < len(all_lines):
                    nxt = all_lines[j]
                    if FIELD_PATTERN.match(nxt) or _is_creature_name(nxt, creatures, current) \
                            or nxt.startswith('Efeitos de Dano') or PERICIAS_HEADER.match(nxt) \
                            or re.match(r'^Equipamentos\s*:\s*$', nxt, re.IGNORECASE):
                        break
                    parts.append(nxt)
                    j += 1
                current['padrao_ataque'] = ' '.join(parts)
                i = j
                continue
            i += 1
            continue

        fm = FIELD_PATTERN.match(line)
        if fm and current:
            key = fm.group(1)
            val = fm.group(2).strip()
            k = _normalize_key(key)

            if k == 'dano' and val.startswith('Dano:'):
                val = val[5:].strip()

            if k in ('ataque', 'ataques'):
                current['ataque'] = val
                i += 1
                continue

            if k == 'habilidade_unica':
                current.setdefault('habilidade_unica', []).append({'nome': val})
                j = i + 1
                hab = current['habilidade_unica'][-1]
                while j < len(all_lines):
                    nxt = all_lines[j]
                    hab_fm = FIELD_PATTERN.match(nxt)
                    if hab_fm:
                        hk = _normalize_key(hab_fm.group(1))
                        hv = hab_fm.group(2).strip()
                        if hk in ('critico', 'efeito'):
                            hab[hk] = hv
                            j += 1
                            continue
                    break
                i = j
                continue

            if k in current and k not in ('efeito', 'critico'):
                current[k] += '\n' + val
            elif k in current and k in ('efeito', 'critico'):
                current[k] += '\n' + val
            else:
                current[k] = val
            i += 1
            continue

        ea = EFEITO_ADICIONAL.match(line)
        if ea and current:
            val = ea.group(1).strip()
            if current.get('pericias') is not None:
                current['pericias'].append(line)
            else:
                current['efeito_adicional'] = val
            i += 1
            continue

        if _is_creature_name(line, creatures, current):
            if current and _is_pet_line(line) and mode != 'normal_intro':
                has_armas = 'armas_lista' in current or 'equipamentos_lista' in current
                if has_armas:
                    current.setdefault('pets', [])
                    pet_fields = {'ca', 'pv', 'movimento', 'ataque', 'efeito'}
                    pet = {'nome': line}
                    j = i + 1
                    while j < len(all_lines):
                        nxt = all_lines[j]
                        pfm = FIELD_PATTERN.match(nxt)
                        if pfm:
                            pk = _normalize_key(pfm.group(1))
                            pv = pfm.group(2).strip()
                            if pk in pet_fields:
                                pet[pk] = pv
                                j += 1
                                continue
                            else:
                                break
                        break
                    current['pets'].append(pet)
                    i = j
                    continue

            if current:
                creatures.append(current)
            current = {
                'nome': line,
                'descricao': '',
                'imagem': _find_image(_clean_creature_name(line), img_idx)
            }
            mode = 'normal'
            i += 1
            continue

        if current:
            if not current.get('descricao'):
                current['descricao'] = line
            else:
                current['descricao'] += ' ' + line
        else:
            intro.append(line)

        i += 1

    if current:
        creatures.append(current)

    return intro, creatures


def _is_in_armas_context(line):
    if re.match(r'.*\d+[dD]\d+', line):
        return True
    if re.match(r'^Ação\s', line, re.IGNORECASE):
        return True
    return False


def _process_section(section, img_idx=None):
    titulo = section['titulo']
    content = section.get('conteudo', [])

    intro, creatures = _parse_creatures(content, img_idx)

    result = {
        'titulo': titulo,
        'intro': intro,
        'criaturas': creatures,
        'subsecoes': []
    }

    for sub in section.get('subsecoes', []):
        sub_intro, sub_creatures = _parse_creatures(sub.get('conteudo', []), img_idx)
        sub_result = {
            'titulo': sub['titulo'],
            'intro': sub_intro,
            'criaturas': sub_creatures,
            'subsecoes': []
        }
        for subsub in sub.get('subsecoes', []):
            ss_intro, ss_creatures = _parse_creatures(subsub.get('conteudo', []), img_idx)
            sub_result['subsecoes'].append({
                'titulo': subsub['titulo'],
                'intro': ss_intro,
                'criaturas': ss_creatures
            })
        result['subsecoes'].append(sub_result)

    return result


def get_pagina6_data():
    from config.settings import IMG_DIR
    sections = parse_docx('Ameaças.docx')
    img_idx = _build_image_index(IMG_DIR)

    capitulos = []
    for s in sections:
        capitulos.append(_process_section(s, img_idx))

    return {
        'titulo': 'Ameaças do Mundo',
        'subtitulo': 'Criaturas e Inimigos',
        'capitulos': capitulos
    }
