import { useState, useEffect, useRef } from 'react'
import './Pagina3Antecedentes.css'

const TABS = [
  { id: 'antecedentes', label: 'Antecedentes', icon: '🎭' },
  { id: 'talentos', label: 'Talentos', icon: '⚡' },
]

function Pagina3Antecedentes() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('antecedentes')
  const [selected, setSelected] = useState(null)
  const [activeTalentoCategory, setActiveTalentoCategory] = useState(0)
  const detailRef = useRef(null)

  useEffect(() => {
    fetch('/api/pagina/3')
      .then(res => res.json())
      .then(json => {
        setData(json)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSelect = (index) => {
    setSelected(index)
    setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setSelected(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-icon"></div>
        <p className="loading-text">Carregando antecedentes...</p>
      </div>
    )
  }

  if (!data) return null

  const antecedentes = data.antecedentes || []
  const talentos = data.talentos || []
  const current = selected !== null ? antecedentes[selected] : null

  return (
    <div className="pagina3">
      {/* HERO */}
      <section className="p3-hero">
        <div className="p3-hero-overlay"></div>
        <img
          src={`/api/img/${data.capa}`}
          alt="Antecedentes"
          className="p3-hero-img"
        />
        <div className="p3-hero-content">
          <h1 className="p3-hero-title">{data.titulo}</h1>
          <p className="p3-hero-subtitle">{data.subtitulo}</p>
        </div>
      </section>

      {/* TABS */}
      <nav className="p3-tabs">
        <div className="p3-tabs-container">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`p3-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <span className="p3-tab-icon">{tab.icon}</span>
              <span className="p3-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* TAB: ANTECEDENTES */}
      {activeTab === 'antecedentes' && (
        <>
          {/* INTRO */}
          {data.intro?.length > 0 && (
            <section className="p3-intro">
              <div className="p3-container">
                {data.intro.map((p, i) => (
                  <p key={i} className="p3-intro-text">{p}</p>
                ))}
              </div>
            </section>
          )}

          {/* GRID DE ANTECEDENTES */}
          <section className="p3-grid-section">
            <div className="p3-container">
              <h2 className="p3-section-title">Escolha seu Antecedente</h2>
              <div className="p3-grid">
                {antecedentes.map((ant, i) => (
                  <button
                    key={i}
                    className={`p3-card ${selected === i ? 'active' : ''}`}
                    onClick={() => handleSelect(i)}
                  >
                    {ant.icone && (
                      <div className="p3-card-icon">
                        <img src={`/api/img/${ant.icone}`} alt={ant.titulo} />
                      </div>
                    )}
                    <span className="p3-card-name">{ant.titulo}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* DETALHE DO ANTECEDENTE */}
          {current && (
            <section className="p3-detail" ref={detailRef}>
              <div className="p3-container">
                <div className="p3-detail-layout">
                  <div className="p3-detail-image-col">
                    {current.imagem && (
                      <div className="p3-detail-image-wrapper">
                        <img
                          src={`/api/img/${current.imagem}`}
                          alt={current.titulo}
                          className="p3-detail-image"
                        />
                      </div>
                    )}
                    {current.icone && (
                      <div className="p3-detail-icon-badge">
                        <img src={`/api/img/${current.icone}`} alt="" />
                      </div>
                    )}
                  </div>

                  <div className="p3-detail-content-col">
                    <h2 className="p3-detail-title">{current.titulo}</h2>

                    <div className="p3-detail-desc">
                      {current.descricao.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>

                    <div className="p3-detail-info-grid">
                      {current.tracos && (
                        <div className="p3-info-card">
                          <h4>Traços Marcantes</h4>
                          <p>{current.tracos}</p>
                        </div>
                      )}
                      {current.ocupacoes && (
                        <div className="p3-info-card">
                          <h4>Ocupações Anteriores</h4>
                          <p>{current.ocupacoes}</p>
                        </div>
                      )}
                      {current.forcas && (
                        <div className="p3-info-card strength">
                          <h4>Forças no Novo Mundo</h4>
                          <p>{current.forcas}</p>
                        </div>
                      )}
                      {current.fraquezas && (
                        <div className="p3-info-card weakness">
                          <h4>Fraquezas no Novo Mundo</h4>
                          <p>{current.fraquezas}</p>
                        </div>
                      )}
                    </div>

                    <div className="p3-stats-row">
                      {current.bonus.length > 0 && (
                        <div className="p3-stat-block">
                          <h4>Bônus Inicial</h4>
                          <ul>
                            {current.bonus.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {current.pacote.length > 0 && (
                        <div className="p3-stat-block">
                          <h4>Pacote Inicial</h4>
                          <ul>
                            {current.pacote.map((p, i) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="p3-pericias">
                      {current.pericia_primaria && (
                        <div className="p3-pericia-tag primary">
                          <span className="p3-pericia-label">Perícia Primária</span>
                          <span className="p3-pericia-value">{current.pericia_primaria}</span>
                        </div>
                      )}
                      {current.pericias_secundarias && (
                        <div className="p3-pericia-tag secondary">
                          <span className="p3-pericia-label">Perícias Secundárias</span>
                          <span className="p3-pericia-value">{current.pericias_secundarias}</span>
                        </div>
                      )}
                    </div>

                    {current.talento?.nome && (
                      <div className="p3-talento">
                        <div className="p3-talento-header">
                          <h4>Talento Exclusivo</h4>
                          <span className="p3-talento-name">{current.talento.nome}</span>
                        </div>
                        {current.talento.tipo && (
                          <p className="p3-talento-tipo">{current.talento.tipo}</p>
                        )}
                        {current.talento.descricao && (
                          <p className="p3-talento-desc">{current.talento.descricao}</p>
                        )}
                        {current.talento.efeito && (
                          <div className="p3-talento-efeito">
                            <span>Efeito:</span> {current.talento.efeito}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p3-detail-nav">
                  <button
                    className="p3-nav-btn"
                    disabled={selected === 0}
                    onClick={() => handleSelect(selected - 1)}
                  >
                    ← Anterior
                  </button>
                  <button
                    className="p3-nav-btn"
                    onClick={() => { setSelected(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  >
                    Ver Todos
                  </button>
                  <button
                    className="p3-nav-btn"
                    disabled={selected === antecedentes.length - 1}
                    onClick={() => handleSelect(selected + 1)}
                  >
                    Próximo →
                  </button>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* TAB: TALENTOS */}
      {activeTab === 'talentos' && (
        <section className="p3-talentos-section">
          <div className="p3-container">
            {/* Intro dos talentos */}
            {data.talentos_intro?.length > 0 && (
              <div className="p3-talentos-intro">
                {data.talentos_intro.map((item, i) => {
                  const texto = typeof item === 'string' ? item : item.texto
                  const tipo = typeof item === 'string' ? 'paragrafo' : item.tipo

                  if (tipo === 'marcador') {
                    const parts = texto.match(/^(.{1,60}):\s*(.+)$/)
                    return (
                      <div key={i} className="p3-marker">
                        {parts ? (
                          <>
                            <span className="p3-marker-label">{parts[1]}</span>
                            <span className="p3-marker-text">{parts[2]}</span>
                          </>
                        ) : (
                          <span className="p3-marker-text">{texto}</span>
                        )}
                      </div>
                    )
                  }

                  if (tipo === 'introducao') {
                    return <p key={i} className="p3-intro-highlight">{texto}</p>
                  }

                  return <p key={i}>{texto}</p>
                })}
              </div>
            )}

            {talentos.length > 0 ? (
              <>
                {/* Sub-abas por categoria */}
                <div className="p3-talentos-subtabs">
                  {talentos.map((cat, i) => (
                    <button
                      key={i}
                      className={`p3-talentos-subtab ${activeTalentoCategory === i ? 'active' : ''}`}
                      onClick={() => setActiveTalentoCategory(i)}
                    >
                      {cat.titulo}
                      <span className="p3-subtab-count">{cat.itens?.length || 0}</span>
                    </button>
                  ))}
                </div>

                {/* Talentos da categoria ativa */}
                <div className="p3-talento-categoria">
                  <h2 className="p3-section-title">{talentos[activeTalentoCategory]?.titulo}</h2>
                  <div className="p3-talentos-grid">
                    {talentos[activeTalentoCategory]?.itens?.map((tal, j) => (
                      <div key={j} className="p3-talento-wrapper">
                        <div className="p3-talento-card">
                          <span className="p3-talento-card-name">{tal.nome}</span>
                        </div>
                        <div className="p3-talento-tooltip">
                          <strong>{tal.nome}</strong>
                          {tal.subcategoria && (
                            <span className="p3-talento-card-subcat">{tal.subcategoria}</span>
                          )}
                          {tal.tipo && (
                            <p className="p3-talento-tooltip-tipo"><span>Tipo:</span> {tal.tipo}</p>
                          )}
                          {tal.descricao && <p className="p3-talento-tooltip-desc">{tal.descricao}</p>}
                          {tal.efeito && (
                            <p className="p3-talento-tooltip-efeito">
                              <span>Efeito:</span> {tal.efeito}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="p3-placeholder">
                <div className="p3-placeholder-icon">⚡</div>
                <p>Conteúdo de Talentos será adicionado em breve.</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

export default Pagina3Antecedentes
