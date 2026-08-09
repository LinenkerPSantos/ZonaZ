import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './FichaPersonagem.css'
import './FichaEmJogo.css'

const PERICIAS = {
  'Físicas / Combate': ['Atletismo', 'Constituição', 'Furtividade', 'Luta', 'Pontaria', 'Pilotagem'],
  'Sobrevivência': ['Mecânica', 'Medicina', 'Percepção', 'Sobrevivência', 'Tecnologia'],
  'Sociais': ['Intimidação', 'Empatia', 'Enganação', 'Liderança', 'Persuasão'],
  'Intelectuais': ['Adestramento', 'Conhecimento', 'Estratégia', 'Iniciativa', 'Investigação', 'Vontade'],
}

const ATRIBUTOS = ['forca', 'agilidade', 'destreza', 'intelecto', 'presenca']

// Custos de Evolucao por Marcos Narrativos (Database/Título de Sobrevivência.docx,
// secao "Custos de Evolucao"/"Recursos Narrativos") - valores fixos de regra, nao
// dado de conteudo do jogo, por isso ficam direto no frontend (espelha FichaPersonagem.jsx).
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
  recursos: {
    'Abrigo Seguro Temporário': 12,
    'NPC Auxiliar (Contato)': 15,
    'Item de Combate Extra': 10,
    'Item Comum': 5,
    'Item Raro': 15,
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

const PERICIA_BONUS_SEQ = ['', '+1', '+2', '+3', '+4', '+5']

const FICHA_VAZIA = {
  nome: '', profissao: '', titulo_sobrevivencia: '', idade: '', altura: '', deslocamento: '', observacoes: '', historico: '',
  forca_atual: '', forca_max: '', agilidade_atual: '', agilidade_max: '',
  destreza_atual: '', destreza_max: '', intelecto_atual: '', intelecto_max: '',
  presenca_atual: '', presenca_max: '',
  infeccao_atual: '', infeccao_max: '',
  pv_atual: '', pv_max: '', determinacao_atual: '', determinacao_max: '',
  sanidade_atual: '', sanidade_max: '',
  ca_atual: '', ca_bonus: '', ca_obs: '', descricoes: '',
  arma1_nome: '', arma1_carga: '', arma1_estruturada: null,
  arma2_nome: '', arma2_carga: '', arma2_notas: '',
  armas_extra_jogo: [],
  protecao_cabeca: '', protecao_tronco: '', protecao_msup: '', protecao_minf: '', protecao_notas: [],
  transporte_tronco: '', transporte_msup: '', transporte_minf: '', transporte_notas: [],
  carga_atual: '', carga_max: '', itens_gerais_lista: [], inventario: '', kit_estruturado: null,
  talento_exclusivo: '', talentos_lista: [], talentos_obs: '', anotacoes: '',
  armas_extra_lista: [], aprimoramentos_lista: [], recursos_narrativos_lista: [],
  marcos_narrativos_atual: '', determinacao_comprada: false, historico_evolucao: [],
}

// Espelha aplicarOpcaoPacote do CriarPersonagem.jsx, mas contra os campos ja
// "achatados" da ficha existente - usado quando um Recurso Narrativo de
// Equipamento e comprado depois da criacao do personagem.
function aplicarEquipamentoNaFicha(op, prev) {
  const patch = {}
  if (op.tipo === 'protecao') {
    op.regioes.forEach(slot => { patch[`protecao_${slot}`] = op.nome })
    patch.protecao_notas = [...(prev.protecao_notas || []), op.estruturado]
    patch.ca_atual = String((parseInt(prev.ca_atual) || 0) + (op.defesa || 0))
  } else if (op.tipo === 'transporte') {
    op.regioes.forEach(slot => { if (slot !== 'cabeca') patch[`transporte_${slot}`] = op.nome })
    patch.transporte_notas = [...(prev.transporte_notas || []), op.estruturado]
    patch.carga_max = String((parseInt(prev.carga_max) || 0) + (op.carga_bonus || 0))
  }
  return patch
}

// Bloco de leitura para dados estruturados (talento, arma, equipamento, item):
// deixa Nome / Tipo-Categoria / Efeito visualmente distintos.
function NotaBloco({ item, badge, onRemover }) {
  if (!item) return null
  return (
    <div className="ficha-nota">
      <div className="ficha-nota-header">
        <span className="ficha-nota-nome">{item.nome}</span>
        <span className="ficha-nota-header-right">
          {badge && <span className="ficha-nota-badge">{badge}</span>}
          {onRemover && (
            <button type="button" className="ficha-item-remove" onClick={onRemover} title="Remover item" aria-label="Remover item">×</button>
          )}
        </span>
      </div>
      {item.subtitulo && <div className="ficha-nota-subtitulo">{item.subtitulo}</div>}
      {item.dados?.length > 0 && (
        <div className="ficha-nota-dados">
          {item.dados.map(([label, val], i) => (
            <span key={i}><b>{label}:</b> {val}</span>
          ))}
        </div>
      )}
      {item.descricao && <p className="ficha-nota-desc">{item.descricao}</p>}
      {item.efeito && <div className="ficha-nota-efeito"><span>Efeito:</span> {item.efeito}</div>}
    </div>
  )
}

// Lista de itens estruturados (nome/carga/descrição/efeito) que o jogador pode
// acrescentar ou excluir livremente durante a sessão - usada em Inventário,
// Proteção, Transporte e Armas extras.
function EditableNotaLista({ itens, onChange, placeholder = 'Nome do item' }) {
  const [form, setForm] = useState({ nome: '', carga: '', descricao: '', efeito: '' })

  const adicionar = () => {
    if (!form.nome.trim()) return
    const novo = {
      nome: form.nome.trim(),
      carga: form.carga.trim(),
      dados: form.carga.trim() ? [['Carga', form.carga.trim()]] : [],
      descricao: form.descricao.trim(),
      efeito: form.efeito.trim(),
    }
    onChange([...(itens || []), novo])
    setForm({ nome: '', carga: '', descricao: '', efeito: '' })
  }

  const remover = (i) => onChange(itens.filter((_, idx) => idx !== i))

  return (
    <div className="ficha-editable-lista">
      {itens?.length > 0
        ? itens.map((item, i) => <NotaBloco key={i} item={item} onRemover={() => remover(i)} />)
        : <p className="ficha-nota-vazio">—</p>}
      <div className="ficha-additem-form">
        <input className="ficha-additem-nome" placeholder={placeholder} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
        <input className="ficha-additem-carga" placeholder="Carga" value={form.carga} onChange={e => setForm({ ...form, carga: e.target.value })} />
        <input className="ficha-additem-desc" placeholder="Descrição (opcional)" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
        <input className="ficha-additem-efeito" placeholder="Efeito (opcional)" value={form.efeito} onChange={e => setForm({ ...form, efeito: e.target.value })} />
        <button type="button" className="ficha-btn additem-btn" onClick={adicionar} disabled={!form.nome.trim()}>+ Adicionar</button>
      </div>
    </div>
  )
}

// Lista simples de strings (materiais/itens iniciais de um Kit): sem carga
// nem descrição própria, só um nome curto - acrescenta e remove por linha.
function EditableStringLista({ itens, onChange, placeholder }) {
  const [novo, setNovo] = useState('')

  const adicionar = () => {
    if (!novo.trim()) return
    onChange([...(itens || []), novo.trim()])
    setNovo('')
  }
  const remover = (i) => onChange(itens.filter((_, idx) => idx !== i))

  return (
    <div className="ficha-editable-lista ficha-editable-lista-strings">
      {itens?.length > 0 ? (
        <ul className="ficha-string-lista">
          {itens.map((texto, i) => (
            <li key={i}>
              <span>{texto}</span>
              <button type="button" className="ficha-item-remove" onClick={() => remover(i)} title="Remover" aria-label="Remover">×</button>
            </li>
          ))}
        </ul>
      ) : <p className="ficha-nota-vazio">—</p>}
      <div className="ficha-additem-form ficha-additem-form-sm">
        <input placeholder={placeholder} value={novo} onChange={e => setNovo(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); adicionar() } }} />
        <button type="button" className="ficha-btn additem-btn" onClick={adicionar} disabled={!novo.trim()}>+ Adicionar</button>
      </div>
    </div>
  )
}

