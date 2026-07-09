import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './CriarPersonagem.css'

const STEPS = ['Conceito', 'Nível da Campanha', 'Antecedente', 'Atributos', 'Talentos', 'Perícias', 'Finalizar']

const ATRIBUTOS = ['forca', 'agilidade', 'destreza', 'intelecto', 'presenca']

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
// feita depois que o antecedente já foi resolvido no servidor).
function aplicarOpcaoPacote(op, pac) {
  if (op.tipo === 'protecao') {
    op.regioes.forEach(slot => { if (slot in pac.protecao) pac.protecao[slot] = op.nome })
    pac.defesa_total += op.defesa || 0
    pac.protecao_notas.push(op.estruturado)
  } else if (op.tipo === 'transporte') {
    op.regioes.forEach(slot => { if (slot in pac.transporte) pac.transporte[slot] = op.nome })
    pac.carga_bonus_total += op.carga_bonus || 0
    pac.transporte_notas.push(op.estruturado)
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
  const [char, setChar] = useState({
    nome: '', idade: '', altura: '', historico: '',
    tituloSobrevivencia: 'Sobrevivente Básico',
    antecedente: null,
    escolhaAtributoFixo: '',
    escolhaAtributoLivre: '',
    escolhaPericiaSecundaria: '',
    escolhaPacote: {},
    atributos: { forca: 0, agilidade: 0, destreza: 0, intelecto: 0, presenca: 0 },
    talentosSelecionados: [],
    periciasSelecionadas: [],
  })
  const navigate = useNavigate()

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

  const buildFicha = () => {
    const bonusAttr = {}
    if (atributoFixoResolvido) {
      bonusAttr[atributoFixoResolvido] = (bonusAttr[atributoFixoResolvido] || 0) + bonusParsed.atributoValor
    }

    let bonusDet = 0
    let bonusSanidade = 0
    let bonusDefesa = 0
    if (bonusParsed.extra?.tipo === 'atributo_livre') {
      bonusAttr[atributoLivreResolvido] = (bonusAttr[atributoLivreResolvido] || 0) + bonusParsed.extra.valor
    } else if (bonusParsed.extra?.tipo === 'determinacao') {
      bonusDet = bonusParsed.extra.valor
    } else if (bonusParsed.extra?.tipo === 'sanidade') {
      bonusSanidade = bonusParsed.extra.valor
    } else if (bonusParsed.extra?.tipo === 'defesa') {
      bonusDefesa = bonusParsed.extra.valor
    }

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
      protecao_notas: [...(pacOriginal.protecao_notas || [])],
      transporte_notas: [...(pacOriginal.transporte_notas || [])],
      itens_gerais: [...(pacOriginal.itens_gerais || [])],
    }
    ;(pacOriginal.escolhas || []).forEach(esc => {
      const escolhaNome = char.escolhaPacote[esc.texto]
      const op = esc.opcoes.find(o => o.nome === escolhaNome) || esc.opcoes[0]
      aplicarOpcaoPacote(op, pac)
    })

    const det = regras.determinacao_base + bonusDet
    const pv = regras.pv_base + bonusParsed.vida
    const sanidade = regras.sanidade_base + bonusSanidade
    const ca = regras.ca_base + bonusDefesa + pac.defesa_total
    const forcaFinal = char.atributos.forca + (bonusAttr.forca || 0)

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

    const ficha = {
      nome: char.nome, profissao: selectedAnt?.titulo || '', idade: char.idade,
      titulo_sobrevivencia: char.tituloSobrevivencia,
      altura: char.altura, deslocamento: `${regras.movimento_base}m`, observacoes: '', historico: char.historico,
      forca_atual: '',
      forca_max: String(forcaFinal),
      agilidade_atual: '',
      agilidade_max: String(char.atributos.agilidade + (bonusAttr.agilidade || 0)),
      destreza_atual: '',
      destreza_max: String(char.atributos.destreza + (bonusAttr.destreza || 0)),
      intelecto_atual: '',
      intelecto_max: String(char.atributos.intelecto + (bonusAttr.intelecto || 0)),
      presenca_atual: '',
      presenca_max: String(char.atributos.presenca + (bonusAttr.presenca || 0)),
      infeccao_atual: '', infeccao_max: String(regras.resistencia_infeccao),
      pv_atual: '', pv_max: String(pv),
      determinacao_atual: '', determinacao_max: String(det),
      sanidade_atual: '', sanidade_max: String(sanidade),
      ca_atual: String(ca), ca_bonus: '', ca_obs: '', descricoes: '',
      arma1_nome: armaNome, arma1_carga: String(armaCarga), arma1_estruturada: arma1Estruturada,
      arma2_nome: '', arma2_carga: '', arma2_notas: '',
      protecao_cabeca: pac.protecao.cabeca, protecao_tronco: pac.protecao.tronco,
      protecao_msup: pac.protecao.msup, protecao_minf: pac.protecao.minf,
      protecao_notas: pac.protecao_notas,
      transporte_tronco: pac.transporte.tronco, transporte_msup: pac.transporte.msup,
      transporte_minf: pac.transporte.minf,
      transporte_notas: pac.transporte_notas,
      carga_atual: String(cargaAtualTotal), carga_max: String(10 + forcaFinal * 5 + pac.carga_bonus_total),
      inventario: pac.itens_gerais.map(i => `${i.nome}${i.descricao ? ` — ${i.descricao}` : ''}${i.efeito ? ` Efeito: ${i.efeito}` : ''}`).join('\n'),
      kit_estruturado: pac.kit,
      talento_exclusivo: '',
      talentos_lista: talentosLista,
      talentos_obs: '',
      anotacoes: '',
    }

    const pericias = {}
    builderData.all_pericias.forEach(p => { pericias[p] = { bonus: '', nv: '', esp: '' } })
    if (antPericiaPrimaria && pericias[antPericiaPrimaria]) pericias[antPericiaPrimaria].bonus = '+2'
    periciasSecundariasFinal.forEach(p => { if (pericias[p]) pericias[p].bonus = '+1' })
    char.periciasSelecionadas.forEach(p => { if (pericias[p]) pericias[p].bonus = '+1' })

    const data = { ficha, pericias, periciasObs: '' }

    localStorage.setItem('zona-z-ficha', JSON.stringify(data))
    navigate('/ficha')
  }

  return (
    <div className="criar-page">
      <div className="criar-hero">
        <h1 className="criar-title">Criar Personagem</h1>
        <p className="criar-subtitle">Passo a passo para montar seu sobrevivente</p>
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
                const selected = char.tituloSobrevivencia === tit
                return (
                  <button key={i}
                    className={`criar-titulo-card ${selected ? 'selected' : ''}`}
                    onClick={() => setChar({...char, tituloSobrevivencia: tit})}>
                    <span className="criar-titulo-name">{tit}</span>
                    <span className={`criar-titulo-tag ${isBasico ? 'basico' : 'pendente'}`}>
                      {isBasico ? 'Valores base do passo a passo' : 'Bônus complementares em breve'}
                    </span>
                  </button>
                )
              })}
            </div>
            {char.tituloSobrevivencia !== 'Sobrevivente Básico' && (
              <p className="criar-titulo-aviso">
                Este título ainda não tem os bônus complementares cadastrados no sistema — a ficha será gerada com os valores base de <strong>Sobrevivente Básico</strong> mesmo assim. O nome do título fica registrado na ficha para referência do Mestre.
              </p>
            )}
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

        {/* STEP 3: Atributos */}
        {step === 3 && (
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

        {/* STEP 4: Talentos */}
        {step === 4 && (
          <div className="criar-panel">
            <h2>Escolha {regras.talentos_iniciais} Talentos</h2>
            <p className="criar-desc">Selecionados: {char.talentosSelecionados.length}/{regras.talentos_iniciais}</p>
            {builderData.talentos.map((cat, ci) => (
              <div key={ci} className="criar-tal-cat">
                <h3>{cat.categoria}</h3>
                <div className="criar-tal-grid">
                  {cat.itens.map((tal, ti) => {
                    const selected = char.talentosSelecionados.some(t => t.nome === tal.nome)
                    return (
                      <div key={ti} className="criar-tal-wrapper">
                        <button
                          className={`criar-tal-card ${selected ? 'selected' : ''}`}
                          disabled={!selected && char.talentosSelecionados.length >= regras.talentos_iniciais}
                          onClick={() => {
                            if (selected) setChar({...char, talentosSelecionados: char.talentosSelecionados.filter(t => t.nome !== tal.nome)})
                            else setChar({...char, talentosSelecionados: [...char.talentosSelecionados, tal]})
                          }}>
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

        {/* STEP 5: Perícias */}
        {step === 5 && (
          <div className="criar-panel">
            <h2>Escolha {periciasLivresTotal} Perícias Livres</h2>
            <p className="criar-desc">Do antecedente: {antPericiaPrimaria} (+2 primária){periciasSecundariasFinal.length > 0 ? `, ${periciasSecundariasFinal.join(', ')} (+1 secundária)` : ''}. Escolha mais {periciasLivresTotal} (+1 cada) — {regras.pericias_livres} base + {char.atributos.intelecto || 0} de Intelecto.</p>
            <div className="criar-pericias-grid">
              {Object.entries(builderData.pericias).map(([cat, list]) => (
                <div key={cat} className="criar-pericia-col">
                  <h4>{cat}</h4>
                  {list.map(p => {
                    const fromAnt = periciasDoAntecedente.includes(p)
                    const selected = char.periciasSelecionadas.includes(p)
                    return (
                      <button key={p}
                        className={`criar-pericia-btn ${fromAnt ? 'from-ant' : ''} ${selected ? 'selected' : ''}`}
                        disabled={fromAnt || (!selected && char.periciasSelecionadas.length >= periciasLivresTotal)}
                        onClick={() => {
                          if (fromAnt) return
                          if (selected) setChar({...char, periciasSelecionadas: char.periciasSelecionadas.filter(x => x !== p)})
                          else setChar({...char, periciasSelecionadas: [...char.periciasSelecionadas, p]})
                        }}>
                        {fromAnt && <span className="criar-pericia-badge">ANT</span>}
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

        {/* STEP 6: Finalizar */}
        {step === 6 && (
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
