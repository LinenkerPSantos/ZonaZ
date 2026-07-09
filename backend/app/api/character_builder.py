import re
import unicodedata
from flask import Blueprint, jsonify
from app.services.pagina3_service import get_pagina3_data
from app.services.pagina4_service import get_pagina4_data

builder_bp = Blueprint('builder', __name__)


PERICIAS_CATEGORIAS = {
    'Físicas / Combate': ['Atletismo', 'Constituição', 'Furtividade', 'Luta', 'Pontaria', 'Pilotagem'],
    'Sobrevivência': ['Mecânica', 'Medicina', 'Percepção', 'Sobrevivência', 'Tecnologia'],
    'Sociais': ['Intimidação', 'Empatia', 'Enganação', 'Liderança', 'Persuasão'],
    'Intelectuais': ['Adestramento', 'Conhecimento', 'Estratégia', 'Iniciativa', 'Investigação', 'Vontade'],
}

ALL_PERICIAS = []
for cat_list in PERICIAS_CATEGORIAS.values():
    ALL_PERICIAS.extend(cat_list)

TITULOS_SOBREVIVENCIA = [
    'Sobrevivente Básico',
    'Veterano da Zona',
    'Caçador de Ruínas',
    'Predador do Apocalipse',
    'Lenda da Zona',
]

REGRAS_BASE = {
    'pontos_atributos': 7,
    'max_atributo': 3,
    'pv_base': 10,
    'ca_base': 8,
    'determinacao_base': 3,
    'sanidade_base': 5,
    'movimento_base': 9,
    'movimento_baixo': 7.5,
    'talentos_iniciais': 3,
    'pericias_livres': 2,
    'resistencia_infeccao': 5,
}


# ------------------------------------------------------------------
# Resolucao do "Pacote Inicial" de cada antecedente (6 itens: 1 arma/kit,
# 2 equipamentos de protecao, 3 itens) contra o catalogo de Equipamentos
# (pagina 4), para preencher a ficha automaticamente: arma equipada, kit
# com seu componente-arma extraido, protecao por regiao do corpo (com
# bonus de defesa), transporte por regiao do corpo (com bonus de carga) e
# os itens genericos que sobram para o inventario.

def _normalize_simple(s):
    s = unicodedata.normalize('NFKD', (s or '').strip().lower())
    s = ''.join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r'[^a-z0-9]+', ' ', s).strip()
    return s


def _normalize_loose(s):
    words = [w for w in _normalize_simple(s).split() if w not in ('de', 'do', 'da', 'dos', 'das', 'e', 'ou')]
    return ' '.join(words)


def _normalize_match(s):
    # Remove qualificadores entre parenteses (ex: "Mochila (Item unico)") para que
    # o nome catalogado bata com a referencia mais curta usada no Pacote Inicial.
    s = re.sub(r'\([^)]*\)', '', s or '')
    return _normalize_loose(s)


def _stem_words(chave):
    return ' '.join(w[:-1] if len(w) > 3 and w.endswith('s') else w for w in chave.split())


def _lookup_fuzzy(idx, chave):
    """Busca no indice tolerando plural simples (Binoculos vs Binoculo catalogado,
    ou Mapa das Zonas vs Mapas da Zona, onde o plural muda de palavra)."""
    if chave in idx:
        return idx[chave]
    if chave.endswith('s') and chave[:-1] in idx:
        return idx[chave[:-1]]
    if (chave + 's') in idx:
        return idx[chave + 's']
    stemmed = _stem_words(chave)
    for key, val in idx.items():
        if _stem_words(key) == stemmed:
            return val
    return None


def _find_section(node, titulo_normalizado):
    if _normalize_simple(node.get('titulo', '')) == titulo_normalizado:
        return node
    for sub in node.get('subsecoes', []):
        found = _find_section(sub, titulo_normalizado)
        if found:
            return found
    return None


def _collect_itens(node, out):
    for item in node.get('itens', []):
        if item.get('nome'):
            out.append(item)
    for sub in node.get('subsecoes', []):
        _collect_itens(sub, out)


REGIAO_SLOTS = {
    'cabeca': 'cabeca',
    'tronco': 'tronco',
    'corpo': 'tronco',
    'membros superiores': 'msup',
    'membros inferiores': 'minf',
}


def _parse_regioes(texto):
    texto = (texto or '').strip().rstrip('.')
    slots = []
    for parte in re.split(r',| e ', texto):
        chave = _normalize_simple(parte)
        slot = REGIAO_SLOTS.get(chave)
        if slot and slot not in slots:
            slots.append(slot)
    return slots


def _parse_int_signed(texto):
    m = re.search(r'-?\d+', texto or '')
    return int(m.group()) if m else 0


