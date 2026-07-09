import re
from app.services.docx_parser import parse_docx, strip_numbering


def _split_multiline(txt):
    """Split a paragraph that contains multiple fields on separate lines."""
    return [line.strip() for line in txt.split('\n') if line.strip()]


CATEGORIAS = ['Ataque', 'Defesa', 'Interação', 'Movimento', 'Utilidade']
_CATEGORIA_BOUND_RE = re.compile(
    r'^(.*?Categoria:\s*(?:' + '|'.join(CATEGORIAS) + r'))(.*)$'
)


def _append_descricao(current, text):
    text = text.strip()
    if not text:
        return
    if not current['descricao']:
        current['descricao'] = text
    else:
        current['descricao'] += ' ' + text


def _parse_talentos_from_section(section):
    paragraphs = section.get('conteudo', [])
    talentos = []
    current = None
    subcategoria = ''

    lines = []
    for p in paragraphs:
        txt = p['texto'].strip()
        if not txt:
            continue
        if '\n' in txt:
            lines.extend(_split_multiline(txt))
        else:
            lines.append(txt)

    for txt in lines:
        upper = txt.upper()
        if 'INSTRUÇÃO' in upper:
            continue

        tipo_match = re.match(r'^Tipo:\s*(.+)$', txt)
        if tipo_match:
            if current:
                raw = tipo_match.group(1).strip()

                embedded_efeito = re.search(r'Efeito:\s*(.+)$', raw)
                if embedded_efeito:
                    raw = raw[:embedded_efeito.start()].strip()
                    current['efeito'] = embedded_efeito.group(1).strip()

                bound = _CATEGORIA_BOUND_RE.match(raw)
                if bound:
                    current['tipo'] = bound.group(1).strip()
                    _append_descricao(current, bound.group(2))
                else:
                    current['tipo'] = raw
            continue

        efeito_search = re.search(r'Efeito:\s*(.+)$', txt)
        if efeito_search:
            if current:
                _append_descricao(current, txt[:efeito_search.start()])
                current['efeito'] = efeito_search.group(1).strip()
            continue

        uso_match = re.match(r'^Uso:\s*(.+)$', txt)
        if uso_match:
            if current:
                current['uso'] = uso_match.group(1).strip()
            continue

        is_sentence = len(txt.split()) > 6 and len(txt) > 40
        if re.match(r'^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÚÇÜ]', txt) and len(txt) < 80 and not txt.endswith('.') and 'Tipo:' not in txt and 'Efeito:' not in txt and not is_sentence:
            tipo_inline = re.match(r'^(.+?)\s*[-–—]\s*Tipo:\s*(.+)$', txt)
            if tipo_inline:
                current = {
                    'nome': tipo_inline.group(1).strip(),
                    'tipo': tipo_inline.group(2).strip(),
                    'descricao': '',
                    'efeito': '',
                    'subcategoria': subcategoria
                }
                talentos.append(current)
                continue

            if len(txt) < 50 and re.match(r'^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÚÇÜ][\w\sáàâãéèêíïóôõúçü/()]+$', txt):
                is_subcategory = any(
                    kw in txt.lower() for kw in
                    ['força', 'dano', 'precisão', 'crítico', 'especial',
                     'resistência', 'proteção', 'esquiva', 'social', 'manipulação',
                     'percepção', 'velocidade', 'mobilidade', 'furtividade',
                     'técnica', 'recurso', 'exploração', 'perícia', 'improviso',
                     'reflexos', 'geral']
                )
                if is_subcategory:
                    subcategoria = txt
                    continue

            current = {
                'nome': txt,
                'tipo': '',
                'descricao': '',
                'efeito': '',
                'subcategoria': subcategoria
            }
            talentos.append(current)
            continue

        if current:
            _append_descricao(current, txt)

    return [t for t in talentos if t['nome'] and t.get('tipo')]


_cache = {}


def _extract_instrucao_rich(content_list):
    result = []
    inside = False
    for p in content_list:
        txt = p.get('texto', '').strip()
        upper = txt.upper()
        if 'INSTRUÇÃO' in upper and 'INICIO' in upper:
            inside = True
            continue
        if 'INSTRUÇÃO' in upper and 'FINAL' in upper:
            break
        if inside:
            result.append({
                'texto': txt,
                'tipo': p.get('tipo', 'paragrafo')
            })
    return result


def get_talentos_data():
    sections = parse_docx('Talentos.docx')

    intro = []
    categorias = []

    for s in sections:
        if s.get('subsecoes'):
            intro = _extract_instrucao_rich(s.get('conteudo', []))
            for sub in s['subsecoes']:
                talentos = _parse_talentos_from_section(sub)
                categorias.append({
                    'titulo': sub['titulo'],
                    'itens': talentos
                })

    return {
        'intro': intro,
        'categorias': categorias
    }
