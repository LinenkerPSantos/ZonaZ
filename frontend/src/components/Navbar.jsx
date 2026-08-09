import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
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
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()

  const handleLogout = async () => {
    setActionsMenuOpen(false)
    setMenuOpen(false)
    await logout()
    navigate('/')
  }

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
        </ul>

        <div className="navbar-actions">
          <button
            className={`navbar-toggle navbar-actions-toggle ${actionsMenuOpen ? 'active' : ''}`}
            onClick={() => setActionsMenuOpen(!actionsMenuOpen)}
            aria-label="Menu de conta"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {actionsMenuOpen && (
            <div className="navbar-actions-dropdown">
              <a
                href="/criar-personagem"
                target="_blank"
                rel="noopener noreferrer"
                className="navbar-actions-item criar-ficha"
                onClick={() => setActionsMenuOpen(false)}
              >
                Criar Ficha
              </a>

              {!usuario && (
                <>
                  <Link to="/login" className="navbar-actions-item" onClick={() => setActionsMenuOpen(false)}>
                    Entrar
                  </Link>
                  <Link
                    to="/cadastro"
                    className="navbar-actions-item entrar-cadastro"
                    onClick={() => setActionsMenuOpen(false)}
                  >
                    Cadastrar
                  </Link>
                </>
              )}

              {usuario && (
                <>
                  <div className="navbar-actions-usuario">
                    {usuario.papel === 'mestre' && <span className="navbar-user-badge">Mestre</span>}
                    {usuario.papel === 'administrador' && <span className="navbar-user-badge">Admin</span>}
                    {usuario.nome_exibicao}
                  </div>
                  {usuario.papel === 'administrador' && (
                    <Link
                      to="/admin"
                      className="navbar-actions-item"
                      onClick={() => setActionsMenuOpen(false)}
                    >
                      Administração
                    </Link>
                  )}
                  <button className="navbar-actions-item navbar-actions-sair" onClick={handleLogout}>
                    Sair
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