def _parse_bonus_carga(efeito):
    m = re.search(r'capacidade de carga em\s*\+?(-?\d+)', efeito or '', re.IGNORECASE)
    return int(m.group(1)) if m else 0


def _resolve_componente(texto):
    """'Faca. (Arma Simples)' -> {'nome': 'Faca', 'arma': True}"""
    m = re.match(r'^(.+?)\.?\s*\((.+?)\)\s*$', texto.strip())
    if not m:
        return {'nome': texto.strip(), 'arma': False}
    nome, tag = m.group(1).strip(), m.group(2).strip()
    return {'nome': nome, 'arma': bool(re.search(r'\barma\b', tag, re.IGNORECASE))}


def _arma_estruturada(item, subtitulo=''):
    """Monta os dados de uma arma como campos separados (nao um texto unico),
    para o frontend poder estilizar Nome / Dados / Efeito de forma distinta."""
    dados = []
    if item.get('tipo'):
        dados.append(['Tipo', item['tipo']])
    dano = item.get('dano_base') or item.get('dano')
    if dano:
        dados.append(['Dano', dano])
    if item.get('modificador'):
        dados.append(['Mod.', item['modificador']])
    if item.get('alcance'):
        dados.append(['Alcance', item['alcance']])
    if item.get('mao_usada'):
        dados.append(['Mão', item['mao_usada']])
    if item.get('municao'):
        dados.append(['Munição', item['municao']])
    return {
        'nome': item['nome'],
        'subtitulo': subtitulo,
        'carga': item.get('carga', ''),
        'dados': dados,
        'descricao': (item.get('descricao') or '').strip(),
        'efeito': (item.get('efeito_adicional') or item.get('efeito') or '').strip(),
    }


def _equip_estruturado(item, extra=None):
    """Mesma ideia de _arma_estruturada, para equipamentos e itens genericos."""
    dados = [['Carga', item.get('carga', '')]] if item.get('carga') else []
    if extra:
        dados.append(extra)
    return {
        'nome': item['nome'],
        'carga': item.get('carga', ''),
        'dados': dados,
        'descricao': (item.get('descricao') or '').strip(),
        'efeito': (item.get('efeito') or '').strip(),
    }


_catalogo_cache = None


def _catalogo_equipamentos():
    global _catalogo_cache
    if _catalogo_cache is not None:
        return _catalogo_cache

    data = get_pagina4_data()
    armas, kits, protecao, transporte, itens_gerais = [], [], [], [], []
    for cap in data.get('capitulos', []):
        if _normalize_simple(cap.get('titulo', '')) == _normalize_simple('Itens'):
            for sec in cap.get('secoes', []):
                if _normalize_simple(sec.get('titulo', '')) == _normalize_simple("Kit's Essenciais"):
                    continue
                _collect_itens(sec, itens_gerais)
        for sec in cap.get('secoes', []):
            s = _find_section(sec, _normalize_simple('Lista de Armamentos'))
            if s:
                _collect_itens(s, armas)
            s = _find_section(sec, _normalize_simple("Kit's Essenciais"))
            if s:
                _collect_itens(s, kits)
            s = _find_section(sec, _normalize_simple('Equipamento de Proteção'))
            if s:
                _collect_itens(s, protecao)
            s = _find_section(sec, _normalize_simple('Equipamento de Transporte'))
            if s:
                _collect_itens(s, transporte)

    def index(items):
        idx = {}
        for it in items:
            idx[_normalize_match(it['nome'])] = it
        return idx

    _catalogo_cache = {
        'armas': index(armas),
        'kits': index(kits),
        'protecao': index(protecao),
        'transporte': index(transporte),
        'itens': index(itens_gerais),
    }
    return _catalogo_cache


def _resolve_item_catalogo(chave, cat):
    """Tenta achar 'chave' como protecao, transporte ou item generico, e
    devolve os dados crus necessarios para aplicar essa opcao no pacote
    (usado tanto para resolucao direta quanto para escolhas 'X ou Y')."""
    p = _lookup_fuzzy(cat['protecao'], chave)
    if p:
        extra = ['Defesa', p['defesa']] if p.get('defesa') and p['defesa'] not in ('0', '+0') else None
        return {
            'tipo': 'protecao', 'nome': p['nome'],
            'regioes': _parse_regioes(p.get('regiao_corpo', '')),
            'defesa': _parse_int_signed(p.get('defesa', '')),
            'estruturado': _equip_estruturado(p, extra),
        }
    t = _lookup_fuzzy(cat['transporte'], chave)
    if t:
        return {
            'tipo': 'transporte', 'nome': t['nome'],
            'regioes': _parse_regioes(t.get('regiao_corpo', '')),
            'carga_bonus': _parse_bonus_carga(t.get('efeito', '')),
            'estruturado': _equip_estruturado(t),
        }
    item_cat = _lookup_fuzzy(cat['itens'], chave)
    if item_cat and item_cat.get('descricao'):
        return {'tipo': 'item', 'nome': item_cat['nome'], 'estruturado': _equip_estruturado(item_cat)}
    return None


