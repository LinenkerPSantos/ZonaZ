import os
import re
from docx import Document
from lxml import etree
from config.settings import DATABASE_DIR


def strip_numbering(text):
    return re.sub(r'^\s*\d+(\.\d+)*\.?\s+', '', text)


def _run_text(r, ns):
    """Extract a run's text, converting <w:br/> to newlines and <w:tab/> to tabs
    (python-docx's own runs skip these, silently gluing fields the author split
    with a soft line break onto one line)."""
    parts = []
    for child in r:
        tag = etree.QName(child.tag).localname
        if tag == 't':
            parts.append(child.text or '')
        elif tag == 'br':
            parts.append('\n')
        elif tag == 'tab':
            parts.append('\t')
    return ''.join(parts)


def _strip_end_tags(text):
    text = re.sub(r'\(card-fim\)\s*$', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\(I\s*-\s*fim\)\s*$', '', text, flags=re.IGNORECASE)
    return text.strip()


def _process_highlight_tags(text):
    """Replace inline highlight markers with <hl> tags."""
    text = re.sub(
        r'\(importante destacar\s*[-–]\s*I\)\s*', '<hl>', text, flags=re.IGNORECASE
    )
    text = re.sub(r'\(I\s*[-–]\s*fim\)', '</hl>', text, flags=re.IGNORECASE)
    text = re.sub(r'<\s*[Ss]trong\s*>', '<hl>', text)
    text = re.sub(r'<\s*/?\s*[Ss]/?\s*trong\s*>', '</hl>', text)
    return text


def _mark_bold_segments(segments):
    """Wrap bold runs in <hl>...</hl>, mirroring the (importante destacar) tag output."""
    parts = []
    bold_open = False
    for t, bold in segments:
        if not t:
            continue
        is_bold_content = bold and t.strip()
        if is_bold_content and not bold_open:
            parts.append('<hl>')
            bold_open = True
        elif bold_open and not is_bold_content:
            parts.append('</hl>')
            bold_open = False
        parts.append(t)
    if bold_open:
        parts.append('</hl>')
    return ''.join(parts).strip()


def _classify_paragraph(text, style, fully_bold=False, marked_text=None):
    entries = []

    titulo_match = re.match(
        r'^\(Titulo de Sobreviv[eê]ncia\s*-\s*Fechamento\)',
        text, re.IGNORECASE
    )
    if titulo_match:
        entries.append({'texto': '', 'estilo': style, 'tipo': 'titulo-fim'})
        return entries

    titulo_open = re.match(
        r'^\(Titulo de Sobreviv[eê]ncia\)\s*(.+)',
        text, re.IGNORECASE
    )
    if titulo_open:
        label = titulo_open.group(1).strip()
        entries.append({'texto': label, 'estilo': style, 'tipo': 'titulo-sobrevivencia'})
        return entries

    if text.startswith('(Marcador)') or text.startswith('(marcador)'):
        clean = re.sub(r'^\((?:M|m)arcador\)\s*', '', text)
        clean = _strip_end_tags(clean)
        clean = _process_highlight_tags(clean)
        entries.append({'texto': clean, 'estilo': style, 'tipo': 'marcador'})
        return entries

    if re.match(r'^\((?:I|i)ntrodução\)', text) or re.match(r'^\((?:I|i)ntroducao\)', text):
        clean = re.sub(r'^\((?:I|i)ntrodução\)\s*', '', text)
        clean = re.sub(r'^\((?:I|i)ntroducao\)\s*', '', clean)
        clean = _strip_end_tags(clean)
        clean = _process_highlight_tags(clean)
        entries.append({'texto': clean, 'estilo': style, 'tipo': 'introducao'})
        return entries

    if re.match(r'^IMAGEM PARA FUNDO', text, re.IGNORECASE):
        img_ref = re.sub(r'^IMAGEM PARA FUNDO\s*[–-]\s*', '', text).strip()
        entries.append({'texto': img_ref, 'estilo': style, 'tipo': 'imagem-fundo'})
        return entries

    if re.match(r'^\((?:A|a)nota[çc][ãa]o\)', text):
        clean = re.sub(r'^\((?:A|a)nota[çc][ãa]o\)\s*', '', text).strip()
        entries.append({'texto': clean, 'estilo': style, 'tipo': 'anotacao'})
        return entries

    if text.strip() == ']':
        entries.append({'texto': '', 'estilo': style, 'tipo': 'bracket-close'})
        return entries

    if re.match(r'^\[\((?:S|s)ubt[ií]tulo\)', text):
        clean = re.sub(r'^\[\((?:S|s)ubt[ií]tulo\)\s*', '', text).strip()
        entries.append({'texto': clean, 'estilo': style, 'tipo': 'grupo-open'})
        return entries

    if re.match(r'^\[\((?:C|c)ard\)', text):
        clean = re.sub(r'^\[\((?:C|c)ard\)\s*', '', text)
        clean = _strip_end_tags(clean)
        clean = _process_highlight_tags(clean)
        entries.append({'texto': clean, 'estilo': style, 'tipo': 'card'})
        return entries

    if re.match(r'^\((?:S|s)ubt[ií]tulo\)', text):
        clean = re.sub(r'^\((?:S|s)ubt[ií]tulo\)\s*', '', text).strip()
        entries.append({'texto': clean, 'estilo': style, 'tipo': 'subtitulo'})
        return entries

    if re.match(r'^\((?:C|c)ard\)', text):
        clean = re.sub(r'^\((?:C|c)ard\)\s*', '', text)
        has_end = bool(re.search(r'\(card-fim\)', clean, re.IGNORECASE))
        clean = _strip_end_tags(clean)
        clean = _process_highlight_tags(clean)
        entries.append({'texto': clean, 'estilo': style, 'tipo': 'card'})
        if has_end:
            entries.append({'texto': '', 'estilo': style, 'tipo': 'card-fim'})
        return entries

    if re.match(r'^\((?:C|c)ard-fim\)', text):
        clean = re.sub(r'^\((?:C|c)ard-fim\)\s*', '', text).strip()
        entries.append({'texto': clean, 'estilo': style, 'tipo': 'card-fim'})
        return entries

    if re.match(r'^\(importante destacar\s*[-–]\s*I\)', text, re.IGNORECASE):
        clean = re.sub(r'^\(importante destacar\s*[-–]\s*I\)\s*', '', text, flags=re.IGNORECASE)
        clean = re.sub(r'\(I\s*[-–]\s*fim\)', '', clean, flags=re.IGNORECASE)
        clean = _strip_end_tags(clean)
        clean = re.sub(r'\s{2,}', ' ', clean).strip()
        entries.append({'texto': clean, 'estilo': style, 'tipo': 'destaque'})
        return entries

    numbered_heading = re.match(r'^(\d+\.\d+\.?)\s+(.+)$', text)
    if numbered_heading:
        clean = numbered_heading.group(2).strip()
        entries.append({'texto': clean, 'estilo': style, 'tipo': 'numbered-heading', 'numero': numbered_heading.group(1)})
        return entries

    if style == 'List Paragraph':
        entries.append({'texto': text, 'estilo': style, 'tipo': 'lista'})
    elif text.startswith('Img'):
        entries.append({'texto': text, 'estilo': style, 'tipo': 'imagem'})
    else:
        original = text
        clean = _strip_end_tags(text)
        clean = _process_highlight_tags(clean)
        tipo = 'paragrafo'
        entry = {'texto': clean, 'estilo': style, 'tipo': tipo}
        if fully_bold:
            entry['negrito_total'] = True
        elif marked_text and '<hl>' in marked_text and marked_text != text:
            entry['texto_marcado'] = _strip_end_tags(marked_text)
        entries.append(entry)
        if clean != _process_highlight_tags(original.strip()):
            entries.append({'texto': '', 'estilo': style, 'tipo': 'card-fim'})

    return entries


def _parse_table_element(tbl_element, doc):
    from docx.table import Table
    table = Table(tbl_element, doc)
    rows = []
    for row in table.rows:
        rows.append([cell.text.strip() for cell in row.cells])
    if not rows:
        return None
    return {
        'texto': '',
        'estilo': '',
        'tipo': 'table',
        'headers': rows[0],
        'rows': rows[1:]
    }


def parse_docx(filename):
    filepath = os.path.join(DATABASE_DIR, filename)
    doc = Document(filepath)

    sections = []
    current_h2 = None
    current_h3 = None
    current_h4 = None

    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    body = doc.element.body
    pending_table = False
    skip_next_close = False

    style_map = {}
    for s in doc.styles:
        style_map[s.style_id] = s.name

    for child in body:
        tag = etree.QName(child.tag).localname

        if tag == 'tbl' and pending_table:
            pending_table = False
            skip_next_close = True
            table_entry = _parse_table_element(child, doc)
            if table_entry:
                target = current_h4 or current_h3 or current_h2
                if target:
                    target['conteudo'].append(table_entry)
                elif sections and sections[-1].get('tipo') == 'intro':
                    sections[-1]['conteudo'].append(table_entry)
            continue

        if tag != 'p':
            continue

        run_els = child.findall('.//w:r', ns)
        segments = []
        for r in run_els:
            t = _run_text(r, ns)
            if not t:
                continue
            rPr = r.find('w:rPr', ns)
            b_el = rPr.find('w:b', ns) if rPr is not None else None
            bold = b_el is not None and b_el.get(f'{{{ns["w"]}}}val') not in ('0', 'false', 'off')
            segments.append((t, bold))
        text = ''.join(t for t, _ in segments).strip()
        if not text:
            continue

        fully_bold = bool(segments) and all(bold for t, bold in segments if t.strip())
        marked_text = text if fully_bold else _mark_bold_segments(segments)

        pPr = child.find('w:pPr', ns)
        style_el = pPr.find('w:pStyle', ns) if pPr is not None else None
        style_id = style_el.get(f'{{{ns["w"]}}}val') if style_el is not None else ''
        style = style_map.get(style_id, style_id)

        if re.match(r'^\[\((?:T|t)able\)', text):
            pending_table = True
            continue
        if text == ']' and skip_next_close:
            skip_next_close = False
            continue
        if text == ']' and not pending_table:
            entries = _classify_paragraph(text, style, fully_bold, marked_text)
            target = current_h4 or current_h3 or current_h2
            if target:
                for entry in entries:
                    target['conteudo'].append(entry)
            continue

        if style in ('Heading 2', 'Heading 3', 'Heading 4'):
            text = strip_numbering(text)

        if style == 'Heading 2':
            current_h2 = {
                'titulo': text,
                'tipo': 'capitulo',
                'subsecoes': [],
                'conteudo': []
            }
            sections.append(current_h2)
            current_h3 = None
            current_h4 = None

        elif style == 'Heading 3':
            current_h3 = {
                'titulo': text,
                'tipo': 'secao',
                'subsecoes': [],
                'conteudo': []
            }
            if current_h2:
                current_h2['subsecoes'].append(current_h3)
            else:
                sections.append(current_h3)
            current_h4 = None

        elif style == 'Heading 4':
            current_h4 = {
                'titulo': text,
                'tipo': 'subsecao',
                'conteudo': []
            }
            if current_h3:
                current_h3['subsecoes'].append(current_h4)
            elif current_h2:
                current_h2['subsecoes'].append(current_h4)

        else:
            entries = _classify_paragraph(text, style, fully_bold, marked_text)

            target = current_h4 or current_h3 or current_h2
            if target:
                for entry in entries:
                    target['conteudo'].append(entry)
            else:
                if not sections or sections[-1].get('tipo') != 'intro':
                    sections.insert(0, {
                        'titulo': '',
                        'tipo': 'intro',
                        'conteudo': []
                    })
                for entry in entries:
                    sections[0]['conteudo'].append(entry)

    return sections


def get_section_nav(sections):
    nav = []
    for s in sections:
        item = {
            'titulo': s['titulo'],
            'id': slugify(s['titulo']),
            'subsecoes': []
        }
        for sub in s.get('subsecoes', []):
            sub_item = {
                'titulo': sub['titulo'],
                'id': slugify(sub['titulo']),
                'subsecoes': []
            }
            for subsub in sub.get('subsecoes', []):
                sub_item['subsecoes'].append({
                    'titulo': subsub['titulo'],
                    'id': slugify(subsub['titulo'])
                })
            item['subsecoes'].append(sub_item)
        nav.append(item)
    return nav


def slugify(text):
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'-+', '-', text)
    return text.strip('-')
