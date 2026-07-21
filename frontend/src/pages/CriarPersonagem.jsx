import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import './CriarPersonagem.css'

const STEPS = ['Conceito', 'Nível da Campanha', 'Antecedente', 'Bônus do Título', 'Atributos', 'Talentos', 'Perícias', 'Finalizar']

const ATRIBUTOS = ['forca', 'agilidade', 'destreza', 'intelecto', 'presenca']

// Desenvolvimento por partes (ver Instruções do Site.md): só os títulos aqui têm o
// passo "Bônus do Título" habilitado de ponta a ponta. Os demais continuam
// selecionáveis, mas a ficha sai com os valores de Sobrevivente Básico mesmo assim,
// até serem validados e adicionados a esta lista.
const TITULOS_HABILITADOS = ['Veterano da Zona', 'Caçador de Ruínas', 'Predador do Apocalipse', 'Lenda da Zona']

const PERICIA_BONUS_SEQ = ['', '+1', '+2', '+3', '+4', '+5']

// Custos de Evolucao por Marcos Narrativos (Database/Título de Sobrevivência.docx,
// secao "Custos de Evolucao"/"Recursos Narrativos") - mesma tabela usada no painel
// "Evolução" da Ficha de Personagem (FichaPersonagem.jsx), reaproveitada aqui pro
// passo "Bazar" da criação, onde o jogador ja pode gastar os Marcos Narrativos
// iniciais concedidos pelo Título de Sobrevivência.
const CUSTOS_EVOLUCAO = {
  pv: 10,
  determinacao: 30,
  sanidade: 15,
  sanidadeTeto: 12,
  atributo: 10,
  pericia: [3, 5, 10, 15, 20],
  especializacao: 20,
  especializacaoEstagioMin: 3,
  talento: 20,
  talentosLimite: 7,
  // Item Comum / Item de Combate Extra / Item Raro NAO ficam nesta lista: em vez de
  // virar um item generico solto no inventario, eles aumentam o limite de escolhas
  // das abas "Itens Comuns" / "Item de Combate" / "Item Raro" deste mesmo passo (ver
  // itensComunsSlot/itensCombateSlot/itemRaroSlot), pra o jogador escolher um item
  // de verdade do catalogo em vez de um placeholder vago.
  itensComunsSlot: 5,
  itensCombateSlot: 10,
  itemRaroSlot: 15,
  recursos: {
    'Abrigo Seguro Temporário': 12,
    'NPC Auxiliar (Contato)': 15,
    'Veículo Pequeno (Moto)': 20,
    'Veículo Grande (Carro)': 40,
    'Munição Arma de Fogo — Pequeno (6 un.)': 5,
    'Munição Arma de Fogo — Médio (6 un.)': 10,
    'Munição Arma de Fogo — Longo (6 un.)': 20,
    'Munição Arma de Fogo — Cartucho (6 un.)': 15,
    'Munição Arma de Fogo — Pesado (6 un.)': 25,
    'Munição Arma de Disparo — Leve (5 un.)': 5,
    'Munição Arma de Disparo — Pesado (3 un.)': 5,
  },
  armaCategoria: { simples: 10, disparo: 15, fogo: 25 },
  equipamento: 15,
}

