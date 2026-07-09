import { useState, useEffect } from 'react'
import './Pagina6Ameacas.css'

function Pagina6Ameacas() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState(0)
  const [activeSubsection, setActiveSubsection] = useState(null)
  const [expandedCreature, setExpandedCreature] = useState(null)

  useEffect(() => {
    fetch('/api/pagina/6')
      .then(res => res.json())
      .then(json => { setData(json); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    setActiveSubsection(null)
    setExpandedCreature(null)
    setTimeout(() => {
      const el = document.querySelector('.p6-section-title')
      if (el) {
        const offset = el.getBoundingClientRect().top + window.scrollY - 140
        window.scrollTo({ top: offset, behavior: 'smooth' })
      }
    }, 50)
  }, [activeSection])

  if (loading) return <div className="loading-screen"><div className="loading-icon"></div><p className="loading-text">Carregando ameaças...</p></div>
  if (!data) return null

  const cap = data.capitulos?.[0]
  const sections = cap?.subsecoes || []
  const curSec = sections[activeSection]
  const subsections = curSec?.subsecoes || []

  const displayCreatures = activeSubsection !== null
    ? subsections[activeSubsection]?.criaturas || []
    : curSec?.criaturas || []
  const displayTitle = activeSubsection !== null
    ? subsections[activeSubsection]?.titulo : curSec?.titulo
  const displayIntro = activeSubsection !== null
    ? subsections[activeSubsection]?.intro || [] : curSec?.intro || []

  return (
    <div className="pagina6">
      <section className="p6-hero">
        <div className="p6-hero-overlay"></div>
        <div className="p6-hero-content">
          <h1 className="p6-hero-title">{data.titulo}</h1>
          <p className="p6-hero-subtitle">{data.subtitulo}</p>
        </div>
      </section>

      <div className="p6-layout">
        <aside className="p6-sidebar">
          <div className="p6-sidebar-header"><h3>{cap?.titulo}</h3></div>
          <ul className="p6-sidebar-nav">
            {sections.map((sec, i) => (
              <li key={i}>
                <button className={`p6-sidebar-link ${activeSection === i && activeSubsection === null ? 'active' : ''}`}
                  onClick={() => { setActiveSection(i); setActiveSubsection(null) }}>
                  {sec.titulo}
                </button>
                {activeSection === i && sec.subsecoes?.length > 0 && (
                  <ul className="p6-sidebar-sub">
                    {sec.subsecoes.map((sub, j) => (
                      <li key={j}>
                        <button className={`p6-sidebar-sublink ${activeSubsection === j ? 'active' : ''}`}
                          onClick={() => {
                            setActiveSection(i); setActiveSubsection(j); setExpandedCreature(null)
                            setTimeout(() => {
                              const el = document.querySelector('.p6-section-title')
                              if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 140, behavior: 'smooth' })
                            }, 50)
                          }}>
                          {sub.titulo}
                          <span className="p6-count">{sub.criaturas?.length || 0}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </aside>

        <main className="p6-content">
          <h2 className="p6-section-title">{displayTitle}</h2>

          {displayIntro.length > 0 && (
            <div className="p6-intro">
              {displayIntro.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          )}

          {displayCreatures.length > 0 ? (
            <div className="p6-creatures-grid">
              {displayCreatures.map((creature, i) => (
                <CreatureCard key={i} creature={creature}
                  expanded={expandedCreature === i}
                  onClick={() => setExpandedCreature(expandedCreature === i ? null : i)} />
              ))}
            </div>
          ) : (
            subsections.length > 0 && activeSubsection === null && (
              <div className="p6-hint"><p>Selecione um tipo na barra lateral.</p></div>
            )
          )}
        </main>
      </div>
    </div>
  )
}

function CreatureCard({ creature, expanded, onClick }) {
  const statFields = ['ca', 'pv', 'movimento', 'ataque', 'dano', 'poder_especial',
    'critico', 'efeito', 'efeito_adicional', 'comportamento', 'reducao_de_danos',
    'tipo', 'municao', 'padrao_ataque', 'observacao']
  const statLabels = {
    ca: 'CA', pv: 'PV', movimento: 'Movimento', ataque: 'Ataque', dano: 'Dano',
    poder_especial: 'Poder Especial', critico: 'Crítico', efeito: 'Efeito',
    efeito_adicional: 'Efeito Adicional',
    comportamento: 'Comportamento', reducao_de_danos: 'Redução de Danos',
    tipo: 'Tipo', municao: 'Munição', padrao_ataque: 'Padrão de Ataque',
    observacao: 'Observação'
  }

  return (
    <div className={`p6-creature-card ${expanded ? 'expanded' : ''}`} onClick={onClick}>
      <div className="p6-creature-header">
        <div className="p6-creature-info">
          <h3 className="p6-creature-name">{creature.nome}</h3>
          <div className="p6-creature-quick">
            {creature.ca && <span className="p6-stat-badge ca">CA {creature.ca}</span>}
            {creature.pv && <span className="p6-stat-badge pv">PV {creature.pv.split('[')[0].trim()}</span>}
            {creature.movimento && <span className="p6-stat-badge mov">{creature.movimento}</span>}
          </div>
        </div>
        <span className="p6-creature-expand">{expanded ? '−' : '+'}</span>
      </div>

      {expanded && (
        <div className="p6-creature-body">
          <div className={`p6-creature-body-layout ${creature.imagem ? 'has-image' : ''}`}>
            {creature.imagem && (
              <div className="p6-creature-image">
                <img src={`/api/img/${encodeURI(creature.imagem)}`} alt={creature.nome} loading="lazy" />
              </div>
            )}

            <div className="p6-creature-main">
              {creature.descricao && <p className="p6-creature-desc">{creature.descricao}</p>}

              <div className="p6-creature-stats">
                {statFields.map(f => creature[f] ? (
                  <div key={f} className="p6-stat-row">
                    <span className="p6-stat-label">{statLabels[f]}</span>
                    <span className="p6-stat-value">{creature[f]}</span>
                  </div>
                ) : null)}
              </div>

              {creature.armas_lista?.length > 0 && (
                <div className="p6-creature-section">
                  <h4>Armas</h4>
                  <ul>{creature.armas_lista.map((a, i) => <li key={i}>{a}</li>)}</ul>
                </div>
              )}

              {creature.ataque_detalhes?.length > 0 && (
                <div className="p6-creature-section">
                  <h4>Ataque</h4>
                  {creature.ataque_detalhes.map((a, i) => <p key={i} className="p6-ataque-detalhe">{a}</p>)}
                </div>
              )}

              {creature.habilidade_unica?.length > 0 && (
                <div className="p6-creature-section">
                  {creature.habilidade_unica.map((h, i) => (
                    <div key={i} className="p6-habilidade">
                      <h4>Habilidade Única: {h.nome}</h4>
                      {h.critico && <p><strong>Crítico:</strong> {h.critico}</p>}
                      {h.efeito && <p><strong>Efeito:</strong> {h.efeito}</p>}
                    </div>
                  ))}
                </div>
              )}

              {creature.pets?.length > 0 && (
                <div className="p6-creature-section">
                  <h4>Companheiros</h4>
                  {creature.pets.map((pet, i) => (
                    <div key={i} className="p6-pet">
                      <h5>{pet.nome}</h5>
                      {pet.ca && <span className="p6-stat-badge ca">CA {pet.ca}</span>}
                      {pet.pv && <span className="p6-stat-badge pv">PV {pet.pv}</span>}
                      {pet.movimento && <span className="p6-stat-badge mov">{pet.movimento}</span>}
                      {pet.ataque && <p><strong>Ataque:</strong> {pet.ataque}</p>}
                      {pet.efeito && <p><strong>Efeito:</strong> {pet.efeito}</p>}
                    </div>
                  ))}
                </div>
              )}

              {creature.pericias?.length > 0 && (
                <div className="p6-creature-section">
                  <h4>Perícias</h4>
                  <div className="p6-pericias-grid">
                    {creature.pericias.map((p, i) => <span key={i} className="p6-pericia">{p}</span>)}
                  </div>
                </div>
              )}

              {creature.dano_locais?.length > 0 && (
                <div className="p6-creature-section">
                  <h4>Efeitos de Dano</h4>
                  {creature.dano_locais.map((d, i) => <p key={i} className="p6-dano-local">{d}</p>)}
                </div>
              )}

              {creature.equipamentos_lista?.length > 0 && (
                <div className="p6-creature-section">
                  <h4>Equipamentos</h4>
                  <ul>{creature.equipamentos_lista.map((e, i) => <li key={i}>{e}</li>)}</ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Pagina6Ameacas
