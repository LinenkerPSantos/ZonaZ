import { useState, useEffect } from 'react'
import './Pagina4Equipamentos.css'

const CHAPTER_ICONS = { 0: '⚔️', 1: '🎒', 2: '🔧' }

function Pagina4Equipamentos() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeChapter, setActiveChapter] = useState(0)
  const [activeSection, setActiveSection] = useState(0)
  const [activeSubsection, setActiveSubsection] = useState(null)
  const [expandedItem, setExpandedItem] = useState(null)

  useEffect(() => {
    fetch('/api/pagina/4')
      .then(res => res.json())
      .then(json => { setData(json); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    setActiveSection(0)
    setActiveSubsection(null)
    setExpandedItem(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeChapter])

  useEffect(() => {
    setActiveSubsection(null)
    setExpandedItem(null)
    setTimeout(() => {
      const el = document.querySelector('.p4-section-title')
      if (el) {
        const offset = el.getBoundingClientRect().top + window.scrollY - 140
        window.scrollTo({ top: offset, behavior: 'smooth' })
      }
    }, 50)
  }, [activeSection])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-icon"></div>
        <p className="loading-text">Carregando equipamentos...</p>
      </div>
    )
  }
  if (!data) return null

  const caps = data.capitulos || []
  const curCap = caps[activeChapter]
  const sections = curCap?.secoes || []
  const curSec = sections[activeSection]
  const subsections = curSec?.subsecoes || []

  const displayItems = activeSubsection !== null
    ? subsections[activeSubsection]?.itens || []
    : curSec?.itens || []

  const displayTitle = activeSubsection !== null
    ? subsections[activeSubsection]?.titulo
    : curSec?.titulo

  const displayIntro = activeSubsection !== null
    ? subsections[activeSubsection]?.intro || []
    : curSec?.intro || []

  return (
    <div className="pagina4">
      {/* HERO */}
      <section className="p4-hero">
        <div className="p4-hero-overlay"></div>
        <div className="p4-hero-content">
          <h1 className="p4-hero-title">{data.titulo}</h1>
          <p className="p4-hero-subtitle">{data.subtitulo}</p>
        </div>
      </section>

      {/* CHAPTER TABS */}
      <nav className="p4-chapter-tabs">
        <div className="p4-tabs-wrap">
          {caps.map((cap, i) => (
            <button key={i}
              className={`p4-chapter-tab ${activeChapter === i ? 'active' : ''}`}
              onClick={() => setActiveChapter(i)}
            >
              <span className="p4-tab-icon">{CHAPTER_ICONS[i]}</span>
              <span>{cap.titulo}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="p4-layout">
        {/* SIDEBAR */}
        <aside className="p4-sidebar">
          <div className="p4-sidebar-header">
            <h3>{curCap?.titulo}</h3>
          </div>
          <ul className="p4-sidebar-nav">
            {sections.map((sec, i) => (
              <li key={i}>
                <button
                  className={`p4-sidebar-link ${activeSection === i && activeSubsection === null ? 'active' : ''}`}
                  onClick={() => { setActiveSection(i); setActiveSubsection(null) }}
                >
                  {sec.titulo}
                  {sec.itens?.length > 0 && <span className="p4-count">{sec.itens.length}</span>}
                </button>
                {activeSection === i && sec.subsecoes?.length > 0 && (
                  <ul className="p4-sidebar-sub">
                    {sec.subsecoes.map((sub, j) => (
                      <li key={j}>
                        <button
                          className={`p4-sidebar-sublink ${activeSubsection === j ? 'active' : ''}`}
                          onClick={() => {
                            setActiveSection(i); setActiveSubsection(j)
                            setTimeout(() => {
                              const el = document.querySelector('.p4-section-title')
                              if (el) {
                                const offset = el.getBoundingClientRect().top + window.scrollY - 140
                                window.scrollTo({ top: offset, behavior: 'smooth' })
                              }
                            }, 50)
                          }}
                        >
                          {sub.titulo}
                          {sub.itens?.length > 0 && <span className="p4-count">{sub.itens.length}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </aside>

        {/* CONTENT */}
        <main className="p4-content">
          <h2 className="p4-section-title">{displayTitle}</h2>

          {displayIntro.length > 0 && (
            <div className="p4-intro">
              {displayIntro.map((p, i) => {
                if (typeof p === 'object' && p.tipo) {
                  if (p.tipo === 'subtitulo') {
                    return <h3 key={i} className="p4-intro-subtitle">{p.texto}</h3>
                  }
                  if (p.tipo === 'marcador') {
                    const parts = p.texto.match(/^(.{1,60}):\s*(.+)$/)
                    return (
                      <div key={i} className="p4-intro-marker">
                        {parts ? (
                          <><span className="p4-marker-label">{parts[1]}</span><span>{parts[2]}</span></>
                        ) : (
                          <span>{p.texto}</span>
                        )}
                      </div>
                    )
                  }
                  if (p.tipo === 'introducao') {
                    return <p key={i} className="p4-intro-highlight">{p.texto}</p>
                  }
                  return <p key={i}>{p.texto}</p>
                }
                return <p key={i}>{p}</p>
              })}
            </div>
          )}

          {displayItems.length > 0 ? (
            <div className="p4-items-grid">
              {displayItems.map((item, i) => {
                const prevSub = i > 0 ? displayItems[i - 1]?.subcategoria : ''
                const showSubHeader = item.subcategoria && item.subcategoria !== prevSub
                const prevTitulo = i > 0 ? displayItems[i - 1]?.titulo_sobrevivencia : ''
                const showTituloHeader = item.titulo_sobrevivencia && item.titulo_sobrevivencia !== prevTitulo
                return (
                  <div key={i}>
                    {showTituloHeader && (
                      <div className="p4-titulo-group-header">
                        <span className="p4-titulo-icon">🛡️</span>
                        <span>{item.titulo_sobrevivencia}</span>
                      </div>
                    )}
                    {showSubHeader && (
                      <h3 className="p4-subcategory-header">{item.subcategoria}</h3>
                    )}
                    <ItemCard item={item} expanded={expandedItem === i}
                      onClick={() => setExpandedItem(expandedItem === i ? null : i)} />
                  </div>
                )
              })}
            </div>
          ) : (
            subsections.length > 0 && activeSubsection === null && (
              <div className="p4-subsection-hint">
                <p>Selecione uma subcategoria na barra lateral.</p>
              </div>
            )
          )}

        </main>
      </div>
    </div>
  )
}

function ItemCard({ item, expanded, onClick }) {
  const fields = ['tipo', 'carga', 'dano_base', 'dano', 'modificador', 'alcance',
    'mao_usada', 'defesa', 'regiao_corpo', 'municao', 'som', 'capacidade',
    'durabilidade', 'categoria', 'pre_requisito', 'uso']
  const fieldLabels = {
    tipo: 'Tipo', carga: 'Carga', dano_base: 'Dano Base', dano: 'Dano',
    modificador: 'Modificador', alcance: 'Alcance', mao_usada: 'Mão',
    defesa: 'Defesa', regiao_corpo: 'Região', municao: 'Munição',
    som: 'Som', capacidade: 'Capacidade', durabilidade: 'Durabilidade',
    categoria: 'Categoria', pre_requisito: 'Pré-requisito', uso: 'Uso'
  }

  return (
    <div className={`p4-item-card ${expanded ? 'expanded' : ''}`} onClick={onClick}>
      <div className="p4-item-header">
        {item.imagem && (
          <div className="p4-item-img">
            <img src={`/api/img/${item.imagem}`} alt={item.nome} />
          </div>
        )}
        <div className="p4-item-info">
          <h3 className="p4-item-name">{item.nome}</h3>
          <div className="p4-item-tags">
            {item.tipo && <span className="p4-tag type">{item.tipo}</span>}
            {item.carga && <span className="p4-tag">{item.carga} carga</span>}
            {item.alcance && <span className="p4-tag">{item.alcance}</span>}
            {item.defesa && <span className="p4-tag def">Def {item.defesa}</span>}
          </div>
        </div>
        <span className="p4-item-expand">{expanded ? '−' : '+'}</span>
      </div>

      {expanded && (
        <div className="p4-item-body">
          <div className="p4-item-fields">
            {fields.map(f => item[f] ? (
              <div key={f} className="p4-field">
                <span className="p4-field-label">{fieldLabels[f]}</span>
                <span className="p4-field-value">{item[f]}</span>
              </div>
            ) : null)}
          </div>

          {item.descricao && <p className="p4-item-desc">{item.descricao}</p>}

          {item.efeito && (
            <div className="p4-item-effect">
              <span>Efeito:</span> {item.efeito}
            </div>
          )}

          {item.efeito_adicional && (
            <div className="p4-item-effect">
              <span>Efeito Adicional:</span> {item.efeito_adicional}
            </div>
          )}

          {item.penalidade && (
            <div className="p4-item-penalty">
              <span>Penalidade:</span> {item.penalidade}
            </div>
          )}

          {item.materiais?.length > 0 && (
            <div className="p4-item-materials">
              <h4>Materiais</h4>
              <ul>{item.materiais.map((m, i) => <li key={i}>{m}</li>)}</ul>
            </div>
          )}

          {item.componentes?.length > 0 && (
            <div className="p4-item-materials">
              <h4>Componentes</h4>
              <ul>{item.componentes.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </div>
          )}

          {item.combo?.length > 0 && (
            <div className="p4-item-combo">
              {item.combo.map((c, i) => <span key={i}>[COMBO] {c}</span>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Pagina4Equipamentos
