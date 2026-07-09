import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

const navItems = [
  { path: '/', label: 'Apresentação', page: 1 },
  { path: '/mecanicas', label: 'Mecânicas', page: 2 },
  { path: '/antecedentes', label: 'Antecedentes', page: 3 },
  { path: '/equipamentos', label: 'Equipamentos', page: 4 },
  { path: '/guia-mestre', label: 'Guia do Mestre', page: 5 },
  { path: '/ameacas', label: 'Ameaças', page: 6 },
  { path: '/complementos', label: 'Complementos', page: 7 },
]

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-zona">ZONA</span>
          <span className="logo-dash">-</span>
          <span className="logo-z">Z</span>
        </Link>

        <button
          className={`navbar-toggle ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`navbar-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <span className="nav-page-number">0{item.page}</span>
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <a
              href="/criar-personagem"
              target="_blank"
              rel="noopener noreferrer"
              className="navbar-link criar-ficha"
              onClick={() => setMenuOpen(false)}
            >
              Criar Ficha
            </a>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