function normalizeAttr(s) {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

// Regra do capítulo "Cargas": todo item ocupa no mínimo 1 ponto de Carga,
// mesmo sem valor definido no catálogo.
function parseCarga(v) {
  const n = parseFloat(String(v ?? '').replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : 1
}

// Aplica a opção escolhida pelo jogador para um item "X ou Y" do Pacote
// Inicial (espelha _aplicar_opcao_pacote do backend, já que a escolha só é
// feita depois que o antecedente já foi resolvido no servidor). `origem`
// (Antecedente/Título/Bazar) é opcional - quando informado, fica gravado na nota
// pra aba "Prévia" poder mostrar de onde veio cada item e detectar duplicatas.
function aplicarOpcaoPacote(op, pac, origem) {
  if (op.tipo === 'protecao') {
    op.regioes.forEach(slot => { if (slot in pac.protecao) pac.protecao[slot] = op.nome })
    pac.defesa_total += op.defesa || 0
    pac.protecao_notas.push(origem ? { ...op.estruturado, _origem: origem } : op.estruturado)
  } else if (op.tipo === 'transporte') {
    op.regioes.forEach(slot => { if (slot in pac.transporte) pac.transporte[slot] = op.nome })
    pac.carga_bonus_total += op.carga_bonus || 0
    pac.transporte_notas.push(origem ? { ...op.estruturado, _origem: origem } : op.estruturado)
  } else if (op.tipo === 'item') {
    pac.itens_gerais.push(op.estruturado)
  }
}

// Extrai do texto de "Bônus Inicial" do antecedente: o bônus de atributo (fixo ou com
// escolha "X ou Y"), o bônus de Vida, e o terceiro bônus (Determinação, Sanidade,
// Defesa/CA ou um Atributo Adicional livre).
function parseAntecedenteBonus(bonusList) {
  const result = { atributoOpcoes: [], atributoValor: 0, vida: 0, extra: null }
  for (const b of (bonusList || [])) {
    const attrMatch = b.match(/^\+(\d+)\s+em\s+(.+?)\.?\s*$/i)
    if (attrMatch) {
      result.atributoValor = parseInt(attrMatch[1], 10)
      result.atributoOpcoes = attrMatch[2].split(/\s+ou\s+/i).map(normalizeAttr)
      continue
    }
    const vidaMatch = b.match(/^\+(\d+)\s+de\s+Vida\.?\s*$/i)
    if (vidaMatch) {
      result.vida = parseInt(vidaMatch[1], 10)
      continue
    }
    const valorMatch = b.match(/^\+(\d+)/)
    const valor = valorMatch ? parseInt(valorMatch[1], 10) : 1
    if (/Atributo Adicional/i.test(b)) result.extra = { tipo: 'atributo_livre', valor }
    else if (/Determina[çc][ãa]o/i.test(b)) result.extra = { tipo: 'determinacao', valor }
    else if (/Sanidade/i.test(b)) result.extra = { tipo: 'sanidade', valor }
    else if (/Defesa|\bCA\b/i.test(b)) result.extra = { tipo: 'defesa', valor }
  }
  return result
}

// Um item do PickerTitulo, com tooltip via portal (renderizado direto em
// document.body): a lista do picker é rolável (overflow-y:auto), então um tooltip
// posicionado normalmente (absolute, dentro da lista) fica cortado pelo próprio
// scroll do container - o portal escapa disso e fica sempre visível por cima.
// Popup de erro/aviso do Bazar (custo insuficiente, limite atingido etc.), no
// lugar do window.alert() nativo do navegador - mesmo visual do resto do site.
function ModalAvisoBazar({ mensagem, onFechar }) {
  if (!mensagem) return null
  return createPortal(
    <div className="criar-modal-overlay" onClick={onFechar}>
      <div className="criar-modal" onClick={e => e.stopPropagation()}>
        <p>{mensagem}</p>
        <button type="button" className="criar-modal-ok" onClick={onFechar}>OK</button>
      </div>
    </div>,
    document.body
  )
}

function ItemPicker({ nome, grupo, info, selecionado, disabled, onClick }) {
  const [tooltipPos, setTooltipPos] = useState(null)
  const btnRef = useRef(null)
  const temInfo = info.dados?.length > 0 || info.descricao || info.efeito

  const mostrarTooltip = () => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setTooltipPos({ top: rect.top, left: rect.left + rect.width / 2 })
  }

  return (
    <>
      <button ref={btnRef} type="button"
        className={`criar-escolha-btn ${selecionado ? 'selected' : ''}`}
        disabled={disabled}
        onClick={onClick}
        onMouseEnter={mostrarTooltip}
        onMouseLeave={() => setTooltipPos(null)}>
        {nome}{grupo ? <span className="criar-titulo-picker-grupo"> · {grupo.replace('Aprimoramento de ', '')}</span> : ''}
      </button>
      {tooltipPos && temInfo && createPortal(
        <div className="criar-picker-tooltip" style={{ top: tooltipPos.top, left: tooltipPos.left }}>
          <strong>{nome}</strong>
          {info.dados?.length > 0 && (
            <div className="criar-previa-item-dados">
              {info.dados.map(([label, val], i) => <span key={i}><b>{label}:</b> {val}</span>)}
            </div>
          )}
          {info.descricao && <p>{info.descricao}</p>}
          {info.efeito && <p className="criar-tal-tooltip-efeito"><span>Efeito:</span> {info.efeito}</p>}
        </div>,
        document.body
      )}
    </>
  )
}

// Bloco de escolha multipla reutilizavel para os bonus do Titulo de Sobrevivencia
// (armas/equipamentos/aprimoramentos/itens): mesma aparencia das escolhas de
// antecedente (.criar-escolha-*), mas com lista rolavel por ter muito mais opcoes.
function PickerTitulo({ titulo, itens, selecionados, max, onToggle, vazio }) {
  if (max <= 0) return null
  if (!itens.length) return <p className="criar-titulo-picker-vazio">{vazio || 'Nenhuma opção disponível.'}</p>
  return (
    <div className="criar-escolha-bloco">
      <span className="criar-escolha-label">{titulo} ({selecionados.length}/{max})</span>
      <div className="criar-titulo-picker-list">
        {itens.map(it => {
          const sel = selecionados.includes(it.nome)
          // Equipamentos vem "embrulhados" (tipo/regioes/estruturado) em vez do
          // formato plano (dados/descricao/efeito) que armas/itens/aprimoramentos já
          // usam — normaliza aqui pra tooltip funcionar igual pros dois formatos.
          const info = it.estruturado || it
          return (
            <ItemPicker key={it.nome} nome={it.nome} grupo={it.grupo} info={info}
              selecionado={sel} disabled={!sel && selecionados.length >= max} onClick={() => onToggle(it.nome)} />
          )
        })}
      </div>
    </div>
  )
}

// Bloco de leitura compacto para a aba "Prévia" (nome + dados + efeito), mesma ideia
// do NotaBloco do FichaPersonagem.jsx, só que simplificado para caber no wizard.
function PreviaItem({ item, subtitulo }) {
  if (!item) return null
  return (
    <div className="criar-previa-item">
      <div className="criar-previa-item-nome">{item.nome}</div>
      {(subtitulo || item.subtitulo) && <div className="criar-previa-item-subtitulo">{subtitulo || item.subtitulo}</div>}
      {item.dados?.length > 0 && (
        <div className="criar-previa-item-dados">
          {item.dados.map(([label, val], i) => <span key={i}><b>{label}:</b> {val}</span>)}
        </div>
      )}
      {item.efeito && <div className="criar-previa-item-efeito">{item.efeito}</div>}
    </div>
  )
}

// Seção da aba "Prévia": título + lista de PreviaItem resolvidos a partir dos nomes
// escolhidos, ou um aviso de "nada escolhido ainda" quando a categoria é opcional.
function PreviaSecao({ titulo, itens }) {
  return (
    <div className="criar-previa-secao">
      <h4>{titulo}</h4>
      {itens.length > 0 ? itens.map((it, i) => <PreviaItem key={i} item={it} />) : <p className="criar-titulo-picker-vazio">Nada escolhido ainda.</p>}
    </div>
  )
}

// Remove só a primeira ocorrência que bater no predicado (não a lista inteira) -
// usado pelo "desfazer" do Bazar quando o mesmo item foi comprado mais de uma vez.
function removerUm(arr, pred) {
  const idx = arr.findIndex(pred)
  if (idx < 0) return arr
  const copia = [...arr]
  copia.splice(idx, 1)
  return copia
}

// Reverte o efeito de uma compra do Bazar a partir do tipo/meta gravados no
// historico (ver comprarBazar) - espelho exato de cada handler comprarBazarX,
// desfazendo só o que aquela compra específica alterou.
function reverterCompraBazar(entrada, bazar) {
  const { tipo, meta } = entrada
  switch (tipo) {
    case 'pv': return { pvExtra: bazar.pvExtra - meta.valor }
    case 'determinacao': return { detComprada: false }
    case 'sanidade': return { sanExtra: Math.max(0, bazar.sanExtra - 1) }
    case 'atributo': return { atributosExtra: { ...bazar.atributosExtra, [meta.attr]: Math.max(0, (bazar.atributosExtra[meta.attr] || 0) - 1) } }
    case 'pericia': return { periciaEstagiosExtra: { ...bazar.periciaEstagiosExtra, [meta.pericia]: meta.estagioAnterior } }
    case 'especializacao': return { especializacoes: bazar.especializacoes.filter(p => p !== meta.pericia) }
    case 'talento': return { talentosComprados: removerUm(bazar.talentosComprados, t => t.nome === meta.nome) }
    case 'arma': return { armasCompradas: removerUm(bazar.armasCompradas, a => a.nome === meta.nome) }
    case 'equipamento': return { equipamentosComprados: removerUm(bazar.equipamentosComprados, e => e.nome === meta.nome) }
    case 'itensComunsSlot': return { itensComunsExtra: Math.max(0, bazar.itensComunsExtra - 1) }
    case 'itensCombateSlot': return { itensCombateExtra: Math.max(0, bazar.itensCombateExtra - 1) }
    case 'itemRaroSlot': return { itensRarosExtra: Math.max(0, bazar.itensRarosExtra - 1) }
    case 'recursoFlat': return { itensComprados: removerUm(bazar.itensComprados, i => i.nome === meta.nome) }
    default: return {}
  }
}

// Monta o item de "Munição Extra" concedido pela Lenda da Zona (6 unidades do tipo
// de munição da arma escolhida), espelhando a formula de carga de _resolve_municao
// no backend (1 ponto de carga = X unidades daquele tipo).
function criarMunicaoExtra(armaEscolhida, municoes) {
  if (!armaEscolhida) return null
  const tipoDado = armaEscolhida.dados?.find(([label]) => label === 'Munição')
  const tipoNome = tipoDado?.[1]
  if (!tipoNome) return null
  const stem = s => (s.length > 3 && /[ao]$/i.test(s)) ? s.slice(0, -1) : s
  const norm = s => normalizeAttr(s || '').trim()
  const tipo = municoes.find(m => stem(norm(m.nome)) === stem(norm(tipoNome)))
  if (!tipo) return null
  const carga = Math.max(1, Math.ceil(6 / tipo.unidades_por_ponto))
  return {
    nome: `Munição Extra (${tipoNome}) — 6 unidades`,
    carga: String(carga),
    dados: [['Carga', String(carga)]],
    descricao: `Munição solta, sem carregador ou cartucheira. 1 ponto de carga suporta até ${tipo.unidades_por_ponto} unidades deste tipo.`,
    efeito: 'Concedida pelo Título de Sobrevivência Lenda da Zona.',
  }
}

// "Tecnologia e Medicina" -> fixas: [Tecnologia, Medicina], sem escolha
// "Constituição e Atletismo ou Pilotagem" -> fixa: [Constituição], escolha: [Atletismo, Pilotagem]
function parsePericiasSecundarias(text) {
  if (!text) return { fixed: [], choice: null }
  const parts = text.split(/\s+e\s+/i).map(s => s.trim()).filter(Boolean)
  const fixed = []
  let choice = null
  if (parts[0]) fixed.push(parts[0])
  if (parts[1]) {
    if (/\s+ou\s+/i.test(parts[1])) {
      choice = parts[1].split(/\s+ou\s+/i).map(s => s.trim())
    } else {
      fixed.push(parts[1])
    }
  }
  return { fixed, choice }
}

function CriarPersonagem() {
  const [builderData, setBuilderData] = useState(null)
  const [step, setStep] = useState(0)
  const [tituloTab, setTituloTab] = useState('')
  const [bazarAtributo, setBazarAtributo] = useState('forca')
  const [bazarPericia, setBazarPericia] = useState('')
  const [bazarEspecPericia, setBazarEspecPericia] = useState('')
  const [bazarTalento, setBazarTalento] = useState('')
  const [bazarRecursoFlat, setBazarRecursoFlat] = useState(Object.keys(CUSTOS_EVOLUCAO.recursos)[0])
  const [bazarArmaCategoria, setBazarArmaCategoria] = useState('simples')
  const [bazarArmaEscolhida, setBazarArmaEscolhida] = useState('')
  const [bazarEquipEscolhido, setBazarEquipEscolhido] = useState('')
  const [erroBazar, setErroBazar] = useState('')
  const [mestreBonusInput, setMestreBonusInput] = useState('0')
  const [char, setChar] = useState({
    nome: '', idade: '', altura: '', historico: '',
    tituloSobrevivencia: 'Sobrevivente Básico',
    // Marcos Narrativos extras liberados pelo Mestre por fora do que o título
    // concede (ex.: Sobrevivente Básico não tem Marcos Narrativos fixos, mas o
    // livro deixa a critério do Mestre conceder alguns conforme o histórico do
    // personagem) - soma direto no saldo do Bazar.
    marcosExtraMestre: 0,
    // Decisões da aba "Prévia": itens (armas extra/proteção/transporte, de qualquer
    // origem) que o jogador escolheu guardar no inventário em vez de equipar, ou
    // remover de vez - chaves no formato "tipo:nome:índice" (ver gearItens).
    gearGuardado: [],
    gearRemovido: [],
    tituloEscolhas: {
      armas: [], equipamentos: [], aprimoramentos: [], itensComuns: [], itensCombate: [], itensRaros: [],
      itensEspeciaisTipo: '', itensEspeciais: [], bonusExtra: [],
    },
    antecedente: null,
    escolhaAtributoFixo: '',
    escolhaAtributoLivre: '',
    escolhaPericiaSecundaria: '',
    escolhaPacote: {},
    atributos: { forca: 0, agilidade: 0, destreza: 0, intelecto: 0, presenca: 0 },
    talentosSelecionados: [],
    periciasSelecionadas: [],
    // Compras feitas no passo "Bazar" com os Marcos Narrativos iniciais do Título -
    // ver comprarBazar() e o passo "Bazar" mais abaixo.
    bazar: {
      marcosGastos: 0, historico: [],
      pvExtra: 0, detComprada: false, sanExtra: 0,
      atributosExtra: { forca: 0, agilidade: 0, destreza: 0, intelecto: 0, presenca: 0 },
      periciaEstagiosExtra: {}, especializacoes: [],
      talentosComprados: [], armasCompradas: [], equipamentosComprados: [], itensComprados: [],
      itensComunsExtra: 0, itensCombateExtra: 0, itensRarosExtra: 0,
    },
  })
  const navigate = useNavigate()

  const handleImportFicha = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        localStorage.setItem('zona-z-ficha', JSON.stringify(data))
        navigate('/ficha')
      } catch { /* ignore */ }
    }
    reader.readAsText(file)
  }

  // Alterna um item numa lista de escolhas do bonus do Titulo (armas, equipamentos,
  // aprimoramentos, itens comuns, itens de combate, itens especiais), respeitando o
  // limite maximo de escolhas daquela categoria.
  const toggleTituloEscolha = (campo, nome, max) => {
    setChar(prev => {
      const atual = prev.tituloEscolhas[campo]
      const novo = atual.includes(nome)
        ? atual.filter(n => n !== nome)
        : (atual.length >= max ? atual : [...atual, nome])
      return { ...prev, tituloEscolhas: { ...prev.tituloEscolhas, [campo]: novo } }
    })
  }

  const setTituloEscolha = (campo, valor) => {
    setChar(prev => ({ ...prev, tituloEscolhas: { ...prev.tituloEscolhas, [campo]: valor } }))
  }

  // Bonus extra do Predador do Apocalipse: 1 escolha unica entre uma arma OU um
  // equipamento (nao os dois), guardada como [{ tipo, nome }] (lista de no maximo 1).
  const toggleBonusExtra = (tipo, nome) => {
    setChar(prev => {
      const ja = prev.tituloEscolhas.bonusExtra[0]
      const novo = (ja?.tipo === tipo && ja?.nome === nome) ? [] : [{ tipo, nome }]
      return { ...prev, tituloEscolhas: { ...prev.tituloEscolhas, bonusExtra: novo } }
    })
  }

  // Deduz o custo do saldo de Marcos Narrativos do Bazar, registra no historico
  // (com tipo/meta suficientes pra poder desfazer depois - ver
  // reverterCompraBazar) e aplica o efeito (patch de campos de char.bazar, ou uma
  // funcao (prev => patch) quando o efeito depende do estado atual) - tudo numa
  // unica atualizacao de estado. `disponiveis` e recalculado a cada render (ver
  // marcosDisponiveisCriacao).
  const comprarBazar = (disponiveis, custo, label, tipo, meta, patch) => {
    if (disponiveis < custo) {
      setErroBazar(`Essa compra custa ${custo} Marcos Narrativos, mas você só tem ${disponiveis} disponíveis.`)
      return
    }
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setChar(prev => ({
      ...prev,
      bazar: {
        ...prev.bazar,
        ...(typeof patch === 'function' ? patch(prev.bazar) : patch),
        marcosGastos: prev.bazar.marcosGastos + custo,
        historico: [...prev.bazar.historico, { id, label, custo, tipo, meta }],
      },
    }))
  }

  // Desfaz uma compra do Bazar: devolve os Marcos Narrativos e reverte o efeito
  // especifico daquela compra (ver reverterCompraBazar), a partir do tipo/meta
  // gravados no historico.
  const desfazerCompraBazar = (id) => {
    setChar(prev => {
      const entrada = prev.bazar.historico.find(h => h.id === id)
      if (!entrada) return prev
      const bazarSemEntrada = {
        ...prev.bazar,
        historico: prev.bazar.historico.filter(h => h.id !== id),
        marcosGastos: prev.bazar.marcosGastos - entrada.custo,
      }
      return { ...prev, bazar: { ...bazarSemEntrada, ...reverterCompraBazar(entrada, bazarSemEntrada) } }
    })
  }

  useEffect(() => {
    fetch('/api/builder/data')
      .then(r => r.json())
      .then(setBuilderData)
  }, [])

  if (!builderData) return <div className="loading-screen"><div className="loading-icon"></div><p className="loading-text">Carregando dados...</p></div>

  const regras = builderData.regras
  const antecedentes = builderData.antecedentes
  const selectedAnt = char.antecedente ? antecedentes.find(a => a.titulo === char.antecedente) : null

  const pontosUsados = Object.values(char.atributos).reduce((a, b) => a + b, 0)
  const pontosRestantes = regras.pontos_atributos - pontosUsados
  const periciasLivresTotal = regras.pericias_livres + (char.atributos.intelecto || 0)

  const antPericiaPrimaria = selectedAnt?.pericia_primaria || ''
  const bonusParsed = selectedAnt
    ? parseAntecedenteBonus(selectedAnt.bonus)
    : { atributoOpcoes: [], atributoValor: 0, vida: 0, extra: null }
  const secChoice = selectedAnt
    ? parsePericiasSecundarias(selectedAnt.pericias_secundarias)
    : { fixed: [], choice: null }

  const atributoFixoResolvido = bonusParsed.atributoOpcoes.includes(char.escolhaAtributoFixo)
    ? char.escolhaAtributoFixo
    : (bonusParsed.atributoOpcoes[0] || '')

  const atributoLivreResolvido = char.escolhaAtributoLivre || 'forca'

  const periciaSecResolvida = secChoice.choice
    ? (secChoice.choice.includes(char.escolhaPericiaSecundaria) ? char.escolhaPericiaSecundaria : secChoice.choice[0])
    : ''

  const periciasSecundariasFinal = [...secChoice.fixed, ...(periciaSecResolvida ? [periciaSecResolvida] : [])]
  const periciasDoAntecedente = [antPericiaPrimaria, ...periciasSecundariasFinal].filter(Boolean)

  // Bonus do Titulo de Sobrevivencia: regras + catalogo filtravel por tier
  // (ver backend/app/api/character_builder.py: _catalogo_titulo_bonus).
  const tituloBonus = builderData.titulo_bonus
  const tierAtual = builderData.titulos.indexOf(char.tituloSobrevivencia)
  const tituloHabilitado = TITULOS_HABILITADOS.includes(char.tituloSobrevivencia)
  // Sobrevivente Básico não tem bônus fixos de título (nenhuma das abas de item
  // aparece pra ele - regrasTitulo vem vazio do backend), mas ainda ganha as abas
  // Bazar/Prévia porque o livro permite ao Mestre liberar Marcos Narrativos extras
  // mesmo nesse título (ver marcosExtraMestre).
  const isBasico = char.tituloSobrevivencia === 'Sobrevivente Básico'
  const regrasTitulo = tituloBonus.regras[char.tituloSobrevivencia] || {}
  const catalogoTitulo = tituloBonus.catalogo
  const armasTitulo = catalogoTitulo.armas.filter(a => a.tier <= tierAtual)
  const equipamentosTitulo = catalogoTitulo.equipamentos.filter(e => e.tier <= tierAtual)
  const aprimoramentosMax = (regrasTitulo.aprimoramentos || 0) + (regrasTitulo.bonus_extra?.tipo === 'aprimoramentos' ? regrasTitulo.bonus_extra.qtd : 0)
  // Comprar "Slot extra" no Bazar aumenta esses limites na hora, pro jogador poder
  // escolher um item de verdade do catálogo em vez de ganhar um item genérico solto.
  const itensComunsMax = (regrasTitulo.itens_comuns || 0) + char.bazar.itensComunsExtra
  const itensCombateMax = (regrasTitulo.itens_combate || 0) + char.bazar.itensCombateExtra
  // Item Raro não tem grant fixo de título (só a Lenda da Zona tem "Item Especial"
  // fixo, com escolha entre raro/super raro - ver itensEspeciaisOpcoes) - esse aqui é
  // só o slot comprado avulso no Bazar, disponível pra qualquer título habilitado.
  const itensRarosMax = char.bazar.itensRarosExtra
  const itensEspeciaisOpcoes = regrasTitulo.itens_especiais?.opcoes || []
  const itensEspeciaisMax = itensEspeciaisOpcoes.find(o => o.tipo === char.tituloEscolhas.itensEspeciaisTipo)?.qtd || 0
  const itensEspeciaisCatalogo = char.tituloEscolhas.itensEspeciaisTipo === 'super_raro'
    ? catalogoTitulo.itens_especiais_super_raros
    : catalogoTitulo.itens_especiais_raros
  const bonusExtraPool = regrasTitulo.bonus_extra?.tipo === 'arma_ou_equipamento'
    ? [
        ...armasTitulo.map(a => ({ ...a, _tipoBonus: 'arma' })),
        ...equipamentosTitulo.map(e => ({ ...e, nome: e.nome, _tipoBonus: 'equipamento' })),
      ]
    : []

  // Abas do passo "Bônus do Título": uma por categoria ativa (max > 0), mais uma aba
  // final "Prévia" com tudo que já foi escolhido. Reconstruída a cada render porque
  // as categorias ativas mudam conforme o título escolhido no passo anterior.
  const tituloTabsDef = [
    (regrasTitulo.armas || 0) > 0 && { id: 'armas', label: 'Arma(s)', badge: `${char.tituloEscolhas.armas.length}/${regrasTitulo.armas}` },
    (regrasTitulo.equipamentos || 0) > 0 && { id: 'equipamentos', label: 'Equipamento(s)', badge: `${char.tituloEscolhas.equipamentos.length}/${regrasTitulo.equipamentos}` },
    aprimoramentosMax > 0 && { id: 'aprimoramentos', label: 'Aprimoramento(s)', badge: `${char.tituloEscolhas.aprimoramentos.length}/${aprimoramentosMax}` },
    itensComunsMax > 0 && { id: 'itensComuns', label: 'Itens Comuns', badge: `${char.tituloEscolhas.itensComuns.length}/${itensComunsMax}` },
    itensCombateMax > 0 && { id: 'itensCombate', label: 'Item de Combate', badge: `${char.tituloEscolhas.itensCombate.length}/${itensCombateMax}` },
    itensRarosMax > 0 && { id: 'itensRaros', label: 'Item Raro', badge: `${char.tituloEscolhas.itensRaros.length}/${itensRarosMax}` },
    regrasTitulo.bonus_extra?.tipo === 'arma_ou_equipamento' && { id: 'bonusExtra', label: 'Bônus Extra', badge: `${char.tituloEscolhas.bonusExtra.length}/1` },
    itensEspeciaisOpcoes.length > 0 && { id: 'itensEspeciais', label: 'Item Especial', badge: `${char.tituloEscolhas.itensEspeciais.length}/${itensEspeciaisMax}` },
  ].filter(Boolean)
  const tituloTabs = (tituloHabilitado || isBasico)
    ? [
        { id: 'bazar', label: 'Bazar', badge: char.bazar.historico.length > 0 ? `${char.bazar.historico.length}` : null },
        ...tituloTabsDef,
        { id: 'previa', label: 'Prévia da Ficha' },
      ]
    : []
  const tituloTabAtiva = tituloTabs.some(t => t.id === tituloTab) ? tituloTab : tituloTabs[0]?.id

  // Resolve os nomes escolhidos para os objetos completos do catálogo, usados na aba
  // "Prévia" (armas/equipamentos entram no gearItens unificado - ver mais abaixo).
  const aprimoramentosEscolhidosPreview = char.tituloEscolhas.aprimoramentos
    .map(nome => catalogoTitulo.aprimoramentos.find(a => a.nome === nome))
    .filter(Boolean)
    .map(ap => ({ nome: ap.nome, subtitulo: ap.grupo, efeito: ap.efeito, descricao: ap.descricao }))
  const itensComunsEscolhidosPreview = char.tituloEscolhas.itensComuns.map(nome => catalogoTitulo.itens_comuns.find(i => i.nome === nome)).filter(Boolean)
  const itensCombateEscolhidosPreview = char.tituloEscolhas.itensCombate.map(nome => catalogoTitulo.itens_combate.find(i => i.nome === nome)).filter(Boolean)
  const itensRarosEscolhidosPreview = char.tituloEscolhas.itensRaros.map(nome => catalogoTitulo.itens_especiais_raros.find(i => i.nome === nome)).filter(Boolean)
  const itensEspeciaisEscolhidosPreview = char.tituloEscolhas.itensEspeciais.map(nome => itensEspeciaisCatalogo.find(i => i.nome === nome)).filter(Boolean)

  // Bonus do Antecedente resolvidos (levantado pra fora do buildFicha porque o
  // passo "Bazar" precisa saber os valores atuais de Determinação/atributos/
  // perícias pra validar limites de compra antes da ficha final existir).
  const bonusAttrAntecedente = {}
  if (atributoFixoResolvido) {
    bonusAttrAntecedente[atributoFixoResolvido] = (bonusAttrAntecedente[atributoFixoResolvido] || 0) + bonusParsed.atributoValor
  }
  let bonusDetAntecedente = 0
  let bonusSanidadeAntecedente = 0
  let bonusDefesaAntecedente = 0
  if (bonusParsed.extra?.tipo === 'atributo_livre') {
    bonusAttrAntecedente[atributoLivreResolvido] = (bonusAttrAntecedente[atributoLivreResolvido] || 0) + bonusParsed.extra.valor
  } else if (bonusParsed.extra?.tipo === 'determinacao') {
    bonusDetAntecedente = bonusParsed.extra.valor
  } else if (bonusParsed.extra?.tipo === 'sanidade') {
    bonusSanidadeAntecedente = bonusParsed.extra.valor
  } else if (bonusParsed.extra?.tipo === 'defesa') {
    bonusDefesaAntecedente = bonusParsed.extra.valor
  }

  // Valores "atuais" do personagem em construção, já incluindo o que foi comprado
  // no Bazar - usados tanto para validar limites de compra (atributo não pode
  // passar da Determinação, Sanidade tem teto 12) quanto no buildFicha final.
  const determinacaoAtual = regras.determinacao_base + bonusDetAntecedente + (char.bazar.detComprada ? 1 : 0)
  const sanidadeAtual = Math.min(CUSTOS_EVOLUCAO.sanidadeTeto, regras.sanidade_base + bonusSanidadeAntecedente + char.bazar.sanExtra)
  const pvAtual = regras.pv_base + bonusParsed.vida + (tituloHabilitado ? (regrasTitulo.pv_bonus || 0) : 0) + char.bazar.pvExtra
  const atributosAtuais = {}
  ATRIBUTOS.forEach(a => {
    atributosAtuais[a] = char.atributos[a] + (bonusAttrAntecedente[a] || 0) + (char.bazar.atributosExtra[a] || 0)
  })

  // Bonus base de cada perícia antes de qualquer compra no Bazar (primária/
  // secundária do antecedente + escolhas livres do passo Perícias).
  const periciasBaseAtuais = {}
  ;(builderData.all_pericias || []).forEach(p => { periciasBaseAtuais[p] = '' })
  if (antPericiaPrimaria) periciasBaseAtuais[antPericiaPrimaria] = '+2'
  periciasSecundariasFinal.forEach(p => { periciasBaseAtuais[p] = '+1' })
  char.periciasSelecionadas.forEach(p => { periciasBaseAtuais[p] = '+1' })

  const marcosBaseCriacao = tituloHabilitado ? (regrasTitulo.marcos_narrativos || 0) : 0
  const marcosDisponiveisCriacao = marcosBaseCriacao + (char.marcosExtraMestre || 0) - char.bazar.marcosGastos

  // Passo "Bazar": catálogo tier-filtrado (mesmo do passo "Bônus do Título") +
  // talentos já escolhidos/possuídos, usados pros seletores de compra e limites.
  const talentosCatalogo = (builderData.talentos || []).flatMap(cat => cat.itens.map(t => ({ ...t, categoria: cat.categoria })))
  const talentosJaEscolhidos = [
    ...(selectedAnt?.talento?.nome ? [selectedAnt.talento.nome] : []),
    ...char.talentosSelecionados.map(t => t.nome),
    ...char.bazar.talentosComprados.map(t => t.nome),
  ]
  const talentosDisponiveisBazar = talentosCatalogo.filter(t => !talentosJaEscolhidos.includes(t.nome))
  // Talento exclusivo do Antecedente ou já comprado no Bazar não pode ser escolhido
  // de novo de graça no passo Talentos - mesmo motivo do bloqueio de Perícias: sem
  // isso o jogador podia "escolher" um talento que já tinha, duplicando a entrada
  // na ficha final (talentos_lista) em vez de simplesmente não ganhar nada extra.
  const talentosBloqueadosNoPasso = talentosJaEscolhidos.filter(nome => !char.talentosSelecionados.some(t => t.nome === nome))

  const estagioPericiaBazar = Math.max(PERICIA_BONUS_SEQ.indexOf(periciasBaseAtuais[bazarPericia] || ''), char.bazar.periciaEstagiosExtra[bazarPericia] || 0)
  const custoProximoPericiaBazar = CUSTOS_EVOLUCAO.pericia[estagioPericiaBazar]
  const estagioEspecPericiaBazar = Math.max(PERICIA_BONUS_SEQ.indexOf(periciasBaseAtuais[bazarEspecPericia] || ''), char.bazar.periciaEstagiosExtra[bazarEspecPericia] || 0)
  const armasDisponiveisBazar = armasTitulo.filter(a => a.categoria_arma === bazarArmaCategoria)

  // -------- Compras do Bazar (Marcos Narrativos iniciais do Título) --------
  // Marcos Narrativos extras liberados pelo Mestre (ex.: Sobrevivente Básico, que
  // não tem Marcos fixos, mas o livro deixa a critério do Mestre conceder alguns).
  // Fica num campo separado do "Comprar" pra não confundir com uma compra - só
  // confirma quando o Mestre clicar OK.
  const confirmarMestreBonus = () => {
    const valor = Math.max(0, parseInt(mestreBonusInput, 10) || 0)
    setChar(prev => ({ ...prev, marcosExtraMestre: valor }))
  }

  const comprarBazarPV = (fixo) => {
    const valor = fixo ? 6 : Math.max(4, Math.floor(Math.random() * 10) + 1)
    comprarBazar(marcosDisponiveisCriacao, CUSTOS_EVOLUCAO.pv, `+${valor} PV (${fixo ? 'fixo' : '1d10'})`, 'pv', { valor }, prev => ({ pvExtra: prev.pvExtra + valor }))
  }

  const comprarBazarDeterminacao = () => comprarBazar(marcosDisponiveisCriacao, CUSTOS_EVOLUCAO.determinacao, '+1 Determinação Máxima', 'determinacao', {}, { detComprada: true })

  const comprarBazarSanidade = () => comprarBazar(marcosDisponiveisCriacao, CUSTOS_EVOLUCAO.sanidade, '+1 Sanidade Máxima', 'sanidade', {}, prev => ({ sanExtra: prev.sanExtra + 1 }))

  const comprarBazarAtributo = () => {
    if (atributosAtuais[bazarAtributo] + 1 > determinacaoAtual) {
      setErroBazar('Nenhum atributo pode ultrapassar o valor atual de Determinação.')
      return
    }
    comprarBazar(marcosDisponiveisCriacao, CUSTOS_EVOLUCAO.atributo, `+1 ${bazarAtributo}`, 'atributo', { attr: bazarAtributo }, prev => ({
      atributosExtra: { ...prev.atributosExtra, [bazarAtributo]: (prev.atributosExtra[bazarAtributo] || 0) + 1 },
    }))
  }

  const evoluirPericiaBazar = () => {
    if (estagioPericiaBazar >= 5 || !bazarPericia) return
    const estagioExtraAnterior = char.bazar.periciaEstagiosExtra[bazarPericia] || 0
    const novoEstagio = estagioPericiaBazar + 1
    comprarBazar(marcosDisponiveisCriacao, custoProximoPericiaBazar, `Perícia ${bazarPericia} → ${PERICIA_BONUS_SEQ[novoEstagio]}`,
      'pericia', { pericia: bazarPericia, estagioAnterior: estagioExtraAnterior }, prev => ({
        periciaEstagiosExtra: { ...prev.periciaEstagiosExtra, [bazarPericia]: novoEstagio },
      }))
  }

  const comprarEspecializacaoBazar = () => {
    if (!bazarEspecPericia) return
    if (char.bazar.especializacoes.includes(bazarEspecPericia)) {
      setErroBazar('Essa perícia já tem uma Especialização (cada perícia só pode ter uma).')
      return
    }
    if (estagioEspecPericiaBazar < CUSTOS_EVOLUCAO.especializacaoEstagioMin) {
      setErroBazar('A perícia precisa estar pelo menos no 3º estágio (+3) para receber Especialização.')
      return
    }
    if (char.bazar.especializacoes.length >= determinacaoAtual) {
      setErroBazar(`O número de Especializações é limitado pelo valor atual de Determinação (${determinacaoAtual}).`)
      return
    }
    comprarBazar(marcosDisponiveisCriacao, CUSTOS_EVOLUCAO.especializacao, `Especialização em ${bazarEspecPericia}`,
      'especializacao', { pericia: bazarEspecPericia }, prev => ({
        especializacoes: [...prev.especializacoes, bazarEspecPericia],
      }))
  }

  const comprarTalentoBazar = () => {
    const t = talentosDisponiveisBazar.find(x => x.nome === bazarTalento)
    if (!t) return
    if (talentosJaEscolhidos.length >= CUSTOS_EVOLUCAO.talentosLimite) {
      setErroBazar(`Limite de ${CUSTOS_EVOLUCAO.talentosLimite} talentos atingido.`)
      return
    }
    comprarBazar(marcosDisponiveisCriacao, CUSTOS_EVOLUCAO.talento, `Talento: ${t.nome}`, 'talento', { nome: t.nome }, prev => ({
      talentosComprados: [...prev.talentosComprados, t],
    }))
  }

  const comprarItensComunsSlotBazar = () => comprarBazar(marcosDisponiveisCriacao, CUSTOS_EVOLUCAO.itensComunsSlot, 'Slot extra: Itens Comuns', 'itensComunsSlot', {}, prev => ({
    itensComunsExtra: prev.itensComunsExtra + 1,
  }))

  const comprarItensCombateSlotBazar = () => comprarBazar(marcosDisponiveisCriacao, CUSTOS_EVOLUCAO.itensCombateSlot, 'Slot extra: Item de Combate', 'itensCombateSlot', {}, prev => ({
    itensCombateExtra: prev.itensCombateExtra + 1,
  }))

  const comprarItemRaroSlotBazar = () => comprarBazar(marcosDisponiveisCriacao, CUSTOS_EVOLUCAO.itemRaroSlot, 'Slot extra: Item Raro', 'itemRaroSlot', {}, prev => ({
    itensRarosExtra: prev.itensRarosExtra + 1,
  }))

  const comprarRecursoFlatBazar = () => {
    const custo = CUSTOS_EVOLUCAO.recursos[bazarRecursoFlat]
    comprarBazar(marcosDisponiveisCriacao, custo, bazarRecursoFlat, 'recursoFlat', { nome: bazarRecursoFlat }, prev => ({
      itensComprados: [...prev.itensComprados, { nome: bazarRecursoFlat, carga: '', dados: [['Custo', `${custo} MN`]], descricao: '', efeito: '' }],
    }))
  }

  const comprarArmaBazar = () => {
    const arma = armasDisponiveisBazar.find(a => a.nome === bazarArmaEscolhida)
    if (!arma) return
    comprarBazar(marcosDisponiveisCriacao, CUSTOS_EVOLUCAO.armaCategoria[bazarArmaCategoria], `Arma (Bazar): ${arma.nome}`, 'arma', { nome: arma.nome }, prev => ({
      armasCompradas: [...prev.armasCompradas, arma],
    }))
  }

  const comprarEquipamentoBazar = () => {
    const eq = equipamentosTitulo.find(e => e.nome === bazarEquipEscolhido)
    if (!eq) return
    comprarBazar(marcosDisponiveisCriacao, CUSTOS_EVOLUCAO.equipamento, `Equipamento (Bazar): ${eq.nome}`, 'equipamento', { nome: eq.nome }, prev => ({
      equipamentosComprados: [...prev.equipamentosComprados, eq],
    }))
  }

  // Resolve o pacote do Antecedente + bônus do Título + compras do Bazar num único
  // pac/armasExtraLista/aprimoramentosLista, com cada nota de proteção/transporte e
  // cada arma extra marcada com _origem (Antecedente/Título/Bazar). Usado tanto pela
  // aba "Prévia" (pra revisar/guardar/remover antes de gerar a ficha) quanto pelo
  // buildFicha final - mesma resolução, sem duplicar a lógica.
  const resolverEquipamentoBase = () => {
    const pacOriginal = selectedAnt?.pacote_estruturado || {
      arma: null, kit: null,
      protecao: { cabeca: '', tronco: '', msup: '', minf: '' },
      transporte: { tronco: '', msup: '', minf: '' },
      itens_gerais: [], defesa_total: 0, carga_bonus_total: 0,
      protecao_notas: [], transporte_notas: [], escolhas: [],
    }
    // Clona os campos que a escolha do jogador (item "X ou Y" do Pacote
    // Inicial) pode alterar, para nao mutar os dados vindos da API.
    const pac = {
      ...pacOriginal,
      protecao: { ...pacOriginal.protecao },
      transporte: { ...pacOriginal.transporte },
      protecao_notas: (pacOriginal.protecao_notas || []).map(n => ({ ...n, _origem: 'Antecedente' })),
      transporte_notas: (pacOriginal.transporte_notas || []).map(n => ({ ...n, _origem: 'Antecedente' })),
      itens_gerais: [...(pacOriginal.itens_gerais || [])],
    }
    ;(pacOriginal.escolhas || []).forEach(esc => {
      const escolhaNome = char.escolhaPacote[esc.texto]
      const op = esc.opcoes.find(o => o.nome === escolhaNome) || esc.opcoes[0]
      aplicarOpcaoPacote(op, pac, 'Antecedente')
    })

    // Bonus do Titulo de Sobrevivencia: armas/equipamentos do catalogo filtrado por
    // tier, aprimoramentos, itens comuns/combate/especiais e o bonus extra do
    // Predador/Lenda. So aplicado para titulos em TITULOS_HABILITADOS (ver comentario
    // no topo do arquivo) - os demais geram a ficha com valores de Sobrevivente
    // Basico mesmo que um titulo avancado tenha sido selecionado, enquanto esse
    // titulo ainda nao foi validado. Equipamentos reaproveitam aplicarOpcaoPacote
    // (mesma logica de defesa/carga/regioes do Pacote Inicial).
    const armasExtraLista = []
    const aprimoramentosLista = []
    // Sobrevivente Básico não tem grants fixos (regrasTitulo vazio), mas pode ter
    // comprado slots de Itens Comuns/Combate/Raros no Bazar (ver isBasico no passo
    // "Bônus do Título") - por isso o guard inclui isBasico, não só tituloHabilitado.
    if (tituloHabilitado || isBasico) {
      char.tituloEscolhas.armas.forEach(nome => {
        const arma = armasTitulo.find(a => a.nome === nome)
        if (arma) armasExtraLista.push({ ...arma, _origem: 'Título', subtitulo: 'Título de Sobrevivência' })
      })
      char.tituloEscolhas.equipamentos.forEach(nome => {
        const eq = equipamentosTitulo.find(e => e.nome === nome)
        if (eq) aplicarOpcaoPacote(eq, pac, 'Título')
      })
      char.tituloEscolhas.aprimoramentos.forEach(nome => {
        const ap = catalogoTitulo.aprimoramentos.find(a => a.nome === nome)
        if (ap) aprimoramentosLista.push({ nome: ap.nome, subtitulo: ap.grupo, descricao: ap.descricao, efeito: ap.efeito })
      })
      char.tituloEscolhas.itensComuns.forEach(nome => {
        const item = catalogoTitulo.itens_comuns.find(i => i.nome === nome)
        if (item) pac.itens_gerais.push(item)
      })
      char.tituloEscolhas.itensCombate.forEach(nome => {
        const item = catalogoTitulo.itens_combate.find(i => i.nome === nome)
        if (item) pac.itens_gerais.push(item)
      })
      char.tituloEscolhas.itensRaros.forEach(nome => {
        const item = catalogoTitulo.itens_especiais_raros.find(i => i.nome === nome)
        if (item) pac.itens_gerais.push(item)
      })
      char.tituloEscolhas.itensEspeciais.forEach(nome => {
        const item = itensEspeciaisCatalogo.find(i => i.nome === nome)
        if (item) pac.itens_gerais.push(item)
      })
      const bonusExtraEscolha = char.tituloEscolhas.bonusExtra[0]
      if (bonusExtraEscolha?.tipo === 'arma') {
        const arma = armasTitulo.find(a => a.nome === bonusExtraEscolha.nome)
        if (arma) armasExtraLista.push({ ...arma, _origem: 'Título', subtitulo: 'Título de Sobrevivência (bônus)' })
      } else if (bonusExtraEscolha?.tipo === 'equipamento') {
        const eq = equipamentosTitulo.find(e => e.nome === bonusExtraEscolha.nome)
        if (eq) aplicarOpcaoPacote(eq, pac, 'Título')
      }
      if (regrasTitulo.municao_extra > 0) {
        const armaDoTitulo = armasExtraLista.find(a => a._origem === 'Título' && char.tituloEscolhas.armas.includes(a.nome))
        const municaoItem = armaDoTitulo && criarMunicaoExtra(armaDoTitulo, catalogoTitulo.municoes)
        if (municaoItem) pac.itens_gerais.push(municaoItem)
      }
    }

    // Compras do passo "Bazar" (Marcos Narrativos do Título gastos durante a
    // criação): mesma lógica de aplicação de armas/equipamentos/itens acima.
    armasExtraLista.push(...char.bazar.armasCompradas.map(a => ({ ...a, _origem: 'Bazar', subtitulo: 'Bazar' })))
    char.bazar.equipamentosComprados.forEach(eq => aplicarOpcaoPacote(eq, pac, 'Bazar'))
    pac.itens_gerais.push(...char.bazar.itensComprados)

    return { pac, armasExtraLista, aprimoramentosLista }
  }

  // Lista unificada de armas extra + proteção + transporte (qualquer origem), usada
  // pra aba "Prévia" mostrar tudo num só lugar e sinalizar duplicatas (mesmo nome
  // vindo de origens diferentes - ex.: Antecedente E Bazar concedendo a mesma peça).
  const { pac: pacPreview, armasExtraLista: armasExtraPreview } = resolverEquipamentoBase()
  const gearItens = [
    ...armasExtraPreview.map((a, i) => ({ key: `arma:${a.nome}:${i}`, tipo: 'arma', item: a, origem: a._origem })),
    ...pacPreview.protecao_notas.map((n, i) => ({ key: `protecao:${n.nome}:${i}`, tipo: 'protecao', item: n, origem: n._origem })),
    ...pacPreview.transporte_notas.map((n, i) => ({ key: `transporte:${n.nome}:${i}`, tipo: 'transporte', item: n, origem: n._origem })),
  ]
  const gearContagemNomes = gearItens.reduce((acc, g) => { acc[g.item.nome] = (acc[g.item.nome] || 0) + 1; return acc }, {})

  const toggleGuardarGear = (key) => setChar(prev => ({
    ...prev,
    gearGuardado: prev.gearGuardado.includes(key) ? prev.gearGuardado.filter(k => k !== key) : [...prev.gearGuardado, key],
    gearRemovido: prev.gearRemovido.filter(k => k !== key),
  }))
  const removerGear = (key) => setChar(prev => ({
    ...prev,
    gearRemovido: prev.gearRemovido.includes(key) ? prev.gearRemovido.filter(k => k !== key) : [...prev.gearRemovido, key],
    gearGuardado: prev.gearGuardado.filter(k => k !== key),
  }))

  const buildFicha = () => {
    const bonusDefesa = bonusDefesaAntecedente
    const { pac, armasExtraLista: armasExtraListaBase, aprimoramentosLista } = resolverEquipamentoBase()

    // Aplica as decisões da aba "Prévia" (guardar no inventário em vez de
    // equipar, ou remover de vez) sobre o equipamento já resolvido - usa as mesmas
    // chaves (tipo:nome:índice) que a aba usa pra cada item.
    const guardadoSet = new Set(char.gearGuardado)
    const removidoSet = new Set(char.gearRemovido)
    const armasExtraLista = []
    armasExtraListaBase.forEach((a, i) => {
      const key = `arma:${a.nome}:${i}`
      if (removidoSet.has(key)) return
      if (guardadoSet.has(key)) { pac.itens_gerais.push(a); return }
      armasExtraLista.push(a)
    })
    ;['protecao', 'transporte'].forEach(tipo => {
      const campo = `${tipo}_notas`
      const slots = pac[tipo]
      pac[campo] = pac[campo].filter((nota, i) => {
        const key = `${tipo}:${nota.nome}:${i}`
        if (!removidoSet.has(key) && !guardadoSet.has(key)) return true
        Object.keys(slots).forEach(slot => { if (slots[slot] === nota.nome) slots[slot] = '' })
        const opOriginal = catalogoTitulo.equipamentos.find(e => e.nome === nota.nome)
        if (opOriginal) {
          if (tipo === 'protecao') pac.defesa_total -= (opOriginal.defesa || 0)
          else pac.carga_bonus_total -= (opOriginal.carga_bonus || 0)
        }
        if (guardadoSet.has(key)) pac.itens_gerais.push(nota)
        return false
      })
    })

    const det = determinacaoAtual
    const pv = pvAtual
    const sanidade = sanidadeAtual
    const ca = regras.ca_base + bonusDefesa + pac.defesa_total
    const forcaFinal = atributosAtuais.forca

    const armaNome = pac.arma?.nome || pac.kit?.arma || ''
    const armaCarga = pac.arma?.carga || ''

    // Carga Atual: armas sempre consomem, itens do inventário (inclusive kits)
    // consomem no mínimo 1 cada; proteção/transporte equipados não consomem
    // (regra do capítulo "Cargas" — só ocupam carga se estiverem soltos no inventário).
    const cargaArmaTotal = pac.arma ? parseCarga(pac.arma.carga) : 0
    const cargaKitTotal = pac.kit ? parseCarga(pac.kit.carga) : 0
    const cargaItensGeraisTotal = pac.itens_gerais.reduce((sum, i) => sum + parseCarga(i.carga), 0)
    const cargaAtualTotal = cargaArmaTotal + cargaKitTotal + cargaItensGeraisTotal
    const arma1Estruturada = pac.arma
      ? { ...pac.arma, subtitulo: pac.kit ? `Componente do ${pac.kit.nome}` : (pac.arma.subtitulo || '') }
      : (pac.kit?.arma
          ? { nome: pac.kit.arma, subtitulo: `Componente do ${pac.kit.nome}`, dados: [], descricao: '', efeito: '' }
          : null)

    const talentosLista = []
    if (selectedAnt?.talento?.nome) {
      talentosLista.push({
        nome: selectedAnt.talento.nome,
        subtitulo: selectedAnt.talento.tipo,
        descricao: selectedAnt.talento.descricao,
        efeito: selectedAnt.talento.efeito,
        exclusivo: true,
      })
    }
    char.talentosSelecionados.forEach(t => {
      talentosLista.push({
        nome: t.nome,
        subtitulo: t.tipo,
        descricao: t.descricao,
        efeito: t.efeito,
        exclusivo: false,
      })
    })
    char.bazar.talentosComprados.forEach(t => {
      talentosLista.push({ nome: t.nome, subtitulo: t.tipo, descricao: t.descricao, efeito: t.efeito, exclusivo: false })
    })

    const ficha = {
      nome: char.nome, profissao: selectedAnt?.titulo || '', idade: char.idade,
      titulo_sobrevivencia: char.tituloSobrevivencia,
      altura: char.altura, deslocamento: `${regras.movimento_base}m`, observacoes: '', historico: char.historico,
      forca_atual: '',
      forca_max: String(atributosAtuais.forca),
      agilidade_atual: '',
      agilidade_max: String(atributosAtuais.agilidade),
      destreza_atual: '',
      destreza_max: String(atributosAtuais.destreza),
      intelecto_atual: '',
      intelecto_max: String(atributosAtuais.intelecto),
      presenca_atual: '',
      presenca_max: String(atributosAtuais.presenca),
      infeccao_atual: '', infeccao_max: String(regras.resistencia_infeccao),
      pv_atual: '', pv_max: String(pv),
      determinacao_atual: '', determinacao_max: String(det),
      determinacao_comprada: char.bazar.detComprada,
      sanidade_atual: '', sanidade_max: String(sanidade),
      ca_atual: String(ca), ca_bonus: '', ca_obs: '', descricoes: '',
      arma1_nome: armaNome, arma1_carga: String(armaCarga), arma1_estruturada: arma1Estruturada,
      arma2_nome: '', arma2_carga: '', arma2_notas: '',
      armas_extra_lista: armasExtraLista,
      aprimoramentos_lista: aprimoramentosLista,
      marcos_narrativos_atual: String(Math.max(0, marcosDisponiveisCriacao)),
      historico_evolucao: char.bazar.historico,
      protecao_cabeca: pac.protecao.cabeca, protecao_tronco: pac.protecao.tronco,
      protecao_msup: pac.protecao.msup, protecao_minf: pac.protecao.minf,
      protecao_notas: pac.protecao_notas,
      transporte_tronco: pac.transporte.tronco, transporte_msup: pac.transporte.msup,
      transporte_minf: pac.transporte.minf,
      transporte_notas: pac.transporte_notas,
      carga_atual: String(cargaAtualTotal), carga_max: String(10 + forcaFinal * 5 + pac.carga_bonus_total),
      itens_gerais_lista: pac.itens_gerais,
      inventario: '',
      kit_estruturado: pac.kit,
      talento_exclusivo: '',
      talentos_lista: talentosLista,
      talentos_obs: '',
      anotacoes: '',
    }

    const pericias = {}
    builderData.all_pericias.forEach(p => { pericias[p] = { bonus: '', nv: '', esp: '' } })
    Object.keys(periciasBaseAtuais).forEach(p => {
      const estagioBase = PERICIA_BONUS_SEQ.indexOf(periciasBaseAtuais[p])
      const estagioFinal = Math.max(estagioBase, char.bazar.periciaEstagiosExtra[p] || 0)
      if (estagioFinal > 0 && pericias[p]) pericias[p].bonus = PERICIA_BONUS_SEQ[estagioFinal]
    })
    char.bazar.especializacoes.forEach(p => {
      if (pericias[p]) pericias[p].esp = 'Especialização (defina o foco)'
    })

    const data = { ficha, pericias, periciasObs: '' }

    localStorage.setItem('zona-z-ficha', JSON.stringify(data))
    navigate('/ficha')
  }

  return (
    <div className="criar-page">
      <ModalAvisoBazar mensagem={erroBazar} onFechar={() => setErroBazar('')} />
      <div className="criar-hero">
        <h1 className="criar-title">Criar Personagem</h1>
        <p className="criar-subtitle">Passo a passo para montar seu sobrevivente</p>
        <label className="criar-import-btn">
          Importar Ficha (JSON)
          <input type="file" accept=".json" onChange={handleImportFicha} hidden />
        </label>
      </div>

      {/* STEPPER */}
      <div className="criar-stepper">
        {STEPS.map((s, i) => (
          <div key={i} className={`criar-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
            <span className="criar-step-num">{i + 1}</span>
            <span className="criar-step-label">{s}</span>
          </div>
        ))}
      </div>

      <div className="criar-content">
        {/* STEP 0: Conceito */}
        {step === 0 && (
          <div className="criar-panel">
            <h2>Conceito do Personagem</h2>
            <p className="criar-desc">Defina quem é o seu sobrevivente neste mundo devastado.</p>
            <div className="criar-form">
              <label><span>Nome do Personagem</span><input value={char.nome} onChange={e => setChar({...char, nome: e.target.value})} placeholder="Ex: Rafael 'Lobo' Silva" /></label>
              <div className="criar-row">
                <label><span>Idade</span><input value={char.idade} onChange={e => setChar({...char, idade: e.target.value})} placeholder="Ex: 32" /></label>
                <label><span>Altura</span><input value={char.altura} onChange={e => setChar({...char, altura: e.target.value})} placeholder="Ex: 1.78m" /></label>
              </div>
              <label><span>Histórico / Características</span><textarea rows="3" value={char.historico} onChange={e => setChar({...char, historico: e.target.value})} placeholder="Quem era antes do colapso? O que o move?" /></label>
            </div>
          </div>
        )}

        {/* STEP 1: Nível da Campanha / Título de Sobrevivência */}
        {step === 1 && (
          <div className="criar-panel">
            <h2>Nível da Campanha</h2>
            <p className="criar-desc">O Mestre define o Título de Sobrevivência inicial do grupo. Ele reflete o quanto os personagens já provaram na Zona e concede vantagens iniciais adicionais de acesso a armas, equipamentos e recursos.</p>
            <div className="criar-titulo-grid">
              {builderData.titulos.map((tit, i) => {
                const isBasico = tit === 'Sobrevivente Básico'
                const habilitado = TITULOS_HABILITADOS.includes(tit)
                const selected = char.tituloSobrevivencia === tit
                const r = tituloBonus.regras[tit] || {}
                return (
                  <button key={i}
                    className={`criar-titulo-card ${selected ? 'selected' : ''}`}
                    onClick={() => setChar({...char, tituloSobrevivencia: tit})}>
                    <span className="criar-titulo-name">{tit}</span>
                    <span className={`criar-titulo-tag ${isBasico ? 'basico' : habilitado ? 'basico' : 'pendente'}`}>
                      {isBasico ? 'Valores base do passo a passo' : habilitado ? `+${r.pv_bonus} PV · ${r.marcos_narrativos} Marcos Narrativos` : 'Em desenvolvimento'}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="criar-desc" style={{ marginTop: '1rem' }}>Os bônus de equipamento do título escolhido são definidos no próximo passo.</p>
          </div>
        )}

        {/* STEP 2: Antecedente */}
        {step === 2 && (
          <div className="criar-panel">
            <h2>Escolha seu Antecedente</h2>
            <p className="criar-desc">O antecedente define quem seu personagem era antes do apocalipse.</p>
            <div className="criar-ant-grid">
              {antecedentes.map((ant, i) => (
                <button key={i}
                  className={`criar-ant-card ${char.antecedente === ant.titulo ? 'selected' : ''}`}
                  onClick={() => setChar({...char, antecedente: ant.titulo})}>
                  {ant.icone && <img src={`/api/img/${ant.icone}`} alt="" className="criar-ant-icon" />}
                  <span className="criar-ant-name">{ant.titulo}</span>
                  {char.antecedente === ant.titulo && <span className="criar-ant-check">&#x2713;</span>}
                </button>
              ))}
            </div>
            {selectedAnt && (
              <div className="criar-ant-detail">
                <h3>{selectedAnt.titulo}</h3>
                <p className="criar-ant-desc">{selectedAnt.descricao?.[0]?.substring(0, 200)}...</p>
                <div className="criar-ant-info">
                  <div><h4>Bônus Inicial</h4><ul>{selectedAnt.bonus.map((b, i) => <li key={i}>{b}</li>)}</ul></div>
                  <div><h4>Perícias</h4><p>Primária (+2): {selectedAnt.pericia_primaria}</p><p>Secundárias (+1): {selectedAnt.pericias_secundarias}</p></div>
                  <div><h4>Talento Exclusivo</h4><p>{selectedAnt.talento?.nome}</p></div>
                </div>

                {(bonusParsed.atributoOpcoes.length > 1 || bonusParsed.extra?.tipo === 'atributo_livre' || secChoice.choice || selectedAnt.pacote_estruturado?.escolhas?.length > 0) && (
                  <div className="criar-ant-escolhas">
                    <h4>Escolhas do Antecedente</h4>

                    {bonusParsed.atributoOpcoes.length > 1 && (
                      <div className="criar-escolha-bloco">
                        <span className="criar-escolha-label">Atributo do bônus (+{bonusParsed.atributoValor})</span>
                        <div className="criar-escolha-opcoes">
                          {bonusParsed.atributoOpcoes.map(op => (
                            <button key={op}
                              className={`criar-escolha-btn ${atributoFixoResolvido === op ? 'selected' : ''}`}
                              onClick={() => setChar({...char, escolhaAtributoFixo: op})}>
                              {op.charAt(0).toUpperCase() + op.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {bonusParsed.extra?.tipo === 'atributo_livre' && (
                      <div className="criar-escolha-bloco">
                        <span className="criar-escolha-label">Atributo Adicional (+{bonusParsed.extra.valor})</span>
                        <div className="criar-escolha-opcoes">
                          {ATRIBUTOS.map(op => (
                            <button key={op}
                              className={`criar-escolha-btn ${atributoLivreResolvido === op ? 'selected' : ''}`}
                              onClick={() => setChar({...char, escolhaAtributoLivre: op})}>
                              {op.charAt(0).toUpperCase() + op.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {secChoice.choice && (
                      <div className="criar-escolha-bloco">
                        <span className="criar-escolha-label">Perícia secundária</span>
                        <div className="criar-escolha-opcoes">
                          {secChoice.choice.map(op => (
                            <button key={op}
                              className={`criar-escolha-btn ${periciaSecResolvida === op ? 'selected' : ''}`}
                              onClick={() => setChar({...char, escolhaPericiaSecundaria: op})}>
                              {op}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {(selectedAnt.pacote_estruturado?.escolhas || []).map((esc, i) => {
                      const resolvido = char.escolhaPacote[esc.texto] || esc.opcoes[0].nome
                      return (
                        <div key={i} className="criar-escolha-bloco">
                          <span className="criar-escolha-label">Pacote Inicial: {esc.texto}</span>
                          <div className="criar-escolha-opcoes">
                            {esc.opcoes.map(op => (
                              <button key={op.nome}
                                className={`criar-escolha-btn ${resolvido === op.nome ? 'selected' : ''}`}
                                onClick={() => setChar({...char, escolhaPacote: {...char.escolhaPacote, [esc.texto]: op.nome}})}>
                                {op.nome}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Bônus do Título de Sobrevivência */}
        {step === 3 && (
          <div className="criar-panel">
            <h2>Bônus do Título — {char.tituloSobrevivencia}</h2>

            {isBasico && (
              <p className="criar-desc">Sobrevivente Básico não recebe itens ou bônus fixos além do que o Antecedente já concede. O livro deixa a critério do Mestre liberar Marcos Narrativos extras ou itens iniciais conforme o histórico do personagem — use a aba "Bazar" abaixo se for o caso.</p>
            )}

            {!isBasico && !tituloHabilitado && (
              <p className="criar-titulo-aviso">
                O título <strong>{char.tituloSobrevivencia}</strong> ainda está em desenvolvimento nesta versão do site — a ficha será gerada com os valores base de <strong>Sobrevivente Básico</strong> mesmo assim. O nome do título fica registrado na ficha para referência do Mestre.
              </p>
            )}

            {(tituloHabilitado || isBasico) && (
              <>
                {!isBasico && <p className="criar-desc">Escolha os itens e bônus concedidos por este título. Armas e equipamentos são limitados ao nível do título ou menor.</p>}

                <div className="criar-titulo-tabs">
                  {tituloTabs.map(t => (
                    <button key={t.id} type="button"
                      className={`criar-titulo-tab ${tituloTabAtiva === t.id ? 'active' : ''}`}
                      onClick={() => setTituloTab(t.id)}>
                      {t.label}{t.badge && <span className="criar-titulo-tab-badge">{t.badge}</span>}
                    </button>
                  ))}
                </div>

                <div className="criar-titulo-tab-content">
                  {tituloTabAtiva === 'armas' && (
                    <PickerTitulo titulo="Arma(s) do Título" itens={armasTitulo} selecionados={char.tituloEscolhas.armas} max={regrasTitulo.armas || 0}
                      onToggle={nome => toggleTituloEscolha('armas', nome, regrasTitulo.armas || 0)} />
                  )}

                  {tituloTabAtiva === 'equipamentos' && (
                    <PickerTitulo titulo="Equipamento(s) do Título" itens={equipamentosTitulo} selecionados={char.tituloEscolhas.equipamentos} max={regrasTitulo.equipamentos || 0}
                      onToggle={nome => toggleTituloEscolha('equipamentos', nome, regrasTitulo.equipamentos || 0)} />
                  )}

                  {tituloTabAtiva === 'aprimoramentos' && (
                    <PickerTitulo titulo="Aprimoramento(s)" itens={catalogoTitulo.aprimoramentos} selecionados={char.tituloEscolhas.aprimoramentos} max={aprimoramentosMax}
                      onToggle={nome => toggleTituloEscolha('aprimoramentos', nome, aprimoramentosMax)} />
                  )}

                  {tituloTabAtiva === 'itensComuns' && (
                    <PickerTitulo titulo="Itens Comuns (até)" itens={catalogoTitulo.itens_comuns} selecionados={char.tituloEscolhas.itensComuns} max={itensComunsMax}
                      onToggle={nome => toggleTituloEscolha('itensComuns', nome, itensComunsMax)} />
                  )}

                  {tituloTabAtiva === 'itensCombate' && (
                    <PickerTitulo titulo="Item(ns) de Combate (Granada ou Armadilha)" itens={catalogoTitulo.itens_combate} selecionados={char.tituloEscolhas.itensCombate} max={itensCombateMax}
                      onToggle={nome => toggleTituloEscolha('itensCombate', nome, itensCombateMax)} />
                  )}

                  {tituloTabAtiva === 'itensRaros' && (
                    <PickerTitulo titulo="Item(ns) Raro(s)" itens={catalogoTitulo.itens_especiais_raros} selecionados={char.tituloEscolhas.itensRaros} max={itensRarosMax}
                      onToggle={nome => toggleTituloEscolha('itensRaros', nome, itensRarosMax)} />
                  )}

                  {tituloTabAtiva === 'bonusExtra' && (
                    <div className="criar-escolha-bloco">
                      <span className="criar-escolha-label">Bônus: 1 Arma ou Equipamento adicional ({char.tituloEscolhas.bonusExtra.length}/1)</span>
                      <div className="criar-titulo-picker-list">
                        {bonusExtraPool.map(it => {
                          const sel = char.tituloEscolhas.bonusExtra[0]?.nome === it.nome && char.tituloEscolhas.bonusExtra[0]?.tipo === it._tipoBonus
                          return (
                            <ItemPicker key={`${it._tipoBonus}-${it.nome}`} nome={it.nome} grupo={it._tipoBonus} info={it.estruturado || it}
                              selecionado={sel} disabled={!sel && char.tituloEscolhas.bonusExtra.length >= 1}
                              onClick={() => toggleBonusExtra(it._tipoBonus, it.nome)} />
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {tituloTabAtiva === 'itensEspeciais' && (
                    <div className="criar-escolha-bloco">
                      <span className="criar-escolha-label">Item de Especiais</span>
                      <div className="criar-escolha-opcoes">
                        {itensEspeciaisOpcoes.map(op => (
                          <button key={op.tipo} type="button"
                            className={`criar-escolha-btn ${char.tituloEscolhas.itensEspeciaisTipo === op.tipo ? 'selected' : ''}`}
                            onClick={() => setChar(prev => ({ ...prev, tituloEscolhas: { ...prev.tituloEscolhas, itensEspeciaisTipo: op.tipo, itensEspeciais: [] } }))}>
                            {op.qtd} {op.tipo === 'raro' ? 'Raro(s)' : 'Super Raro(s)'}
                          </button>
                        ))}
                      </div>
                      {char.tituloEscolhas.itensEspeciaisTipo && (
                        <PickerTitulo titulo="Escolha o(s) item(ns)" itens={itensEspeciaisCatalogo} selecionados={char.tituloEscolhas.itensEspeciais} max={itensEspeciaisMax}
                          onToggle={nome => toggleTituloEscolha('itensEspeciais', nome, itensEspeciaisMax)} />
                      )}
                    </div>
                  )}

                  {tituloTabAtiva === 'bazar' && (
                    <div className="criar-bazar-titulo">
                      <p className="criar-desc">Gaste os Marcos Narrativos concedidos por este título em atributos, perícias, talentos, armas, equipamentos e outros recursos — o mesmo sistema de "Evolução do Personagem" usado depois, em campanha.</p>
                      <p className="criar-evo-nota">Atributos, perícias e talentos aqui contam a partir do que o Antecedente já concede — o que você ainda vai escolher nos passos Atributos/Talentos/Perícias se soma por cima depois. Evite comprar aqui uma perícia ou talento que você já pretende pegar de graça mais adiante.</p>

                      <div className="criar-evo-bloco">
                        <span className="criar-evo-label">Bônus do Mestre</span>
                        <p className="criar-evo-nota">O livro deixa a critério do Mestre liberar Marcos Narrativos extras, conforme o histórico do personagem ou as necessidades da campanha. Digite o valor e confirme.</p>
                        <div className="criar-evo-linha">
                          <input type="number" min="0" className="criar-evo-input" value={mestreBonusInput}
                            onChange={e => setMestreBonusInput(e.target.value)} />
                          <button className="criar-evo-btn" onClick={confirmarMestreBonus}>OK</button>
                          {char.marcosExtraMestre > 0 && <span className="criar-evo-nota">Atual: +{char.marcosExtraMestre} MN do Mestre</span>}
                        </div>
                      </div>

                      <p className="criar-evo-saldo">
                        Disponíveis: <strong>{Math.max(0, marcosDisponiveisCriacao)}</strong> Marcos Narrativos
                        {(marcosBaseCriacao > 0 || char.marcosExtraMestre > 0) && (
                          <span className="criar-evo-saldo-detalhe"> ({[marcosBaseCriacao > 0 && `${marcosBaseCriacao} do título`, char.marcosExtraMestre > 0 && `${char.marcosExtraMestre} do Mestre`].filter(Boolean).join(' + ')})</span>
                        )}
                      </p>

                      <div className="criar-evo-grid">
                        <div className="criar-evo-bloco">
                          <span className="criar-evo-label">Corpo e Mente</span>
                          <div className="criar-evo-linha">
                            <button className="criar-evo-btn" onClick={() => comprarBazarPV(true)}>+6 PV (fixo) — {CUSTOS_EVOLUCAO.pv} MN</button>
                            <button className="criar-evo-btn" onClick={() => comprarBazarPV(false)}>+PV (1d10, mín. 4) — {CUSTOS_EVOLUCAO.pv} MN</button>
                          </div>
                          <div className="criar-evo-linha">
                            <button className="criar-evo-btn" disabled={char.bazar.detComprada} onClick={comprarBazarDeterminacao}>
                              +1 Determinação Máxima — {CUSTOS_EVOLUCAO.determinacao} MN {char.bazar.detComprada ? '(adquirido)' : ''}
                            </button>
                            <button className="criar-evo-btn" disabled={sanidadeAtual >= CUSTOS_EVOLUCAO.sanidadeTeto} onClick={comprarBazarSanidade}>
                              +1 Sanidade Máxima (até {CUSTOS_EVOLUCAO.sanidadeTeto}) — {CUSTOS_EVOLUCAO.sanidade} MN
                            </button>
                          </div>
                        </div>

                        <div className="criar-evo-bloco">
                          <span className="criar-evo-label">Atributos</span>
                          <div className="criar-evo-linha">
                            <select value={bazarAtributo} onChange={e => setBazarAtributo(e.target.value)}>
                              {ATRIBUTOS.map(a => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
                            </select>
                            <button className="criar-evo-btn" onClick={comprarBazarAtributo}>+1 Atributo — {CUSTOS_EVOLUCAO.atributo} MN</button>
                          </div>
                          <p className="criar-evo-nota">Nenhum atributo pode ultrapassar o valor atual de Determinação ({determinacaoAtual}).</p>
                        </div>

                        <div className="criar-evo-bloco">
                          <span className="criar-evo-label">Perícias</span>
                          <div className="criar-evo-linha">
                            <select value={bazarPericia} onChange={e => setBazarPericia(e.target.value)}>
                              <option value="">Selecione…</option>
                              {builderData.all_pericias.map(p => (
                                <option key={p} value={p}>{p} ({PERICIA_BONUS_SEQ[Math.max(PERICIA_BONUS_SEQ.indexOf(periciasBaseAtuais[p] || ''), char.bazar.periciaEstagiosExtra[p] || 0)] || 'sem treino'})</option>
                              ))}
                            </select>
                            <button className="criar-evo-btn" disabled={!bazarPericia || estagioPericiaBazar >= 5} onClick={evoluirPericiaBazar}>
                              {!bazarPericia ? 'Escolha uma perícia' : estagioPericiaBazar >= 5 ? 'Nível máximo' : `Evoluir para ${PERICIA_BONUS_SEQ[estagioPericiaBazar + 1]} — ${custoProximoPericiaBazar} MN`}
                            </button>
                          </div>
                          <div className="criar-evo-linha">
                            <select value={bazarEspecPericia} onChange={e => setBazarEspecPericia(e.target.value)}>
                              <option value="">Selecione…</option>
                              {builderData.all_pericias.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <button className="criar-evo-btn" disabled={!bazarEspecPericia} onClick={comprarEspecializacaoBazar}>Especialização (requer +3) — {CUSTOS_EVOLUCAO.especializacao} MN</button>
                          </div>
                        </div>

                        <div className="criar-evo-bloco">
                          <span className="criar-evo-label">Talentos ({talentosJaEscolhidos.length}/{CUSTOS_EVOLUCAO.talentosLimite})</span>
                          <div className="criar-evo-linha">
                            <select value={bazarTalento} onChange={e => setBazarTalento(e.target.value)}>
                              <option value="">Selecione um talento…</option>
                              {talentosDisponiveisBazar.map(t => <option key={t.nome} value={t.nome}>{t.nome} ({t.categoria})</option>)}
                            </select>
                            <button className="criar-evo-btn" disabled={!bazarTalento || talentosJaEscolhidos.length >= CUSTOS_EVOLUCAO.talentosLimite} onClick={comprarTalentoBazar}>
                              Comprar Talento — {CUSTOS_EVOLUCAO.talento} MN
                            </button>
                          </div>
                        </div>

                        <div className="criar-evo-bloco">
                          <span className="criar-evo-label">Slots Extras</span>
                          <p className="criar-evo-nota">Em vez de virar um item genérico, isso aumenta quantas escolhas você tem nas abas "Itens Comuns" e "Item de Combate" — você escolhe o item de verdade lá.</p>
                          <div className="criar-evo-linha">
                            <button className="criar-evo-btn" onClick={comprarItensComunsSlotBazar}>+1 Item Comum (slot) — {CUSTOS_EVOLUCAO.itensComunsSlot} MN</button>
                            <button className="criar-evo-btn" onClick={comprarItensCombateSlotBazar}>+1 Item de Combate (slot) — {CUSTOS_EVOLUCAO.itensCombateSlot} MN</button>
                            <button className="criar-evo-btn" onClick={comprarItemRaroSlotBazar}>+1 Item Raro (slot) — {CUSTOS_EVOLUCAO.itemRaroSlot} MN</button>
                          </div>
                        </div>

                        <div className="criar-evo-bloco criar-evo-bloco-wide">
                          <span className="criar-evo-label">Recursos Narrativos</span>
                          <div className="criar-evo-linha">
                            <select value={bazarRecursoFlat} onChange={e => setBazarRecursoFlat(e.target.value)}>
                              {Object.entries(CUSTOS_EVOLUCAO.recursos).map(([nome, custo]) => <option key={nome} value={nome}>{nome} — {custo} MN</option>)}
                            </select>
                            <button className="criar-evo-btn" onClick={comprarRecursoFlatBazar}>Comprar</button>
                          </div>
                          <div className="criar-evo-linha">
                            <select value={bazarArmaCategoria} onChange={e => { setBazarArmaCategoria(e.target.value); setBazarArmaEscolhida('') }}>
                              <option value="simples">Arma Simples — {CUSTOS_EVOLUCAO.armaCategoria.simples} MN</option>
                              <option value="disparo">Arma de Disparo (até o Título atual) — {CUSTOS_EVOLUCAO.armaCategoria.disparo} MN</option>
                              <option value="fogo">Arma de Fogo (até o Título atual) — {CUSTOS_EVOLUCAO.armaCategoria.fogo} MN</option>
                            </select>
                            <select value={bazarArmaEscolhida} onChange={e => setBazarArmaEscolhida(e.target.value)}>
                              <option value="">Selecione a arma…</option>
                              {armasDisponiveisBazar.map(a => <option key={a.nome} value={a.nome}>{a.nome}</option>)}
                            </select>
                            <button className="criar-evo-btn" disabled={!bazarArmaEscolhida} onClick={comprarArmaBazar}>Comprar</button>
                          </div>
                          <div className="criar-evo-linha">
                            <select value={bazarEquipEscolhido} onChange={e => setBazarEquipEscolhido(e.target.value)}>
                              <option value="">Equipamento (até o Título atual) — {CUSTOS_EVOLUCAO.equipamento} MN…</option>
                              {equipamentosTitulo.map(eq => <option key={eq.nome} value={eq.nome}>{eq.nome}</option>)}
                            </select>
                            <button className="criar-evo-btn" disabled={!bazarEquipEscolhido} onClick={comprarEquipamentoBazar}>Comprar</button>
                          </div>
                        </div>
                      </div>

                      {(char.bazar.pvExtra > 0 || char.bazar.detComprada || char.bazar.sanExtra > 0 || char.bazar.talentosComprados.length > 0
                        || char.bazar.armasCompradas.length > 0 || char.bazar.equipamentosComprados.length > 0 || char.bazar.itensComprados.length > 0
                        || char.bazar.itensComunsExtra > 0 || char.bazar.itensCombateExtra > 0 || char.bazar.itensRarosExtra > 0 || char.bazar.especializacoes.length > 0
                        || Object.values(char.bazar.periciaEstagiosExtra).some(v => v > 0)) && (
                        <div className="criar-previa-resumo criar-bazar-ganhos">
                          {char.bazar.pvExtra > 0 && <span>PV: <strong>+{char.bazar.pvExtra}</strong></span>}
                          {char.bazar.detComprada && <span>Determinação: <strong>+1</strong></span>}
                          {char.bazar.sanExtra > 0 && <span>Sanidade: <strong>+{char.bazar.sanExtra}</strong></span>}
                          {ATRIBUTOS.filter(a => char.bazar.atributosExtra[a] > 0).map(a => (
                            <span key={a}>{a.charAt(0).toUpperCase() + a.slice(1)}: <strong>+{char.bazar.atributosExtra[a]}</strong></span>
                          ))}
                          {Object.entries(char.bazar.periciaEstagiosExtra).filter(([, v]) => v > 0).map(([p, v]) => (
                            <span key={p}>{p}: <strong>{PERICIA_BONUS_SEQ[v]}</strong></span>
                          ))}
                          {char.bazar.especializacoes.map(p => <span key={p}>Especialização: <strong>{p}</strong></span>)}
                          {char.bazar.talentosComprados.map(t => <span key={t.nome}>Talento: <strong>{t.nome}</strong></span>)}
                          {char.bazar.armasCompradas.map((a, i) => <span key={i}>Arma: <strong>{a.nome}</strong></span>)}
                          {char.bazar.equipamentosComprados.map((e, i) => <span key={i}>Equipamento: <strong>{e.nome}</strong></span>)}
                          {char.bazar.itensComunsExtra > 0 && <span>Slots Itens Comuns: <strong>+{char.bazar.itensComunsExtra}</strong></span>}
                          {char.bazar.itensCombateExtra > 0 && <span>Slots Item de Combate: <strong>+{char.bazar.itensCombateExtra}</strong></span>}
                          {char.bazar.itensRarosExtra > 0 && <span>Slots Item Raro: <strong>+{char.bazar.itensRarosExtra}</strong></span>}
                          {char.bazar.itensComprados.map((it, i) => <span key={i}>Recurso: <strong>{it.nome}</strong></span>)}
                        </div>
                      )}

                      {char.bazar.historico.length > 0 && (
                        <div className="criar-evo-historico">
                          <span className="criar-escolha-label">Histórico de Compras</span>
                          <ul>
                            {char.bazar.historico.map(h => (
                              <li key={h.id}>
                                <span>{h.label} <span className="criar-evo-historico-custo">— {h.custo} MN</span></span>
                                <button type="button" className="criar-evo-desfazer" title="Desfazer esta compra" onClick={() => desfazerCompraBazar(h.id)}>✕</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {tituloTabAtiva === 'previa' && (
                    <div className="criar-previa-titulo">
                      <div className="criar-previa-resumo">
                        <span>PV do título: <strong>+{regrasTitulo.pv_bonus || 0}</strong></span>
                        <span>Marcos Narrativos: <strong>{regrasTitulo.marcos_narrativos || 0}</strong></span>
                        {regrasTitulo.municao_extra > 0 && <span>Munição extra: <strong>{regrasTitulo.municao_extra} un.</strong> (da arma escolhida)</span>}
                      </div>
                      <div className="criar-previa-secao">
                        <h4>Armas e Equipamentos (Antecedente + Título + Bazar)</h4>
                        <p className="criar-evo-nota">Tudo que seu personagem recebeu até aqui — escolha o que fica equipado, o que vai só pro inventário ("Guardar") ou remova o que não quiser levar.</p>
                        {gearItens.length === 0
                          ? <p className="criar-titulo-picker-vazio">Nada aqui ainda.</p>
                          : gearItens.map(g => {
                              const guardado = char.gearGuardado.includes(g.key)
                              const removido = char.gearRemovido.includes(g.key)
                              const duplicado = gearContagemNomes[g.item.nome] > 1
                              return (
                                <div key={g.key} className={`criar-gear-item ${guardado ? 'guardado' : ''} ${removido ? 'removido' : ''}`}>
                                  <div className="criar-gear-item-header">
                                    <span className="criar-gear-item-origem">{g.origem}</span>
                                    {duplicado && !removido && <span className="criar-gear-item-duplicado">Duplicado</span>}
                                    <span className="criar-gear-item-status">{removido ? 'Removido' : guardado ? 'Guardado' : 'Equipado'}</span>
                                  </div>
                                  <PreviaItem item={g.item} />
                                  <div className="criar-gear-item-acoes">
                                    {removido ? (
                                      <button type="button" className="criar-gear-btn" onClick={() => removerGear(g.key)}>Restaurar</button>
                                    ) : (
                                      <>
                                        <button type="button" className="criar-gear-btn" onClick={() => toggleGuardarGear(g.key)}>{guardado ? 'Equipar' : 'Guardar'}</button>
                                        <button type="button" className="criar-gear-btn remover" onClick={() => removerGear(g.key)}>✕ Remover</button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                      </div>
                      {aprimoramentosMax > 0 && <PreviaSecao titulo="Aprimoramento(s)" itens={aprimoramentosEscolhidosPreview} />}
                      {itensComunsMax > 0 && <PreviaSecao titulo="Itens Comuns" itens={itensComunsEscolhidosPreview} />}
                      {itensCombateMax > 0 && <PreviaSecao titulo="Item(ns) de Combate" itens={itensCombateEscolhidosPreview} />}
                      {itensRarosMax > 0 && <PreviaSecao titulo="Item(ns) Raro(s)" itens={itensRarosEscolhidosPreview} />}
                      {itensEspeciaisOpcoes.length > 0 && <PreviaSecao titulo="Item Especial" itens={itensEspeciaisEscolhidosPreview} />}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 4: Atributos */}
        {step === 4 && (
          <div className="criar-panel">
            <h2>Distribua seus Atributos</h2>
            <p className="criar-desc">Distribua {regras.pontos_atributos} pontos entre os 5 atributos. Máximo {regras.max_atributo} por atributo.</p>
            <div className="criar-pontos-info">
              <span className={`criar-pontos ${pontosRestantes === 0 ? 'done' : ''}`}>Pontos restantes: {pontosRestantes}</span>
            </div>
            <div className="criar-attr-list">
              {['forca', 'agilidade', 'destreza', 'intelecto', 'presenca'].map(attr => (
                <div key={attr} className="criar-attr-row">
                  <span className="criar-attr-name">{attr.charAt(0).toUpperCase() + attr.slice(1)}</span>
                  <button className="criar-attr-btn" disabled={char.atributos[attr] <= 0}
                    onClick={() => setChar({...char, atributos: {...char.atributos, [attr]: char.atributos[attr] - 1}})}>-</button>
                  <span className="criar-attr-val">{char.atributos[attr]}</span>
                  <button className="criar-attr-btn" disabled={pontosRestantes <= 0 || char.atributos[attr] >= regras.max_atributo}
                    onClick={() => setChar({...char, atributos: {...char.atributos, [attr]: char.atributos[attr] + 1}})}>+</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: Talentos */}
        {step === 5 && (
          <div className="criar-panel">
            <h2>Escolha {regras.talentos_iniciais} Talentos</h2>
            <p className="criar-desc">Selecionados: {char.talentosSelecionados.length}/{regras.talentos_iniciais}</p>
            {builderData.talentos.map((cat, ci) => (
              <div key={ci} className="criar-tal-cat">
                <h3>{cat.categoria}</h3>
                <div className="criar-tal-grid">
                  {cat.itens.map((tal, ti) => {
                    const selected = char.talentosSelecionados.some(t => t.nome === tal.nome)
                    const bloqueado = talentosBloqueadosNoPasso.includes(tal.nome)
                    return (
                      <div key={ti} className="criar-tal-wrapper">
                        <button
                          className={`criar-tal-card ${selected || bloqueado ? 'selected' : ''} ${bloqueado ? 'bloqueado' : ''}`}
                          disabled={bloqueado || (!selected && char.talentosSelecionados.length >= regras.talentos_iniciais)}
                          onClick={() => {
                            if (bloqueado) return
                            if (selected) setChar({...char, talentosSelecionados: char.talentosSelecionados.filter(t => t.nome !== tal.nome)})
                            else setChar({...char, talentosSelecionados: [...char.talentosSelecionados, tal]})
                          }}>
                          {bloqueado && <span className="criar-tal-badge">{selectedAnt?.talento?.nome === tal.nome ? 'ANT' : 'BAZAR'}</span>}
                          <span className="criar-tal-name">{tal.nome}</span>
                          <span className="criar-tal-tipo">{tal.tipo}</span>
                        </button>
                        <div className="criar-tal-tooltip">
                          <strong>{tal.nome}</strong>
                          {tal.descricao && <p>{tal.descricao}</p>}
                          {tal.efeito && <p className="criar-tal-tooltip-efeito"><span>Efeito:</span> {tal.efeito}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 6: Perícias */}
        {step === 6 && (
          <div className="criar-panel">
            <h2>Escolha {periciasLivresTotal} Perícias Livres</h2>
            <p className="criar-desc">Do antecedente: {antPericiaPrimaria} (+2 primária){periciasSecundariasFinal.length > 0 ? `, ${periciasSecundariasFinal.join(', ')} (+1 secundária)` : ''}. Escolha mais {periciasLivresTotal} (+1 cada) — {regras.pericias_livres} base + {char.atributos.intelecto || 0} de Intelecto.</p>
            <div className="criar-pericias-grid">
              {Object.entries(builderData.pericias).map(([cat, list]) => (
                <div key={cat} className="criar-pericia-col">
                  <h4>{cat}</h4>
                  {list.map(p => {
                    const fromAnt = periciasDoAntecedente.includes(p)
                    // Perícia já paga no Bazar (aba "Bônus do Título") não pode ser escolhida
                    // de novo aqui de graça - senão o jogador "gasta" um dos picks livres numa
                    // perícia que já tinha, sem ganhar nada (o bônus final é o maior dos dois,
                    // não soma), e a UI ficava enganosa por não mostrar que ela já foi obtida.
                    const fromBazar = (char.bazar.periciaEstagiosExtra[p] || 0) > 0
                    const bloqueada = fromAnt || fromBazar
                    const selected = bloqueada || char.periciasSelecionadas.includes(p)
                    return (
                      <button key={p}
                        className={`criar-pericia-btn ${fromAnt ? 'from-ant' : ''} ${fromBazar ? 'from-bazar' : ''} ${selected ? 'selected' : ''}`}
                        disabled={bloqueada || (!selected && char.periciasSelecionadas.length >= periciasLivresTotal)}
                        onClick={() => {
                          if (bloqueada) return
                          if (selected) setChar({...char, periciasSelecionadas: char.periciasSelecionadas.filter(x => x !== p)})
                          else setChar({...char, periciasSelecionadas: [...char.periciasSelecionadas, p]})
                        }}>
                        {fromAnt && <span className="criar-pericia-badge">ANT</span>}
                        {fromBazar && <span className="criar-pericia-badge bazar">BAZAR</span>}
                        {selected && <span className="criar-pericia-badge sel">&#x2713;</span>}
                        {p}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 7: Finalizar */}
        {step === 7 && (
          <div className="criar-panel">
            <h2>Resumo do Personagem</h2>
            <div className="criar-resumo">
              <div className="criar-resumo-item"><span>Nome</span><strong>{char.nome || '—'}</strong></div>
              <div className="criar-resumo-item"><span>Nível da Campanha</span><strong>{char.tituloSobrevivencia}</strong></div>
              <div className="criar-resumo-item"><span>Antecedente</span><strong>{char.antecedente || '—'}</strong></div>
              <div className="criar-resumo-item"><span>Atributos</span><strong>FOR {char.atributos.forca} | AGI {char.atributos.agilidade} | DES {char.atributos.destreza} | INT {char.atributos.intelecto} | PRE {char.atributos.presenca}</strong></div>
              <div className="criar-resumo-item"><span>Talentos</span><strong>{char.talentosSelecionados.map(t => t.nome).join(', ') || '—'}</strong></div>
              <div className="criar-resumo-item"><span>Perícias</span><strong>
                {antPericiaPrimaria && `${antPericiaPrimaria} +2`}
                {periciasSecundariasFinal.length > 0 && `, ${periciasSecundariasFinal.map(p => `${p} +1`).join(', ')}`}
                {char.periciasSelecionadas.length > 0 && `, ${char.periciasSelecionadas.map(p => `${p} +1`).join(', ')}`}
                {!antPericiaPrimaria && periciasSecundariasFinal.length === 0 && char.periciasSelecionadas.length === 0 && '—'}
              </strong></div>
              <div className="criar-resumo-item"><span>Bônus do Antecedente</span><strong>
                {selectedAnt
                  ? [
                      atributoFixoResolvido && `+${bonusParsed.atributoValor} ${atributoFixoResolvido}`,
                      bonusParsed.vida > 0 && `+${bonusParsed.vida} Vida`,
                      bonusParsed.extra?.tipo === 'atributo_livre' && `+${bonusParsed.extra.valor} ${atributoLivreResolvido}`,
                      bonusParsed.extra?.tipo === 'determinacao' && `+${bonusParsed.extra.valor} Determinação`,
                      bonusParsed.extra?.tipo === 'sanidade' && `+${bonusParsed.extra.valor} Sanidade`,
                      bonusParsed.extra?.tipo === 'defesa' && `+${bonusParsed.extra.valor} Defesa (CA)`,
                    ].filter(Boolean).join(', ')
                  : '—'}
              </strong></div>
              {char.tituloSobrevivencia !== 'Sobrevivente Básico' && (
                <div className="criar-resumo-item"><span>Bônus do Título</span><strong>
                  {!tituloHabilitado
                    ? 'Em desenvolvimento — ficha gerada como Sobrevivente Básico'
                    : [
                        regrasTitulo.pv_bonus > 0 && `+${regrasTitulo.pv_bonus} Vida`,
                        regrasTitulo.marcos_narrativos > 0 && `${regrasTitulo.marcos_narrativos} Marcos Narrativos`,
                        ...char.tituloEscolhas.armas,
                        ...char.tituloEscolhas.equipamentos,
                        ...char.tituloEscolhas.aprimoramentos,
                        ...char.tituloEscolhas.itensComuns,
                        ...char.tituloEscolhas.itensCombate,
                        ...char.tituloEscolhas.itensEspeciais,
                        ...char.tituloEscolhas.bonusExtra.map(b => `${b.nome} (bônus)`),
                      ].filter(Boolean).join(', ') || '—'}
                </strong></div>
              )}
              {tituloHabilitado && char.bazar.historico.length > 0 && (
                <div className="criar-resumo-item"><span>Bazar (Marcos Narrativos)</span><strong>
                  {char.bazar.historico.map(h => h.label).join(', ')} — {char.bazar.marcosGastos} MN gastos, {Math.max(0, marcosDisponiveisCriacao)} restantes
                </strong></div>
              )}
            </div>
            <button className="criar-finalizar-btn" onClick={buildFicha}>Gerar Ficha de Personagem</button>
          </div>
        )}

        {/* NAVEGAÇÃO */}
        <div className="criar-nav">
          <button className="criar-nav-btn" disabled={step === 0} onClick={() => { setStep(step - 1); window.scrollTo(0, 0) }}>← Anterior</button>
          <span className="criar-nav-step">{step + 1} / {STEPS.length}</span>
          <button className="criar-nav-btn" disabled={step === STEPS.length - 1} onClick={() => { setStep(step + 1); window.scrollTo(0, 0) }}>Próximo →</button>
        </div>
      </div>
    </div>
  )
}

export default CriarPersonagem
