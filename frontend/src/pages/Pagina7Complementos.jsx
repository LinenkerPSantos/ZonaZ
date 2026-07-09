import { useState, useEffect } from 'react'
import './Pagina7Complementos.css'

function Pagina7Complementos() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeChapter, setActiveChapter] = useState(0)

  useEffect(() => {
    fetch('/api/pagina/7')
      .then(res => res.json())
      .then(json => { setData(json); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeChapter])

  if (loading) return <div className="loading-screen"><div className="loading-icon"></div><p className="loading-text">Carregando complementos...</p></div>
  if (!data) return null

  const caps = data.capitulos || []
  const curCap = caps[activeChapter]

  return (
    <div className="pagina7">
      <section className="p7-hero">
        <div className="p7-hero-overlay"></div>
        <div className="p7-hero-content">
          <h1 className="p7-hero-title">{data.titulo}</h1>
          <p className="p7-hero-subtitle">{data.subtitulo}</p>
        </div>
      </section>

      {caps.length > 1 && (
        <nav className="p7-tabs">
          <div className="p7-tabs-wrap">
            {caps.map((cap, i) => (
              <button key={i}
                className={`p7-tab ${activeChapter === i ? 'active' : ''}`}
                onClick={() => setActiveChapter(i)}>
                {cap.titulo}
              </button>
            ))}
          </div>
        </nav>
      )}

      <div className="p7-container">
        {curCap && (
          <div className="p7-chapter">
            <h2 className="p7-chapter-title">{curCap.titulo}</h2>

            <ContentBlock content={curCap.conteudo} />

            {curCap.subsecoes?.map((sec, i) => (
              <div key={i} className="p7-section">
                <h3 className="p7-section-title">{sec.titulo}</h3>
                <ContentBlock content={sec.conteudo} />

                {sec.subsecoes?.map((sub, j) => (
                  <div key={j} className="p7-subsection">
                    <h4 className="p7-subsection-title">{sub.titulo}</h4>
                    <ContentBlock content={sub.conteudo} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RichText({ text }) {
  if (!text || !text.includes('<hl>')) return text
  const parts = text.split(/(<hl>.*?<\/hl>)/g)
  return parts.map((part, i) => {
    const match = part.match(/^<hl>(.*?)<\/hl>$/)
    if (match) return <strong key={i} className="p7-highlight">{match[1]}</strong>
    return part
  })
}

function ContentBlock({ content }) {
  if (!content || content.length === 0) return null
  return (
    <div className="p7-content-block">
      {content.map((item, i) => {
        if (item.tipo === 'marcador') {
          const parts = item.texto.match(/^(.{1,60}):\s*(.+)$/)
          return (
            <div key={i} className="p7-marker">
              {parts ? (<><span className="p7-marker-label">{parts[1]}</span><span>{parts[2]}</span></>) : <span>{item.texto}</span>}
            </div>
          )
        }
        if (item.tipo === 'subtitulo') return <h4 key={i} className="p7-content-subtitle">{item.texto}</h4>
        if (item.tipo === 'destaque') return <p key={i} className="p7-destaque"><RichText text={item.texto} /></p>
        if (item.tipo === 'anotacao') return <div key={i} className="p7-anotacao"><p><RichText text={item.texto} /></p></div>
        if (item.tipo === 'introducao') return <p key={i} className="p7-intro-text">{item.texto}</p>
        if (item.tipo === 'lista') return <li key={i} className="p7-list-item">{item.texto}</li>
        return <p key={i} className="p7-paragraph"><RichText text={item.texto} /></p>
      })}
    </div>
  )
}

export default Pagina7Complementos
