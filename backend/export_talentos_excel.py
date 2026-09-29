"""
Exporta os talentos do jogo (exclusivos de antecedente + escolhiveis por
categoria) para uma planilha Excel, para revisao/correcao antes de ajustar
o Antecentens.docx / Talentos.docx (ou o zona_z.db em cache).

Le sempre direto dos .docx (via pagina3_service), nao do zona_z.db em cache,
entao sempre reflete o conteudo mais recente dos arquivos fonte.

Cada linha traz a "Origem" (arquivo .docx) para facilitar localizar e
corrigir o talento na fonte depois de revisar a planilha.

Uso:
    python export_talentos_excel.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

from app.services.pagina3_service import get_pagina3_data

OUT_PATH = os.path.join(os.path.dirname(__file__), '..', 'Database', 'Zona-Z_Talentos.xlsx')

HEADER_FILL = PatternFill('solid', fgColor='8B0000')
HEADER_FONT = Font(color='FFFFFF', bold=True)
WRAP = Alignment(wrap_text=True, vertical='top')


def _write_sheet(wb, name, columns, rows):
    ws = wb.create_sheet(name)
    ws.append([label for _, label in columns])
    for c in range(1, len(columns) + 1):
        cell = ws.cell(row=1, column=c)
        cell.font = HEADER_FONT
        cell.fill = HEADER_FILL
    for row in rows:
        ws.append([row.get(key, '') for key, _ in columns])
    for r in range(2, len(rows) + 2):
        for c in range(1, len(columns) + 1):
            ws.cell(row=r, column=c).alignment = WRAP
    ws.freeze_panes = 'A2'
    ws.auto_filter.ref = ws.dimensions
    widths = {'descricao': 45, 'efeito': 55}
    for c, (key, label) in enumerate(columns, start=1):
        width = widths.get(key)
        if width is None:
            longest = max((len(str(r.get(key, ''))) for r in rows), default=0)
            width = max(10, min(35, longest + 2, len(label) + 4))
        ws.column_dimensions[get_column_letter(c)].width = width
    print(f'  {name}: {len(rows)} linhas')
    return ws


def build_exclusivos(data):
    rows = []
    for a in data.get('antecedentes', []):
        talento = a.get('talento', {})
        rows.append({
            'origem': 'Antecentens.docx',
            'antecedente': a['titulo'],
            'nome': talento.get('nome', ''),
            'tipo': talento.get('tipo', ''),
            'descricao': talento.get('descricao', ''),
            'efeito': talento.get('efeito', ''),
        })
    columns = [
        ('origem', 'Origem (arquivo)'),
        ('antecedente', 'Antecedente'),
        ('nome', 'Nome do Talento'),
        ('tipo', 'Tipo'),
        ('descricao', 'Descricao'),
        ('efeito', 'Efeito'),
    ]
    return columns, rows


def build_escolhiveis(data):
    rows = []
    for categoria in data.get('talentos', []):
        for item in categoria.get('itens', []):
            rows.append({
                'origem': 'Talentos.docx',
                'categoria': categoria.get('titulo', ''),
                'subcategoria': item.get('subcategoria', ''),
                'nome': item.get('nome', ''),
                'tipo': item.get('tipo', ''),
                'descricao': item.get('descricao', ''),
                'efeito': item.get('efeito', ''),
                'uso': item.get('uso', ''),
            })
    columns = [
        ('origem', 'Origem (arquivo)'),
        ('categoria', 'Categoria'),
        ('subcategoria', 'Subcategoria'),
        ('nome', 'Nome'),
        ('tipo', 'Tipo'),
        ('descricao', 'Descricao'),
        ('efeito', 'Efeito'),
        ('uso', 'Uso'),
    ]
    return columns, rows


def build_leiame(wb):
    ws = wb.create_sheet('Leia-me')
    ws.column_dimensions['A'].width = 100
    linhas = [
        'TALENTOS DE ZONA-Z — planilha para revisao',
        '',
        'Aba "Talentos Exclusivos": um talento por Antecedente (20 no total).'
        ' Vem do arquivo Database/Antecentens.docx, campo "Talento Exclusivo:" de cada antecedente.',
        '',
        'Aba "Talentos Escolhiveis": talentos livres, agrupados por categoria'
        ' (Ataque, Defesa, Interacao, Movimento, Utilidade). Vem do arquivo Database/Talentos.docx.',
        '',
        'COMO CORRIGIR UM ERRO:',
        '1. Encontre a linha errada aqui (use a coluna "Origem" para saber em qual .docx procurar).',
        '2. Abra o .docx correspondente em Database/ e localize o talento pelo Nome/Antecedente/Categoria.',
        '3. Corrija o texto diretamente no .docx, mantendo as tags do documento'
        ' (ex.: "Talento Exclusivo:", "Tipo:", "Descricao:", "Efeito:").',
        '4. Rode "python import_to_db.py" (pasta backend/) para atualizar o zona_z.db com a correcao.',
        '5. Se quiser conferir o resultado, rode de novo "python export_talentos_excel.py" para gerar'
        ' uma planilha atualizada.',
        '',
        'Esta planilha e somente para leitura/conferencia — editar aqui nao altera o jogo,'
        ' a correcao precisa ser feita no .docx (ou no zona_z.db) depois.',
    ]
    for texto in linhas:
        ws.append([texto])
    ws['A1'].font = Font(bold=True, size=13)
    for row in ws.iter_rows(min_row=2):
        row[0].alignment = Alignment(wrap_text=True, vertical='top')


def main():
    print('Lendo talentos a partir dos .docx...')
    data = get_pagina3_data()

    wb = Workbook()
    wb.remove(wb.active)

    build_leiame(wb)
    _write_sheet(wb, 'Talentos Exclusivos', *build_exclusivos(data))
    _write_sheet(wb, 'Talentos Escolhiveis', *build_escolhiveis(data))

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    wb.save(OUT_PATH)
    print()
    print(f'Planilha salva em: {os.path.abspath(OUT_PATH)}')


if __name__ == '__main__':
    main()
