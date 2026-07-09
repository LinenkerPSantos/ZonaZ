import { useState, useEffect } from 'react'
import './Pagina2Mecanicas.css'

const CHAPTER_IMAGES = {
  0: 'Pagina02/pg02_01.png',
  1: 'Pagina02/pg02_02.png',
  2: 'Pagina02/pg02_03.png'
}

const CHAPTER_ICONS = {
  0: '⚙️',
  1: '⚔️',
  2: '🏕️'
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function Pagina2Mecanicas() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeChapter, setActiveChapter] = useState(0)
  const [activeSection, setActiveSection] = useState(null)

  useEffect(() => {
    fetch('/api/pagina/2')
      .then(res => res.json())
      .then(json => {
        setData(json)
        setLoading(false)
        if (json.capitulos?.length > 0 && json.capitulos[0].subsecoes?.length > 0) {
          setActiveSection(0)
        }
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (data?.capitulos?.[activeChapter]?.subsecoes?.length > 0) {
      setActiveSection(0)
    } else {
      setActiveSection(null)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeChapter, data])

  useEffect(() => {
    setTimeout(() => {
      const el = document.querySelector('.p2-section-title')
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
        <p className="loading-text">Carregando mecânicas...</p>
      </div>
    )
  }

  if (!data) return null

  const capitulos = data.capitulos || []
  const currentChapter = capitulos[activeChapter]
  const currentSections = currentChapter?.subsecoes || []
  const currentSection = activeSection !== null ? currentSections[activeSection] : null

  return (
    <div className="pagina2">
      {/* HERO BANNER */}
      <section className="p2-hero">
        <div className="p2-hero-overlay"></div>
        <img
          src={`/api/img/${data.imagens?.capa || 'Pagina02/pg02_00.png'}`}
          alt="Zona Morta"
          className="p2-hero-img"
        />
        <div className="p2-hero-content">
          <h1 className="p2-hero-title">{data.titulo}</h1>
          <p className="p2-hero-subtitle">{data.subtitulo}</p>
        </div>
      </section>

      {/* CHAPTER TABS */}
      <nav className="p2-chapter-tabs">
        <div className="p2-tabs-container">
          {capitulos.map((cap, i) => (
            <button
              key={i}
              className={`p2-chapter-tab ${activeChapter === i ? 'active' : ''}`}
              onClick={() => setActiveChapter(i)}
            >
              <span className="tab-icon">{CHAPTER_ICONS[i] || ''}</span>
              <span className="tab-label">{cap.titulo}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="p2-layout">
        {/* SIDEBAR - Sub-sections */}
        <aside className="p2-sidebar">
          <div className="p2-sidebar-header">
            <h3>{currentChapter?.titulo}</h3>
          </div>
          <ul className="p2-sidebar-nav">
            {currentSections.map((sec, i) => (
              <li key={i}>
                <button
                  className={`p2-sidebar-link ${activeSection === i ? 'active' : ''}`}
                  onClick={() => setActiveSection(i)}
                >
                  {sec.titulo}
                </button>
                {activeSection === i && sec.subsecoes?.length > 0 && (
                  <ul className="p2-sidebar-sub">
                    {sec.subsecoes.map((sub, j) => (
                      <li key={j}>
                        <a
                          href={`#${slugify(sub.titulo)}`}
                          className="p2-sidebar-sublink"
                        >
                          {sub.titulo}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </aside>

        {/* MAIN CONTENT */}
        <main className="p2-content">
          {/* Chapter header with background image */}
          {CHAPTER_IMAGES[activeChapter] && (
            <div
              className="p2-chapter-header"
              style={{ backgroundImage: `url(/api/img/${encodeURI(CHAPTER_IMAGES[activeChapter])})` }}
            >
              <div className="p2-chapter-header-overlay"></div>
              <h2 className="p2-chapter-header-title">{currentChapter?.titulo}</h2>
            </div>
          )}

          {currentSection ? (
            <div className="p2-section-content">
              <h2 className="p2-section-title" id={slugify(currentSection.titulo)}>
                {currentSection.titulo}
              </h2>

              <ContentRenderer paragraphs={currentSection.conteudo} />

              {currentSection.subsecoes?.map((sub, j) => (
                <div key={j} className="p2-subsection" id={slugify(sub.titulo)}>
                  <h3 className="p2-subsection-title">{sub.titulo}</h3>
                  <ContentRenderer paragraphs={sub.conteudo} />
                </div>
              ))}
            </div>
          ) : (
            <div className="p2-section-content">
              <h2 className="p2-section-title">{currentChapter?.titulo}</h2>
              <ContentRenderer paragraphs={currentChapter?.conteudo || []} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function RichText({ text }) {
  if (!text || !text.includes('<hl>')) return text
  const parts = text.split(/(<hl>.*?<\/hl>)/g)
  return parts.map((part, i) => {
    const match = part.match(/^<hl>(.*?)<\/hl>$/)
    if (match) return <strong key={i} className="cr-highlight">{match[1]}</strong>
    return part
  })
}

function ContentRenderer({ paragraphs }) {
  if (!paragraphs || paragraphs.length === 0) return null

  const grouped = []
  let currentList = null
  let currentCard = null

  for (const p of paragraphs) {
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
    if (p.tipo === 'card-fim') {
      if (currentCard) {
        if (p.texto) currentCard.textos.push(p.texto)
      }
      currentCard = null
      continue
    }
    if (currentCard) {
      currentCard.textos.push(p.texto)
      continue
    }

    grouped.push(p)
  }

  return (
    <div className="content-renderer">
      {grouped.map((item, i) => {
        if (item.tipo === 'lista-grupo') {
          return (
            <ul key={i} className="cr-list">
              {item.items.map((li, j) => (
                <li key={j}>{li}</li>
              ))}
            </ul>
          )
        }

        if (item.tipo === 'imagem') return null

        if (item.tipo === 'marcador') {
          const parts = item.texto.match(/^(.{1,60}):\s*(.+)$/)
          return (
            <div key={i} className="cr-marker">
              {parts ? (
                <>
                  <span className="cr-marker-label">{parts[1]}</span>
                  <span className="cr-marker-text">{parts[2]}</span>
                </>
              ) : (
                <span className="cr-marker-text">{item.texto}</span>
              )}
            </div>
          )
        }

        if (item.tipo === 'introducao') {
          return <p key={i} className="cr-intro">{item.texto}</p>
        }

        if (item.tipo === 'card-bloco') {
          return (
            <div key={i} className="cr-card">
              {item.textos.map((t, j) => (
                <p key={j}><RichText text={t} /></p>
              ))}
            </div>
          )
        }

        if (item.tipo === 'destaque') {
          return <p key={i} className="cr-destaque"><RichText text={item.texto} /></p>
        }

        if (item.tipo === 'subtitulo') {
          return <h3 key={i} className="cr-section-subtitle">{item.texto}</h3>
        }

        if (item.tipo === 'anotacao') {
          return (
            <div key={i} className="cr-anotacao">
              <p><RichText text={item.texto} /></p>
            </div>
          )
        }

        const isSubtitle = item.estilo === 'Heading 5' ||
          (item.texto.length < 80 && !item.texto.endsWith('.') && !item.texto.endsWith(':'))

        if (isSubtitle && item.texto.length < 60) {
          return <h4 key={i} className="cr-subtitle"><RichText text={item.texto} /></h4>
        }

        return <p key={i} className="cr-paragraph"><RichText text={item.texto} /></p>
      })}
    </div>
  )
}

export default Pagina2Mecanicas
