import { useState, useEffect } from 'react'
import './Pagina5GuiaMestre.css'

function RichText({ text }) {
  if (!text || !text.includes('<hl>')) return text
  const parts = text.split(/(<hl>.*?<\/hl>)/g)
  return parts.map((part, i) => {
    const match = part.match(/^<hl>(.*?)<\/hl>$/)
    if (match) return <strong key={i} className="p5-highlight">{match[1]}</strong>
    return part
  })
}

function Pagina5GuiaMestre() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeChapter, setActiveChapter] = useState(0)
  const [activeSection, setActiveSection] = useState(null)

  useEffect(() => {
    fetch('/api/pagina/5')
      .then(res => res.json())
      .then(json => { setData(json); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    setActiveSection(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeChapter])

  useEffect(() => {
    setTimeout(() => {
      const el = document.querySelector('.p5-section-title, .p5-section-bg-title')
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
        <p className="loading-text">Carregando guia do mestre...</p>
      </div>
    )
  }
  if (!data) return null

  const caps = data.capitulos || []
  const curCap = caps[activeChapter]
  const sections = curCap?.subsecoes || []
  const curSec = activeSection !== null ? sections[activeSection] : null
  const bgImage = curCap?.imagem_fundo || ''

  return (
    <div className="pagina5">
      {/* HERO with chapter background */}
      <section className="p5-hero" style={bgImage ? { backgroundImage: `url(/api/img/${encodeURI(bgImage)})` } : {}}>
        <div className="p5-hero-overlay"></div>
        <div className="p5-hero-content">
          <h1 className="p5-hero-title">{data.titulo}</h1>
          <p className="p5-hero-subtitle">{data.subtitulo}</p>
        </div>
      </section>

      {/* CHAPTER TABS */}
      <nav className="p5-chapter-tabs">
        <div className="p5-tabs-wrap">
          {caps.map((cap, i) => (
            <button key={i}
              className={`p5-chapter-tab ${activeChapter === i ? 'active' : ''}`}
              onClick={() => setActiveChapter(i)}
            >
              {cap.titulo}
            </button>
          ))}
        </div>
      </nav>

      <div className="p5-layout">
        {/* SIDEBAR */}
        <aside className="p5-sidebar">
          <div className="p5-sidebar-header">
            <h3>{curCap?.titulo}</h3>
          </div>

          {/* Chapter intro link */}
          {curCap?.conteudo?.length > 0 && (
            <button
              className={`p5-sidebar-link ${activeSection === null ? 'active' : ''}`}
              onClick={() => setActiveSection(null)}
            >
              Introdução
            </button>
          )}

          <ul className="p5-sidebar-nav">
            {sections.map((sec, i) => (
              <li key={i}>
                <button
                  className={`p5-sidebar-link ${activeSection === i ? 'active' : ''}`}
                  onClick={() => setActiveSection(i)}
                >
                  {sec.titulo}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* CONTENT */}
        <main className="p5-content">
          {/* Chapter bg banner */}
          {curSec?.imagem_fundo && (
            <div className="p5-section-bg" style={{ backgroundImage: `url(/api/img/${encodeURI(curSec.imagem_fundo)})` }}>
              <div className="p5-section-bg-overlay"></div>
              <h2 className="p5-section-bg-title">{curSec.titulo}</h2>
            </div>
          )}

          {activeSection === null ? (
            /* Chapter intro */
            <div className="p5-chapter-intro">
              <h2 className="p5-section-title">{curCap?.titulo}</h2>
              <ContentBlock content={curCap?.conteudo || []} />
            </div>
          ) : curSec ? (
            <div className="p5-section-content">
              {!curSec.imagem_fundo && (
                <h2 className="p5-section-title">{curSec.titulo}</h2>
              )}

              <ContentBlock content={curSec.conteudo || []} />

              {/* Sub-subsections (e.g. Facções) */}
              {curSec.subsecoes?.map((sub, j) => (
                <div key={j} className="p5-subsection">
                  <h3 className="p5-subsection-title">{sub.titulo}</h3>
                  <ContentBlock content={sub.conteudo || []} />
                </div>
              ))}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  )
}

function ContentBlock({ content }) {
  if (!content || content.length === 0) return null

  const grouped = []
  let currentList = null
  let currentCard = null

  for (const p of content) {
    if (p.tipo === 'lista') {
      if (!currentList) {
        currentList = []
        grouped.push({ tipo: 'lista-grupo', items: currentList })
      }
      currentList.push(p.texto)
      continue
    }
    currentList = null

    if (p.tipo === 'card') {
      currentCard = { tipo: 'card-bloco', textos: [p.texto] }
      grouped.push(currentCard)
      continue
    }
    if (p.tipo === 'card-fim' || p.tipo === 'bracket-close') {
      if (currentCard) {
        if (p.texto) currentCard.textos.push(p.texto)
        currentCard = null
      }
      continue
    }
    if (currentCard) {
      currentCard.textos.push({ text: p.texto, tipo: p.tipo })
      continue
    }

    grouped.push(p)
  }

  return (
    <div className="p5-content-block">
      {grouped.map((item, i) => {
        if (item.tipo === 'lista-grupo') {
          return (
            <ul key={i} className="cr-list">
              {item.items.map((li, j) => (
                <li key={j}><RichText text={li} /></li>
              ))}
            </ul>
          )
        }

        if (item.tipo === 'card-bloco') {
          const title = item.textos[0]
          const body = item.textos.slice(1)
          return (
            <div key={i} className="cr-card">
              <p className="cr-card-title"><RichText text={typeof title === 'string' ? title : title.text} /></p>
              {body.map((t, j) => {
                const text = typeof t === 'string' ? t : t.text
                const tipo = typeof t === 'string' ? 'paragrafo' : t.tipo
                if (tipo === 'marcador') {
                  const parts = text.match(/^(.{1,60}):\s*(.+)$/)
                  return (
                    <div key={j} className="cr-marker">
                      {parts ? (
                        <><span className="cr-marker-label">{parts[1]}</span><span className="cr-marker-text"><RichText text={parts[2]} /></span></>
                      ) : (
                        <span className="cr-marker-text"><RichText text={text} /></span>
                      )}
                    </div>
                  )
                }
                if (tipo === 'destaque') {
                  return <p key={j} className="cr-destaque"><RichText text={text} /></p>
                }
                return <p key={j}><RichText text={text} /></p>
              })}
            </div>
          )
        }

        if (item.tipo === 'anotacao') {
          return (
            <div key={i} className="cr-anotacao">
              <p><RichText text={item.texto} /></p>
            </div>
          )
        }

        if (item.tipo === 'marcador') {
          const parts = item.texto.match(/^(.{1,60}):\s*(.+)$/)
          return (
            <div key={i} className="cr-marker">
              {parts ? (
                <><span className="cr-marker-label">{parts[1]}</span><span className="cr-marker-text"><RichText text={parts[2]} /></span></>
              ) : (
                <span className="cr-marker-text"><RichText text={item.texto} /></span>
              )}
            </div>
          )
        }

        if (item.tipo === 'introducao') {
          return <p key={i} className="cr-intro"><RichText text={item.texto} /></p>
        }

        if (item.tipo === 'subtitulo') {
          return <h3 key={i} className="cr-section-subtitle">{item.texto}</h3>
        }

        if (item.tipo === 'destaque') {
          return <p key={i} className="cr-destaque"><RichText text={item.texto} /></p>
        }

        if (item.tipo === 'table') {
          return (
            <div key={i} className="p5-table-wrapper">
              <table className="p5-table">
                <thead>
                  <tr>
                    {item.headers?.map((h, hi) => (
                      <th key={hi}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {item.rows?.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        return <p key={i} className="cr-paragraph"><RichText text={item.texto} /></p>
      })}
    </div>
  )
}

export default Pagina5GuiaMestre
