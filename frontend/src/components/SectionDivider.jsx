import './SectionDivider.css'

function SectionDivider({ title, subtitle }) {
  return (
    <div className="section-divider">
      <div className="divider-line"></div>
      {title && (
        <div className="divider-content">
          <h2 className="divider-title">{title}</h2>
          {subtitle && <p className="divider-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="divider-line"></div>
    </div>
  )
}

export default SectionDivider