def _aplicar_opcao_pacote(op, resultado):
    if op['tipo'] == 'protecao':
        for slot in op['regioes']:
            resultado['protecao'][slot] = op['nome']
        resultado['defesa_total'] += op['defesa']
        resultado['protecao_notas'].append(op['estruturado'])
    elif op['tipo'] == 'transporte':
        for slot in op['regioes']:
            if slot in resultado['transporte']:
                resultado['transporte'][slot] = op['nome']
        resultado['carga_bonus_total'] += op['carga_bonus']
        resultado['transporte_notas'].append(op['estruturado'])
    elif op['tipo'] == 'item':
        resultado['itens_gerais'].append(op['estruturado'])


def _resolve_pacote(pacote):
    cat = _catalogo_equipamentos()
    resultado = {
        'arma': None, 'kit': None,
        'protecao': {'cabeca': '', 'tronco': '', 'msup': '', 'minf': ''},
        'transporte': {'tronco': '', 'msup': '', 'minf': ''},
        'itens_gerais': [],
        'defesa_total': 0,
        'carga_bonus_total': 0,
        'protecao_notas': [],
        'transporte_notas': [],
        'escolhas': [],
    }
    if not pacote:
        return resultado

    chave0 = _normalize_match(pacote[0])
    if chave0 in cat['armas']:
        a = cat['armas'][chave0]
        resultado['arma'] = _arma_estruturada(a)
    elif chave0 in cat['kits']:
        k = cat['kits'][chave0]
        componentes = [_resolve_componente(c) for c in k.get('componentes', [])]
        arma_comp = next((c for c in componentes if c['arma']), None)
        resultado['kit'] = {
            'nome': k['nome'], 'carga': k.get('carga', ''),
            'arma': arma_comp['nome'] if arma_comp else '',
            'itens': [c['nome'] for c in componentes if not c['arma']],
        }
    else:
        resultado['arma'] = {'nome': pacote[0], 'subtitulo': '', 'carga': '', 'dados': [], 'descricao': '', 'efeito': ''}

    for raw in pacote[1:]:
        texto = raw.strip().rstrip('.')
        # Itens do pacote as vezes oferecem uma alternativa ("Mochila ou Colete
        # Suspensorio"): quando ha mais de uma opcao valida no catalogo, isso
        # vira uma escolha do jogador em vez de ser decidido sozinho aqui.
        partes = re.split(r'\s+ou\s+', texto, flags=re.IGNORECASE)
        if len(partes) > 1:
            opcoes = [op for op in (_resolve_item_catalogo(_normalize_match(p), cat) for p in partes) if op]
            if len(opcoes) > 1:
                resultado['escolhas'].append({'texto': texto, 'opcoes': opcoes})
                continue
            if len(opcoes) == 1:
                _aplicar_opcao_pacote(opcoes[0], resultado)
                continue
        else:
            op = _resolve_item_catalogo(_normalize_match(texto), cat)
            if op:
                _aplicar_opcao_pacote(op, resultado)
                continue

        resultado['itens_gerais'].append({'nome': texto, 'carga': '', 'dados': [], 'descricao': '', 'efeito': ''})

    return resultado


@builder_bp.route('/api/builder/data', methods=['GET'])
def builder_data():
    p3 = get_pagina3_data()

    antecedentes = []
    for ant in p3.get('antecedentes', []):
        antecedentes.append({
            'titulo': ant['titulo'],
            'icone': ant.get('icone', ''),
            'imagem': ant.get('imagem', ''),
            'bonus': ant.get('bonus', []),
            'pacote': ant.get('pacote', []),
            'pacote_estruturado': _resolve_pacote(ant.get('pacote', [])),
            'pericia_primaria': ant.get('pericia_primaria', ''),
            'pericias_secundarias': ant.get('pericias_secundarias', ''),
            'talento': ant.get('talento', {}),
            'descricao': ant.get('descricao', [])[:1],
        })

    talentos = []
    for cat in p3.get('talentos', []):
        talentos.append({
            'categoria': cat['titulo'],
            'itens': [
                {'nome': t['nome'], 'tipo': t.get('tipo', ''), 'descricao': t.get('descricao', ''), 'efeito': t.get('efeito', '')}
                for t in cat.get('itens', [])
            ]
        })

    return jsonify({
        'antecedentes': antecedentes,
        'talentos': talentos,
        'pericias': PERICIAS_CATEGORIAS,
        'all_pericias': ALL_PERICIAS,
        'titulos': TITULOS_SOBREVIVENCIA,
        'regras': REGRAS_BASE
    })
