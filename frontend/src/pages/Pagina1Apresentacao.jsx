import { useState, useEffect } from 'react'
import SectionDivider from '../components/SectionDivider'
import './Pagina1Apresentacao.css'

function Pagina1Apresentacao() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/pagina/1')
      .then(res => res.json())
      .then(json => {
        setData(json)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-icon"></div>
        <p className="loading-text">Carregando dados da Zona-Z...</p>
      </div>
    )
  }

  const avisos = data?.avisos || []
  const oque_e_rpg_intro = data?.oque_e_rpg_intro || {}
  const introducao = data?.introducao || {}

  return (
    <div className="pagina1">
      {/* HERO */}
      <section className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-zona">ZONA</span>
            <span className="hero-dash">-</span>
            <span className="hero-z">Z</span>
          </h1>
          <p className="hero-subtitle">RPG de Sobrevivência Pós-Apocalíptico</p>
          <p className="hero-tagline">Sobreviva. Adapte-se. Lute.</p>
          <a href="#bem-vindos" className="hero-cta">
            <span>Entrar na Zona</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M19 12l-7 7-7-7"/>
            </svg>
          </a>
        </div>
        <div className="hero-scanline"></div>
      </section>

      {/* AVISOS */}
      <section className="section avisos-section" id="bem-vindos">
        <div className="container">
          <div className="avisos-header">
            <div className="warning-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h2 className="section-title">Avisos Importantes</h2>
          </div>

          <div className="avisos-grid">
            {avisos.map((aviso, i) => (
              <div className="aviso-card" key={i}>
                <h3 className="aviso-label">{aviso.titulo}</h3>
                <p className="aviso-text">{aviso.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O QUE É RPG - Intro visual */}
      <section className="section oque-section">
        <div className="container">
          <SectionDivider
            title="O Que É Isso Que Você Está Lendo?"
            subtitle="Entenda o RPG de mesa"
          />

          <div className="oque-intro-block">
            <p className="oque-intro-text">{oque_e_rpg_intro.descricao}</p>
          </div>

          <div className="oque-cards">
            <div className="oque-card">
              <div className="oque-card-icon">&#x2728;</div>
              <h3>Como funciona?</h3>
              <p>{oque_e_rpg_intro.como_funciona_jogadores}</p>
            </div>
            <div className="oque-card">
              <div className="oque-card-icon">&#x1F3AD;</div>
              <h3>O Mestre do Jogo</h3>
              <p>{oque_e_rpg_intro.como_funciona_mestre}</p>
            </div>
            <div className="oque-card">
              <div className="oque-card-icon">&#x1F3B2;</div>
              <h3>Os Dados</h3>
              <p>{oque_e_rpg_intro.como_funciona_dados}</p>
            </div>
          </div>

          <div className="oque-highlight-box">
            <p className="oque-highlight">{oque_e_rpg_intro.objetivo}</p>
          </div>

          <div className="oque-why">
            <p>{oque_e_rpg_intro.por_que_jogar}</p>
            <p className="oque-welcome">{oque_e_rpg_intro.boas_vindas}</p>
          </div>
        </div>
      </section>

      {/* INTRODUÇÃO - Bem Vindos a Zona-Z */}
      <section className="section intro-section">
        <div className="container">
          <SectionDivider
            title="Bem Vindos a Zona-Z"
            subtitle="Esta parte contém tudo que você precisa para criar seu personagem e jogar Zona-Z"
          />

          {/* Imagem RPG */}
          <div className="intro-image-wrapper">
            <img
              src="/api/img/Pagina01/pg01.png"
              alt="Mesa de RPG - Jogadores reunidos"
              className="intro-image"
            />
          </div>

          {/* O que é RPG? */}
          <div className="intro-block">
            <h3 className="intro-subtitle">O que é RPG?</h3>
            {introducao.oque_e_rpg?.map((p, i) => (
              <p key={i} className="intro-text">{p}</p>
            ))}
          </div>

          {/* Exemplo narrativa */}
          <div className="narrative-example">
            <h3 className="intro-subtitle">Exemplo de Narrativa</h3>
            <div className="narrative-box">
              {introducao.exemplo_narrativa?.map((line, i) => (
                <div
                  key={i}
                  className={`narrative-line ${line.tipo === 'narrador' ? 'narrator' : 'player'}`}
                >
                  <span className="narrative-speaker">{line.speaker}:</span>
                  <span className="narrative-text">"{line.fala}"</span>
                </div>
              ))}
            </div>
          </div>

          {/* Explicação mecânica */}
          <div className="intro-block">
            {introducao.explicacao_mecanica?.map((p, i) => (
              <p key={i} className="intro-text">{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* ZONA-Z INTRODUÇÃO AOS JOGADORES */}
      <section className="section zonaz-intro-section">
        <div className="container">
          <SectionDivider
            title="Zona-Z — Introdução aos Jogadores"
          />

          <div className="zonaz-intro-content">
            {introducao.intro_jogadores?.map((p, i) => (
              <p key={i} className="zonaz-intro-text">{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* CONTEÚDO - RESUMO DO SITE */}
      <section className="section resumo-section">
        <div className="container">
          <SectionDivider
            title="Conteúdo — Resumo do Site"
            subtitle="Navegue pelo universo Zona-Z"
          />

          <div className="resumo-grid">
            <a href="/mecanicas" className="resumo-card">
              <span className="resumo-card-number">01</span>
              <h3>Mecânicas do Jogo</h3>
              <p>Testes de ação, atributos, perícias, combate, exploração e sobrevivência.</p>
            </a>
            <a href="/antecedentes" className="resumo-card">
              <span className="resumo-card-number">02</span>
              <h3>Antecedentes e Talentos</h3>
              <p>20 antecedentes com habilidades únicas e mais de 70 talentos por categoria.</p>
            </a>
            <a href="/equipamentos" className="resumo-card">
              <span className="resumo-card-number">03</span>
              <h3>Equipamentos e Recursos</h3>
              <p>Armas, proteções, itens, kits, criações improvisadas e aprimoramentos.</p>
            </a>
            <a href="/guia-mestre" className="resumo-card">
              <span className="resumo-card-number">04</span>
              <h3>Guia do Mestre</h3>
              <p>Narrativa, história do mundo, cidades, facções e dicas para campanhas.</p>
            </a>
            <a href="/ameacas" className="resumo-card">
              <span className="resumo-card-number">05</span>
              <h3>Ameaças do Mundo</h3>
              <p>Zumbis, mutantes, facções hostis e animais selvagens com stats completos.</p>
            </a>
            <a href="/complementos" className="resumo-card">
              <span className="resumo-card-number">06</span>
              <h3>Complementos</h3>
              <p>Criação de personagem passo a passo e explicação da ficha.</p>
            </a>
            <a href="/ficha" className="resumo-card ficha-link">
              <span className="resumo-card-number">&#x1F4CB;</span>
              <h3>Ficha de Personagem</h3>
              <p>Crie e preencha sua ficha de personagem online. Exporte, importe e imprima.</p>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Pagina1Apresentacao
