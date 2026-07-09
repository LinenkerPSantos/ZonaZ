import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <span className="footer-logo">ZONA-Z</span>
          <p className="footer-tagline">Sobreviva. Adapte-se. Lute.</p>
        </div>
        <div className="footer-info">
          <p>&copy; {new Date().getFullYear()} Zona-Z RPG — Linenker Pereira dos Santos</p>
          <p className="footer-version">Versão Beta 1.0</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