// Gerenciador dos Espaços internos de um Kit (ex.: Kit de Ferramentas "2
// Espaços para itens de carga até 1") - cada item ocupa um espaço e sua carga
// soma-se à carga base do kit para formar a carga total carregada.
function KitEspacos({ kit, onChange }) {
  const espacos = kit.espacos
  if (!espacos) return null
  const itens = kit.espacos_itens || []
  const [form, setForm] = useState({ nome: '', carga: '' })

  const cargaBase = parseFloat(kit.carga) || 0
  const cargaItens = itens.reduce((soma, it) => soma + (parseFloat(it.carga) || 0), 0)

  const adicionar = () => {
    if (!form.nome.trim()) return
    if (itens.length >= espacos.quantidade) {
      window.alert(`Este kit só tem ${espacos.quantidade} espaço(s) livre(s).`)
      return
    }
    const carga = parseFloat(form.carga) || 0
    if (carga > espacos.carga_max) {
      window.alert(`Cada espaço deste kit aceita apenas itens de carga até ${espacos.carga_max}.`)
      return
    }
    onChange({ ...kit, espacos_itens: [...itens, { nome: form.nome.trim(), carga: form.carga.trim() || '0' }] })
    setForm({ nome: '', carga: '' })
  }
  const remover = (i) => onChange({ ...kit, espacos_itens: itens.filter((_, idx) => idx !== i) })

  return (
    <div className="ficha-kit-espacos">
      <div className="ficha-nota-label">
        Espaços do Kit — {itens.length}/{espacos.quantidade} ocupados (carga até {espacos.carga_max} cada)
      </div>
      {itens.length > 0 ? (
        <ul className="ficha-string-lista">
          {itens.map((it, i) => (
            <li key={i}>
              <span>{it.nome} <b>(Carga {it.carga || 0})</b></span>
              <button type="button" className="ficha-item-remove" onClick={() => remover(i)} title="Remover" aria-label="Remover">×</button>
            </li>
          ))}
        </ul>
      ) : <p className="ficha-nota-vazio">Nenhum item guardado nos espaços do kit.</p>}
      <div className="ficha-additem-form ficha-additem-form-sm">
        <input placeholder="Nome do item" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
        <input placeholder={`Carga (máx. ${espacos.carga_max})`} value={form.carga} onChange={e => setForm({ ...form, carga: e.target.value })} />
        <button type="button" className="ficha-btn additem-btn" onClick={adicionar} disabled={!form.nome.trim() || itens.length >= espacos.quantidade}>+ Adicionar</button>
      </div>
      <div className="ficha-kit-carga-total">Carga total do kit (base + espaços): <strong>{cargaBase + cargaItens}</strong></div>
    </div>
  )
}

