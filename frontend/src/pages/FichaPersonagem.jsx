import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './FichaPersonagem.css'

const PERICIAS = {
  'Físicas / Combate': ['Atletismo', 'Constituição', 'Furtividade', 'Luta', 'Pontaria', 'Pilotagem'],
  'Sobrevivência': ['Mecânica', 'Medicina', 'Percepção', 'Sobrevivência', 'Tecnologia'],
  'Sociais': ['Intimidação', 'Empatia', 'Enganação', 'Liderança', 'Persuasão'],
  'Intelectuais': ['Adestramento', 'Conhecimento', 'Estratégia', 'Iniciativa', 'Investigação', 'Vontade'],
}

// Bloco de leitura para dados gerados na criação (talento, arma, equipamento, item):
// deixa Nome / Tipo-Categoria / Efeito visualmente distintos — um <textarea> não
// consegue estilizar só um trecho do texto, por isso isso é renderizado como HTML.
function NotaBloco({ item, badge }) {
  if (!item) return null
  return (
    <div className="ficha-nota">
      <div className="ficha-nota-header">
        <span className="ficha-nota-nome">{item.nome}</span>
        {badge && <span className="ficha-nota-badge">{badge}</span>}
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

function FichaPersonagem() {
  const [ficha, setFicha] = useState({
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
    protecao_cabeca: '', protecao_tronco: '', protecao_msup: '', protecao_minf: '', protecao_notas: [],
    transporte_tronco: '', transporte_msup: '', transporte_minf: '', transporte_notas: [],
    carga_atual: '', carga_max: '', inventario: '', kit_estruturado: null,
    talento_exclusivo: '', talentos_lista: [], talentos_obs: '', anotacoes: '',
  })

  const [pericias, setPericias] = useState(() => {
    const init = {}
    Object.values(PERICIAS).flat().forEach(p => {
      init[p] = { bonus: '', nv: '', esp: '' }
    })
    return init
  })

  const [periciasObs, setPericiasObs] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('zona-z-ficha')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.ficha) setFicha(prev => ({ ...prev, ...data.ficha }))
        if (data.pericias) setPericias(prev => ({ ...prev, ...data.pericias }))
        if (data.periciasObs) setPericiasObs(data.periciasObs)
        localStorage.removeItem('zona-z-ficha')
      } catch { /* ignore */ }
    }
  }, [])

  const update = (field, value) => setFicha(prev => ({ ...prev, [field]: value }))
  const updatePericia = (name, field, value) => setPericias(prev => ({
    ...prev, [name]: { ...prev[name], [field]: value }
  }))

  const handleExportPDF = () => window.print()

  const handleExportJSON = () => {
    const data = { ficha, pericias, periciasObs }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ficha-${ficha.nome || 'personagem'}.json`
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
        if (data.ficha) setFicha(data.ficha)
        if (data.pericias) setPericias(data.pericias)
        if (data.periciasObs) setPericiasObs(data.periciasObs)
      } catch { /* ignore */ }
    }
    reader.readAsText(file)
  }

  return (
    <div className="ficha-page">
      <div className="ficha-toolbar no-print">
        <Link to="/criar-personagem" className="ficha-btn criar">Criar Personagem</Link>
        <h1 className="ficha-toolbar-title">Ficha de Personagem</h1>
        <div className="ficha-toolbar-actions">
          <label className="ficha-btn import">
            Importar JSON
            <input type="file" accept=".json" onChange={handleImport} hidden />
          </label>
          <button className="ficha-btn pdf" onClick={handleExportPDF}>Exportar PDF</button>
          <button className="ficha-btn json" onClick={handleExportJSON}>Exportar JSON</button>
        </div>
      </div>

      <div className="ficha-sheet">
        <h2 className="ficha-title">Ficha de Personagem</h2>

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
            <label className="ficha-field"><span>Observações</span><input value={ficha.observacoes} onChange={e => update('observacoes', e.target.value)} /></label>
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
            {['forca', 'agilidade', 'destreza', 'intelecto', 'presenca'].map(a => (
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
          </fieldset>

          <fieldset className="ficha-fieldset">
            <legend>Combate e Sobrevivência</legend>
            <div className="ficha-row">
              <label className="ficha-field sm"><span>CA</span><input value={ficha.ca_atual} onChange={e => update('ca_atual', e.target.value)} /></label>
              <label className="ficha-field sm"><span>Bônus</span><input value={ficha.ca_bonus} onChange={e => update('ca_bonus', e.target.value)} /></label>
            </div>
            <label className="ficha-field full"><span>Observação</span><input value={ficha.ca_obs} onChange={e => update('ca_obs', e.target.value)} /></label>
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

        {/* INVENTÁRIO + ARMAS + EQUIPAMENTOS — cards que se distribuem para ocupar
            a página inteira, sem colunas fixas desbalanceadas. */}
        <div className="ficha-cards">
          <fieldset className="ficha-fieldset ficha-card">
            <legend>Inventário</legend>
            <div className="ficha-row">
              <label className="ficha-field sm"><span>Carga Atual</span><input value={ficha.carga_atual} onChange={e => update('carga_atual', e.target.value)} /></label>
              <label className="ficha-field sm"><span>Carga Máxima</span><input value={ficha.carga_max} onChange={e => update('carga_max', e.target.value)} /></label>
            </div>
            <label className="ficha-field full"><span>Itens Guardados</span><textarea rows="6" value={ficha.inventario} onChange={e => update('inventario', e.target.value)} /></label>
          </fieldset>

          <fieldset className="ficha-fieldset ficha-card">
            <legend>Inventário dos Kits</legend>
            {ficha.kit_estruturado ? (
              <div className="ficha-nota">
                <div className="ficha-nota-header">
                  <span className="ficha-nota-nome">{ficha.kit_estruturado.nome}</span>
                  <span className="ficha-nota-badge">Carga {ficha.kit_estruturado.carga}</span>
                </div>
                {ficha.kit_estruturado.arma && (
                  <div className="ficha-nota-subtitulo">Arma do kit: {ficha.kit_estruturado.arma}</div>
                )}
                {ficha.kit_estruturado.itens?.length > 0 && (
                  <p className="ficha-nota-desc">Itens: {ficha.kit_estruturado.itens.join(', ')}</p>
                )}
              </div>
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
          </fieldset>

          <fieldset className="ficha-fieldset ficha-card">
            <legend>Equipamentos — Proteção</legend>
            {[['Cabeça', 'protecao_cabeca'], ['Tronco ou Corpo', 'protecao_tronco'], ['Membros Superiores', 'protecao_msup'], ['Membros Inferiores', 'protecao_minf']].map(([l, f]) => (
              <label key={f} className="ficha-field full"><span>{l}</span><input value={ficha[f]} onChange={e => update(f, e.target.value)} /></label>
            ))}
            <span className="ficha-nota-label">Anotação ou Combos</span>
            {ficha.protecao_notas?.length > 0
              ? ficha.protecao_notas.map((item, i) => <NotaBloco key={i} item={item} />)
              : <p className="ficha-nota-vazio">—</p>}
          </fieldset>

          <fieldset className="ficha-fieldset ficha-card">
            <legend>Equipamentos — Transporte</legend>
            {[['Tronco', 'transporte_tronco'], ['Membros Superiores', 'transporte_msup'], ['Membros Inferiores', 'transporte_minf']].map(([l, f]) => (
              <label key={f} className="ficha-field full"><span>{l}</span><input value={ficha[f]} onChange={e => update(f, e.target.value)} /></label>
            ))}
            <span className="ficha-nota-label">Anotação ou Combos</span>
            {ficha.transporte_notas?.length > 0
              ? ficha.transporte_notas.map((item, i) => <NotaBloco key={i} item={item} />)
              : <p className="ficha-nota-vazio">—</p>}
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

        {/* ANOTAÇÕES */}
        <fieldset className="ficha-fieldset">
          <legend>Anotações</legend>
          <textarea rows="5" value={ficha.anotacoes} onChange={e => update('anotacoes', e.target.value)} className="ficha-textarea-full" />
        </fieldset>
      </div>
    </div>
  )
}

export default FichaPersonagem