function FichaEmJogo() {
  const [ficha, setFicha] = useState(FICHA_VAZIA)

  const [builderData, setBuilderData] = useState(null)
  useEffect(() => {
    fetch('/api/builder/data').then(r => r.json()).then(setBuilderData)
  }, [])

  const [pericias, setPericias] = useState(() => {
    const init = {}
    Object.values(PERICIAS).flat().forEach(p => {
      init[p] = { bonus: '', nv: '', esp: '' }
    })
    return init
  })

  const [periciasObs, setPericiasObs] = useState('')

  // "Ficha em Jogo" e a copia viva/mutavel usada durante a sessao: autosalva no
  // proprio localStorage a cada mudanca, para nao perder o progresso ao fechar a
  // aba (diferente de 'zona-z-ficha', que e so o canal de transferencia de mao
  // unica da Criação de Personagem para a Ficha de referência).
  //
  // O efeito de gravacao roda uma vez no proprio mount (como qualquer efeito
  // com dependencias) - sem essa guarda, essa primeira gravacao aconteceria
  // com a ficha ainda em branco (o estado inicial), ANTES do efeito de leitura
  // (abaixo) ter aplicado os dados salvos, sobrescrevendo o localStorage com
  // nada e perdendo tudo assim que a pagina fosse recarregada.
  const primeiraGravacaoLS = useRef(true)

  useEffect(() => {
    const saved = localStorage.getItem('zona-z-ficha-em-jogo')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.ficha) setFicha(prev => ({ ...prev, ...data.ficha }))
        if (data.pericias) setPericias(prev => ({ ...prev, ...data.pericias }))
        if (data.periciasObs) setPericiasObs(data.periciasObs)
      } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    if (primeiraGravacaoLS.current) { primeiraGravacaoLS.current = false; return }
    localStorage.setItem('zona-z-ficha-em-jogo', JSON.stringify({ ficha, pericias, periciasObs }))
  }, [ficha, pericias, periciasObs])

  // Auto-Save em Arquivo (File System Access API — Chrome/Edge): depois que o
  // jogador escolhe um .json uma vez, toda alteração é gravada nele automaticamente
  // (com debounce), sobrevivendo a limpeza de dados do navegador — o que o
  // localStorage sozinho não garante. Sem suporte (Firefox/Safari), o botão
  // some e resta usar "Exportar JSON" periodicamente.
  const suportaAutoSaveArquivo = typeof window !== 'undefined' && 'showSaveFilePicker' in window
  const [arquivoHandle, setArquivoHandle] = useState(null)
  const [arquivoStatus, setArquivoStatus] = useState('')

  const ativarAutoSaveArquivo = async () => {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: `ficha-em-jogo-${ficha.nome || 'personagem'}.json`,
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
      })
      setArquivoHandle(handle)
      setArquivoStatus(`Auto-Save ativado em "${handle.name}".`)
    } catch { /* jogador cancelou a escolha do arquivo */ }
  }

  useEffect(() => {
    if (!arquivoHandle) return
    let cancelado = false
    setArquivoStatus(`Salvando em "${arquivoHandle.name}"…`)
    const t = setTimeout(async () => {
      try {
        const writable = await arquivoHandle.createWritable()
        await writable.write(JSON.stringify({ ficha, pericias, periciasObs }, null, 2))
        await writable.close()
        if (!cancelado) setArquivoStatus(`Salvo em "${arquivoHandle.name}" às ${new Date().toLocaleTimeString('pt-BR')}.`)
      } catch {
        if (!cancelado) setArquivoStatus(`Falha ao salvar em "${arquivoHandle.name}" — use "Exportar JSON".`)
      }
    }, 600)
    return () => { cancelado = true; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arquivoHandle, ficha, pericias, periciasObs])

  const update = (field, value) => setFicha(prev => ({ ...prev, [field]: value }))
  const updateKit = (novoKit) => setFicha(prev => ({ ...prev, kit_estruturado: novoKit }))
  const updatePericia = (name, field, value) => setPericias(prev => ({
    ...prev, [name]: { ...prev[name], [field]: value }
  }))

  // ---- Evolução por Marcos Narrativos (Database/Título de Sobrevivência.docx) ----
  const marcosDisponiveis = parseInt(ficha.marcos_narrativos_atual) || 0
  const tituloBonusCatalogo = builderData?.titulo_bonus?.catalogo
  const tierAtualFicha = builderData ? builderData.titulos.indexOf(ficha.titulo_sobrevivencia) : -1

  const [evoAtributo, setEvoAtributo] = useState('forca')
  const [evoPericia, setEvoPericia] = useState(Object.values(PERICIAS).flat()[0])
  const [evoEspecPericia, setEvoEspecPericia] = useState(Object.values(PERICIAS).flat()[0])
  const [evoTalento, setEvoTalento] = useState('')
  const [evoRecursoFlat, setEvoRecursoFlat] = useState(Object.keys(CUSTOS_EVOLUCAO.recursos)[0])
  const [evoArmaCategoria, setEvoArmaCategoria] = useState('simples')
  const [evoArmaEscolhida, setEvoArmaEscolhida] = useState('')
  const [evoEquipEscolhido, setEvoEquipEscolhido] = useState('')

  const comprarEvolucao = (custo, label, patch) => {
    if (marcosDisponiveis < custo) {
      window.alert(`Marcos Narrativos insuficientes (necessário ${custo}, disponível ${marcosDisponiveis}).`)
      return
    }
    setFicha(prev => ({
      ...prev,
      ...(typeof patch === 'function' ? patch(prev) : patch),
      marcos_narrativos_atual: String((parseInt(prev.marcos_narrativos_atual) || 0) - custo),
      historico_evolucao: [...(prev.historico_evolucao || []), { label, custo }],
    }))
  }

  const comprarPV = (fixo) => {
    const valor = fixo ? 6 : Math.max(4, Math.floor(Math.random() * 10) + 1)
    comprarEvolucao(CUSTOS_EVOLUCAO.pv, `+${valor} PV (${fixo ? 'fixo' : '1d10'})`, prev => ({
      pv_max: String((parseInt(prev.pv_max) || 0) + valor),
    }))
  }

  const comprarDeterminacao = () => comprarEvolucao(CUSTOS_EVOLUCAO.determinacao, '+1 Determinação Máxima', prev => ({
    determinacao_max: String((parseInt(prev.determinacao_max) || 0) + 1),
    determinacao_comprada: true,
  }))

  const comprarSanidade = () => comprarEvolucao(CUSTOS_EVOLUCAO.sanidade, '+1 Sanidade Máxima', prev => ({
    sanidade_max: String(Math.min(CUSTOS_EVOLUCAO.sanidadeTeto, (parseInt(prev.sanidade_max) || 0) + 1)),
  }))

  const comprarAtributo = () => {
    const atual = parseInt(ficha[`${evoAtributo}_max`]) || 0
    const det = parseInt(ficha.determinacao_max) || 0
    if (atual + 1 > det) {
      window.alert('Nenhum atributo pode ultrapassar o valor atual de Determinação.')
      return
    }
    comprarEvolucao(CUSTOS_EVOLUCAO.atributo, `+1 ${evoAtributo}`, { [`${evoAtributo}_max`]: String(atual + 1) })
  }

  const estagioPericiaEvo = PERICIA_BONUS_SEQ.indexOf(pericias[evoPericia]?.bonus || '')
  const custoProximoPericia = CUSTOS_EVOLUCAO.pericia[estagioPericiaEvo]

  const evoluirPericia = () => {
    const estagio = PERICIA_BONUS_SEQ.indexOf(pericias[evoPericia]?.bonus || '')
    if (estagio < 0 || estagio >= 5) {
      window.alert('O campo "Bônus" dessa perícia tem um valor fora da progressão padrão (vazio, +1, +2, +3, +4, +5) — ajuste-o manualmente antes de evoluir por aqui.')
      return
    }
    const custo = CUSTOS_EVOLUCAO.pericia[estagio]
    if (marcosDisponiveis < custo) {
      window.alert(`Marcos Narrativos insuficientes (necessário ${custo}).`)
      return
    }
    const novoBonus = PERICIA_BONUS_SEQ[estagio + 1]
    setPericias(prev => ({ ...prev, [evoPericia]: { ...prev[evoPericia], bonus: novoBonus } }))
    setFicha(prev => ({
      ...prev,
      marcos_narrativos_atual: String((parseInt(prev.marcos_narrativos_atual) || 0) - custo),
      historico_evolucao: [...(prev.historico_evolucao || []), { label: `Perícia ${evoPericia} → ${novoBonus}`, custo }],
    }))
  }

  const comprarEspecializacao = () => {
    if (pericias[evoEspecPericia]?.esp) {
      window.alert('Essa perícia já tem uma Especialização (cada perícia só pode ter uma).')
      return
    }
    const estagio = PERICIA_BONUS_SEQ.indexOf(pericias[evoEspecPericia]?.bonus || '')
    if (estagio < CUSTOS_EVOLUCAO.especializacaoEstagioMin) {
      window.alert('A perícia precisa estar pelo menos no 3º estágio (+3) para receber Especialização.')
      return
    }
    const especializacoesAtuais = Object.values(pericias).filter(p => p.esp).length
    const determinacaoAtual = parseInt(ficha.determinacao_max) || 0
    if (especializacoesAtuais >= determinacaoAtual) {
      window.alert(`O número de Especializações é limitado pelo valor atual de Determinação (${determinacaoAtual}).`)
      return
    }
    if (marcosDisponiveis < CUSTOS_EVOLUCAO.especializacao) {
      window.alert('Marcos Narrativos insuficientes.')
      return
    }
    setPericias(prev => ({
      ...prev,
      [evoEspecPericia]: { ...prev[evoEspecPericia], esp: prev[evoEspecPericia].esp || 'Especialização (defina o foco)' },
    }))
    setFicha(prev => ({
      ...prev,
      marcos_narrativos_atual: String((parseInt(prev.marcos_narrativos_atual) || 0) - CUSTOS_EVOLUCAO.especializacao),
      historico_evolucao: [...(prev.historico_evolucao || []), { label: `Especialização em ${evoEspecPericia}`, custo: CUSTOS_EVOLUCAO.especializacao }],
    }))
  }

  const talentosCatalogo = (builderData?.talentos || []).flatMap(cat => cat.itens.map(t => ({ ...t, categoria: cat.categoria })))
  const talentosDisponiveisEvo = talentosCatalogo.filter(t => !ficha.talentos_lista.some(x => x.nome === t.nome))

  const comprarTalento = () => {
    const t = talentosDisponiveisEvo.find(x => x.nome === evoTalento)
    if (!t) return
    if (ficha.talentos_lista.length >= CUSTOS_EVOLUCAO.talentosLimite) {
      window.alert(`Limite de ${CUSTOS_EVOLUCAO.talentosLimite} talentos atingido.`)
      return
    }
    comprarEvolucao(CUSTOS_EVOLUCAO.talento, `Talento: ${t.nome}`, prev => ({
      talentos_lista: [...prev.talentos_lista, { nome: t.nome, subtitulo: t.tipo, descricao: t.descricao, efeito: t.efeito, exclusivo: false }],
    }))
  }

  const comprarRecursoFlat = () => {
    const custo = CUSTOS_EVOLUCAO.recursos[evoRecursoFlat]
    comprarEvolucao(custo, evoRecursoFlat, prev => ({
      recursos_narrativos_lista: [...(prev.recursos_narrativos_lista || []), { nome: evoRecursoFlat, dados: [['Custo', `${custo} MN`]], descricao: '', efeito: '' }],
    }))
  }

  const armasDisponiveisEvo = (tituloBonusCatalogo?.armas || []).filter(a => a.tier <= tierAtualFicha && a.categoria_arma === evoArmaCategoria)
  const equipamentosDisponiveisEvo = (tituloBonusCatalogo?.equipamentos || []).filter(e => e.tier <= tierAtualFicha)

  const comprarArmaRecurso = () => {
    const arma = armasDisponiveisEvo.find(a => a.nome === evoArmaEscolhida)
    if (!arma) return
    comprarEvolucao(CUSTOS_EVOLUCAO.armaCategoria[evoArmaCategoria], `Recurso Narrativo — Arma: ${arma.nome}`, prev => ({
      armas_extra_lista: [...prev.armas_extra_lista, { ...arma, subtitulo: 'Recurso Narrativo' }],
    }))
  }

  const comprarEquipamentoRecurso = () => {
    const eq = equipamentosDisponiveisEvo.find(e => e.nome === evoEquipEscolhido)
    if (!eq) return
    comprarEvolucao(CUSTOS_EVOLUCAO.equipamento, `Recurso Narrativo — Equipamento: ${eq.nome}`, prev => aplicarEquipamentoNaFicha(eq, prev))
  }

  const handleExportPDF = () => window.print()

  const handleExportJSON = () => {
    const data = { ficha, pericias, periciasObs }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ficha-em-jogo-${ficha.nome || 'personagem'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (data.ficha) setFicha(prev => ({ ...FICHA_VAZIA, ...prev, ...data.ficha }))
        if (data.pericias) setPericias(data.pericias)
        if (data.periciasObs) setPericiasObs(data.periciasObs)
      } catch { /* ignore */ }
    }
    reader.readAsText(file)
  }

  return (
    <div className="ficha-page">
      <div className="ficha-toolbar no-print">
        <Link to="/ficha" className="ficha-btn criar">Ver Ficha de Personagem</Link>
        <h1 className="ficha-toolbar-title">Ficha em Jogo</h1>
        <div className="ficha-toolbar-actions">
          {suportaAutoSaveArquivo && (
            <button className="ficha-btn import" onClick={ativarAutoSaveArquivo}>
              {arquivoHandle ? 'Trocar Arquivo de Auto-Save' : 'Ativar Auto-Save em Arquivo'}
            </button>
          )}
          <label className="ficha-btn import">
            Importar JSON
            <input type="file" accept=".json" onChange={handleImport} hidden />
          </label>
          <button className="ficha-btn pdf" onClick={handleExportPDF}>Exportar PDF</button>
          <button className="ficha-btn json" onClick={handleExportJSON}>Exportar JSON</button>
        </div>
      </div>

      <div className="ficha-sheet">
        <h2 className="ficha-title">Ficha em Jogo</h2>
        <p className="ficha-em-jogo-aviso no-print">
          Esta é a cópia viva do personagem para usar durante a sessão: aqui dá para acrescentar ou excluir itens do
          Inventário, do Inventário dos Kits, das Armas Equipadas e dos Equipamentos de Transporte/Proteção conforme o
          jogo acontece. As mudanças ficam salvas automaticamente neste navegador (localStorage) — mas isso <b>não é
          um backup confiável</b>: some se você limpar os dados do site, usar aba anônima ou trocar de navegador/computador.
          {suportaAutoSaveArquivo
            ? ' Para não depender só disso, clique em "Ativar Auto-Save em Arquivo" e escolha onde salvar — toda alteração passa a ser gravada direto nesse arquivo .json.'
            : ' Para não depender só disso, clique em "Exportar JSON" de tempos em tempos (e depois "Importar JSON" para retomar de onde parou).'}
          {arquivoStatus && <span className="ficha-em-jogo-arquivo-status"> {arquivoStatus}</span>}
        </p>

        {/* IDENTIFICAÇÃO */}
        <fieldset className="ficha-fieldset">
          <legend>Identificação</legend>
          <div className="ficha-row">
            <label className="ficha-field full">
              <span>Nome do Personagem</span>
              <input value={ficha.nome} onChange={e => update('nome', e.target.value)} />
            </label>
          </div>
          <div className="ficha-row">
            <label className="ficha-field"><span>Profissão</span><input value={ficha.profissao} onChange={e => update('profissao', e.target.value)} /></label>
            <label className="ficha-field"><span>Nível da Campanha</span><input value={ficha.titulo_sobrevivencia} onChange={e => update('titulo_sobrevivencia', e.target.value)} /></label>
            <label className="ficha-field sm"><span>Idade</span><input value={ficha.idade} onChange={e => update('idade', e.target.value)} /></label>
            <label className="ficha-field sm"><span>Altura</span><input value={ficha.altura} onChange={e => update('altura', e.target.value)} /></label>
            <label className="ficha-field sm"><span>Deslocamento</span><input value={ficha.deslocamento} onChange={e => update('deslocamento', e.target.value)} /></label>
          </div>
          <div className="ficha-row">
            <label className="ficha-field full">
              <span>Histórico / Características</span>
              <textarea rows="2" value={ficha.historico} onChange={e => update('historico', e.target.value)} />
            </label>
          </div>
        </fieldset>

        {/* ATRIBUTOS + SAÚDE + COMBATE */}
        <div className="ficha-triple">
          <fieldset className="ficha-fieldset">
            <legend>Atributos</legend>
            <div className="ficha-attr-header"><span></span><span>Atual</span><span>Máx</span></div>
            {ATRIBUTOS.map(a => (
              <div key={a} className="ficha-attr-row">
                <span className="ficha-attr-name">{a.charAt(0).toUpperCase() + a.slice(1).replace('ca', 'ça')}</span>
                <input value={ficha[`${a}_atual`]} onChange={e => update(`${a}_atual`, e.target.value)} />
                <input value={ficha[`${a}_max`]} onChange={e => update(`${a}_max`, e.target.value)} />
              </div>
            ))}
          </fieldset>

          <fieldset className="ficha-fieldset">
            <legend>Saúde</legend>
            <div className="ficha-attr-header"><span></span><span>Atual</span><span>Máx</span></div>
            <div className="ficha-attr-row">
              <span className="ficha-attr-name">Infecção</span>
              <input value={ficha.infeccao_atual} onChange={e => update('infeccao_atual', e.target.value)} />
              <input value={ficha.infeccao_max} onChange={e => update('infeccao_max', e.target.value)} />
            </div>
            <div className="ficha-attr-row">
              <span className="ficha-attr-name">PV</span>
              <input value={ficha.pv_atual} onChange={e => update('pv_atual', e.target.value)} />
              <input value={ficha.pv_max} onChange={e => update('pv_max', e.target.value)} />
            </div>
            <div className="ficha-attr-row">
              <span className="ficha-attr-name">Determinação</span>
              <input value={ficha.determinacao_atual} onChange={e => update('determinacao_atual', e.target.value)} />
              <input value={ficha.determinacao_max} onChange={e => update('determinacao_max', e.target.value)} />
            </div>
            <div className="ficha-attr-row">
              <span className="ficha-attr-name">Sanidade</span>
              <input value={ficha.sanidade_atual} onChange={e => update('sanidade_atual', e.target.value)} />
              <input value={ficha.sanidade_max} onChange={e => update('sanidade_max', e.target.value)} />
            </div>
            <div className="ficha-attr-row">
              <span className="ficha-attr-name">Marcos Narrativos</span>
              <input value={ficha.marcos_narrativos_atual} onChange={e => update('marcos_narrativos_atual', e.target.value)} />
              <span className="ficha-attr-fixo">disponíveis</span>
            </div>
          </fieldset>

          <fieldset className="ficha-fieldset">
            <legend>Combate e Sobrevivência</legend>
            <div className="ficha-row">
              <label className="ficha-field sm"><span>CA</span><input value={ficha.ca_atual} onChange={e => update('ca_atual', e.target.value)} /></label>
              <label className="ficha-field sm"><span>Bônus</span><input value={ficha.ca_bonus} onChange={e => update('ca_bonus', e.target.value)} /></label>
            </div>
            <label className="ficha-field full"><span>Descrições</span><textarea rows="3" value={ficha.descricoes} onChange={e => update('descricoes', e.target.value)} /></label>
          </fieldset>
        </div>

        {/* PERÍCIAS */}
        <fieldset className="ficha-fieldset">
          <legend>Perícias</legend>
          <div className="ficha-pericias-grid">
            {Object.entries(PERICIAS).map(([cat, list]) => (
              <div key={cat} className="ficha-pericia-col">
                <div className="ficha-pericia-cat">{cat}</div>
                <div className="ficha-pericia-header"><span>Bônus</span><span>NV</span><span>ESP</span></div>
                {list.map(p => (
                  <div key={p} className="ficha-pericia-row">
                    <span className="ficha-pericia-name">{p}</span>
                    <input value={pericias[p]?.bonus || ''} onChange={e => updatePericia(p, 'bonus', e.target.value)} />
                    <input value={pericias[p]?.nv || ''} onChange={e => updatePericia(p, 'nv', e.target.value)} />
                    <input value={pericias[p]?.esp || ''} onChange={e => updatePericia(p, 'esp', e.target.value)} />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <label className="ficha-field full" style={{ marginTop: '0.5rem' }}>
            <span>Observações das Perícias</span>
            <textarea rows="2" value={periciasObs} onChange={e => setPericiasObs(e.target.value)} />
          </label>
        </fieldset>

        {/* INVENTÁRIO + ARMAS + EQUIPAMENTOS */}
        <div className="ficha-cards">
          <fieldset className="ficha-fieldset ficha-card">
            <legend>Inventário</legend>
            <div className="ficha-row">
              <label className="ficha-field sm"><span>Carga Atual</span><input value={ficha.carga_atual} onChange={e => update('carga_atual', e.target.value)} /></label>
              <label className="ficha-field sm"><span>Carga Máxima</span><input value={ficha.carga_max} onChange={e => update('carga_max', e.target.value)} /></label>
            </div>
            <span className="ficha-nota-label">Itens Guardados</span>
            <EditableNotaLista itens={ficha.itens_gerais_lista} onChange={v => update('itens_gerais_lista', v)} placeholder="Nome do item encontrado" />
            <label className="ficha-field full" style={{ marginTop: '0.5rem' }}>
              <span>Outros itens / anotações</span>
              <textarea rows="3" value={ficha.inventario} onChange={e => update('inventario', e.target.value)} placeholder="Itens adquiridos depois da criação..." />
            </label>
          </fieldset>

          <fieldset className="ficha-fieldset ficha-card">
            <legend>Inventário dos Kits</legend>
            {ficha.kit_estruturado ? (
              <>
                <div className="ficha-nota">
                  <div className="ficha-nota-header">
                    <span className="ficha-nota-nome">{ficha.kit_estruturado.nome}</span>
                    <span className="ficha-nota-badge">Carga base {ficha.kit_estruturado.carga}</span>
                  </div>
                  {ficha.kit_estruturado.arma && (
                    <div className="ficha-nota-subtitulo">Arma do kit: {ficha.kit_estruturado.arma}</div>
                  )}
                </div>

                <span className="ficha-nota-label">Componentes Narrativos</span>
                <EditableStringLista
                  itens={ficha.kit_estruturado.itens || []}
                  onChange={v => updateKit({ ...ficha.kit_estruturado, itens: v })}
                  placeholder="Novo componente narrativo"
                />

                <span className="ficha-nota-label">Materiais</span>
                <EditableStringLista
                  itens={ficha.kit_estruturado.materiais || []}
                  onChange={v => updateKit({ ...ficha.kit_estruturado, materiais: v })}
                  placeholder="Ex.: 1x Fita Adesiva"
                />

                <span className="ficha-nota-label">Itens Iniciais</span>
                <EditableStringLista
                  itens={ficha.kit_estruturado.itens_iniciais || []}
                  onChange={v => updateKit({ ...ficha.kit_estruturado, itens_iniciais: v })}
                  placeholder="Ex.: 1x Antibiótico"
                />

                <KitEspacos kit={ficha.kit_estruturado} onChange={updateKit} />
              </>
            ) : (
              <p className="ficha-nota-vazio">Nenhum kit equipado.</p>
            )}
          </fieldset>

          <fieldset className="ficha-fieldset ficha-card">
            <legend>Armas Equipadas</legend>
            <div className="ficha-weapon">
              <div className="ficha-row">
                <label className="ficha-field"><span>Arma Primária</span><input value={ficha.arma1_nome} onChange={e => update('arma1_nome', e.target.value)} /></label>
                <label className="ficha-field sm"><span>Carga</span><input value={ficha.arma1_carga} onChange={e => update('arma1_carga', e.target.value)} /></label>
              </div>
              {ficha.arma1_estruturada && (
                <NotaBloco item={ficha.arma1_estruturada} />
              )}
            </div>
            <div className="ficha-weapon">
              <div className="ficha-row">
                <label className="ficha-field"><span>Arma Secundária</span><input value={ficha.arma2_nome} onChange={e => update('arma2_nome', e.target.value)} /></label>
                <label className="ficha-field sm"><span>Carga</span><input value={ficha.arma2_carga} onChange={e => update('arma2_carga', e.target.value)} /></label>
              </div>
              <label className="ficha-field full"><span>Anotação</span><textarea rows="2" value={ficha.arma2_notas} onChange={e => update('arma2_notas', e.target.value)} /></label>
            </div>
            <span className="ficha-nota-label">Outras Armas Encontradas em Jogo</span>
            <EditableNotaLista itens={ficha.armas_extra_jogo} onChange={v => update('armas_extra_jogo', v)} placeholder="Nome da arma" />
          </fieldset>

          <fieldset className="ficha-fieldset ficha-card">
            <legend>Equipamentos — Proteção</legend>
            {[['Cabeça', 'protecao_cabeca'], ['Tronco ou Corpo', 'protecao_tronco'], ['Membros Superiores', 'protecao_msup'], ['Membros Inferiores', 'protecao_minf']].map(([l, f]) => (
              <label key={f} className="ficha-field full"><span>{l}</span><input value={ficha[f]} onChange={e => update(f, e.target.value)} /></label>
            ))}
            <span className="ficha-nota-label">Anotação ou Combos</span>
            <EditableNotaLista itens={ficha.protecao_notas} onChange={v => update('protecao_notas', v)} placeholder="Nome do equipamento" />
          </fieldset>

          <fieldset className="ficha-fieldset ficha-card">
            <legend>Equipamentos — Transporte</legend>
            {[['Tronco', 'transporte_tronco'], ['Membros Superiores', 'transporte_msup'], ['Membros Inferiores', 'transporte_minf']].map(([l, f]) => (
              <label key={f} className="ficha-field full"><span>{l}</span><input value={ficha[f]} onChange={e => update(f, e.target.value)} /></label>
            ))}
            <span className="ficha-nota-label">Anotação ou Combos</span>
            <EditableNotaLista itens={ficha.transporte_notas} onChange={v => update('transporte_notas', v)} placeholder="Nome do equipamento" />
          </fieldset>

          <fieldset className="ficha-fieldset ficha-card">
            <legend>Armas e Equipamentos do Título</legend>
            <span className="ficha-nota-label">Concedidos pelo Título de Sobrevivência</span>
            {ficha.armas_extra_lista?.length > 0
              ? ficha.armas_extra_lista.map((item, i) => <NotaBloco key={i} item={item} />)
              : <p className="ficha-nota-vazio">—</p>}
          </fieldset>

          <fieldset className="ficha-fieldset ficha-card">
            <legend>Aprimoramentos</legend>
            {ficha.aprimoramentos_lista?.length > 0
              ? ficha.aprimoramentos_lista.map((item, i) => <NotaBloco key={i} item={item} />)
              : <p className="ficha-nota-vazio">Nenhum aprimoramento registrado.</p>}
          </fieldset>

          <fieldset className="ficha-fieldset ficha-card">
            <legend>Recursos Narrativos</legend>
            {ficha.recursos_narrativos_lista?.length > 0
              ? ficha.recursos_narrativos_lista.map((item, i) => <NotaBloco key={i} item={item} />)
              : <p className="ficha-nota-vazio">Nenhum recurso narrativo registrado.</p>}
          </fieldset>
        </div>

        {/* TALENTOS */}
        <fieldset className="ficha-fieldset ficha-page2-start">
          <legend>Talentos</legend>
          {ficha.talentos_lista?.length > 0
            ? ficha.talentos_lista.map((t, i) => (
                <NotaBloco key={i} item={t} badge={t.exclusivo ? 'Exclusivo' : null} />
              ))
            : <p className="ficha-nota-vazio">Nenhum talento registrado.</p>}
          <label className="ficha-field full" style={{ marginTop: '0.5rem' }}>
            <span>Outros talentos / anotações</span>
            <textarea rows="3" value={ficha.talentos_obs} onChange={e => update('talentos_obs', e.target.value)} placeholder="Talentos adquiridos depois da criação..." />
          </label>
        </fieldset>

        {/* EVOLUÇÃO POR MARCOS NARRATIVOS */}
        <fieldset className="ficha-fieldset ficha-evo no-print">
          <legend>Evolução (Marcos Narrativos)</legend>
          <p className="ficha-evo-saldo">Disponíveis: <strong>{marcosDisponiveis}</strong> Marcos Narrativos</p>

          <div className="ficha-evo-grid">
            <div className="ficha-evo-bloco">
              <span className="ficha-evo-label">Corpo e Mente</span>
              <div className="ficha-evo-linha">
                <button className="ficha-evo-btn" onClick={() => comprarPV(true)}>+6 PV (fixo) — {CUSTOS_EVOLUCAO.pv} MN</button>
                <button className="ficha-evo-btn" onClick={() => comprarPV(false)}>+PV (1d10, mín. 4) — {CUSTOS_EVOLUCAO.pv} MN</button>
              </div>
              <div className="ficha-evo-linha">
                <button className="ficha-evo-btn" disabled={ficha.determinacao_comprada} onClick={comprarDeterminacao}>
                  +1 Determinação Máxima — {CUSTOS_EVOLUCAO.determinacao} MN {ficha.determinacao_comprada ? '(adquirido)' : ''}
                </button>
                <button className="ficha-evo-btn" disabled={(parseInt(ficha.sanidade_max) || 0) >= CUSTOS_EVOLUCAO.sanidadeTeto} onClick={comprarSanidade}>
                  +1 Sanidade Máxima (até {CUSTOS_EVOLUCAO.sanidadeTeto}) — {CUSTOS_EVOLUCAO.sanidade} MN
                </button>
              </div>
            </div>

            <div className="ficha-evo-bloco">
              <span className="ficha-evo-label">Atributos</span>
              <div className="ficha-evo-linha">
                <select value={evoAtributo} onChange={e => setEvoAtributo(e.target.value)}>
                  {ATRIBUTOS.map(a => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
                </select>
                <button className="ficha-evo-btn" onClick={comprarAtributo}>+1 Atributo — {CUSTOS_EVOLUCAO.atributo} MN</button>
              </div>
              <p className="ficha-evo-nota">Nenhum atributo pode ultrapassar o valor atual de Determinação.</p>
            </div>

            <div className="ficha-evo-bloco">
              <span className="ficha-evo-label">Perícias</span>
              <div className="ficha-evo-linha">
                <select value={evoPericia} onChange={e => setEvoPericia(e.target.value)}>
                  {Object.values(PERICIAS).flat().map(p => <option key={p} value={p}>{p} ({pericias[p]?.bonus || 'sem treino'})</option>)}
                </select>
                <button className="ficha-evo-btn" disabled={estagioPericiaEvo < 0 || estagioPericiaEvo >= 5} onClick={evoluirPericia}>
                  {estagioPericiaEvo < 0 ? 'Bônus fora da progressão' : estagioPericiaEvo >= 5 ? 'Nível máximo' : `Evoluir para ${PERICIA_BONUS_SEQ[estagioPericiaEvo + 1]} — ${custoProximoPericia} MN`}
                </button>
              </div>
              <div className="ficha-evo-linha">
                <select value={evoEspecPericia} onChange={e => setEvoEspecPericia(e.target.value)}>
                  {Object.values(PERICIAS).flat().map(p => <option key={p} value={p}>{p} ({pericias[p]?.bonus || 'sem treino'})</option>)}
                </select>
                <button className="ficha-evo-btn" onClick={comprarEspecializacao}>Especialização (requer +3) — {CUSTOS_EVOLUCAO.especializacao} MN</button>
              </div>
            </div>

            <div className="ficha-evo-bloco">
              <span className="ficha-evo-label">Talentos ({ficha.talentos_lista.length}/{CUSTOS_EVOLUCAO.talentosLimite})</span>
              <div className="ficha-evo-linha">
                <select value={evoTalento} onChange={e => setEvoTalento(e.target.value)}>
                  <option value="">Selecione um talento…</option>
                  {talentosDisponiveisEvo.map(t => <option key={t.nome} value={t.nome}>{t.nome} ({t.categoria})</option>)}
                </select>
                <button className="ficha-evo-btn" disabled={!evoTalento || ficha.talentos_lista.length >= CUSTOS_EVOLUCAO.talentosLimite} onClick={comprarTalento}>
                  Comprar Talento — {CUSTOS_EVOLUCAO.talento} MN
                </button>
              </div>
            </div>

            <div className="ficha-evo-bloco ficha-evo-bloco-wide">
              <span className="ficha-evo-label">Recursos Narrativos</span>
              <div className="ficha-evo-linha">
                <select value={evoRecursoFlat} onChange={e => setEvoRecursoFlat(e.target.value)}>
                  {Object.entries(CUSTOS_EVOLUCAO.recursos).map(([nome, custo]) => <option key={nome} value={nome}>{nome} — {custo} MN</option>)}
                </select>
                <button className="ficha-evo-btn" onClick={comprarRecursoFlat}>Comprar</button>
              </div>
              <div className="ficha-evo-linha">
                <select value={evoArmaCategoria} onChange={e => { setEvoArmaCategoria(e.target.value); setEvoArmaEscolhida('') }}>
                  <option value="simples">Arma Simples — {CUSTOS_EVOLUCAO.armaCategoria.simples} MN</option>
                  <option value="disparo">Arma de Disparo (até o Título atual) — {CUSTOS_EVOLUCAO.armaCategoria.disparo} MN</option>
                  <option value="fogo">Arma de Fogo (até o Título atual) — {CUSTOS_EVOLUCAO.armaCategoria.fogo} MN</option>
                </select>
                <select value={evoArmaEscolhida} onChange={e => setEvoArmaEscolhida(e.target.value)}>
                  <option value="">Selecione a arma…</option>
                  {armasDisponiveisEvo.map(a => <option key={a.nome} value={a.nome}>{a.nome}</option>)}
                </select>
                <button className="ficha-evo-btn" disabled={!evoArmaEscolhida} onClick={comprarArmaRecurso}>Comprar</button>
              </div>
              <div className="ficha-evo-linha">
                <select value={evoEquipEscolhido} onChange={e => setEvoEquipEscolhido(e.target.value)}>
                  <option value="">Equipamento (até o Título atual) — {CUSTOS_EVOLUCAO.equipamento} MN…</option>
                  {equipamentosDisponiveisEvo.map(eq => <option key={eq.nome} value={eq.nome}>{eq.nome}</option>)}
                </select>
                <button className="ficha-evo-btn" disabled={!evoEquipEscolhido} onClick={comprarEquipamentoRecurso}>Comprar</button>
              </div>
              {tierAtualFicha < 0 && (
                <p className="ficha-evo-nota">Defina "Nível da Campanha" (em Identificação) com um dos 5 nomes de título para liberar as armas/equipamentos daquele tier.</p>
              )}
            </div>
          </div>

          {ficha.historico_evolucao?.length > 0 && (
            <div className="ficha-evo-historico">
              <span className="ficha-nota-label">Histórico de Compras</span>
              <ul>
                {ficha.historico_evolucao.map((h, i) => <li key={i}>{h.label} <span>— {h.custo} MN</span></li>)}
              </ul>
            </div>
          )}
        </fieldset>

        {/* ANOTAÇÕES */}
        <fieldset className="ficha-fieldset">
          <legend>Anotações</legend>
          <textarea rows="5" value={ficha.anotacoes} onChange={e => update('anotacoes', e.target.value)} className="ficha-textarea-full" />
        </fieldset>
      </div>
    </div>
  )
}

export default FichaEmJogo
