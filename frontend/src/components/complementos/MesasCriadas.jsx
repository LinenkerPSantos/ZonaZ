import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../services/api'
import './MesasCriadas.css'

const STATUS_LABEL = { em_criacao: 'Em criação', em_andamento: 'Em andamento' }

function MesasCriadas() {
  const { usuario } = useAuth()
  const [mesas, setMesas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [minhasFichas, setMinhasFichas] = useState([])
  const [fichaEscolhida, setFichaEscolhida] = useState({})
  const [senhaDigitada, setSenhaDigitada] = useState({})
  const [processando, setProcessando] = useState(null)
  const [erro, setErro] = useState('')

  const carregarMesas = () => {
    apiFetch('/api/mesas').then(setMesas).catch(() => setErro('Não foi possível carregar as mesas.'))
  }

  useEffect(() => {
    setCarregando(true)
    Promise.all([
      apiFetch('/api/mesas'),
      usuario ? apiFetch('/api/fichas/minhas').catch(() => []) : Promise.resolve([]),
    ])
      .then(([mesas, fichas]) => { setMesas(mesas); setMinhasFichas(fichas) })
      .catch(() => setErro('Não foi possível carregar as mesas.'))
      .finally(() => setCarregando(false))
  }, [usuario])

  const inscrever = async (mesaId) => {
    setErro('')
    setProcessando(mesaId)
    try {
      await apiFetch(`/api/mesas/${mesaId}/inscrever`, {
        method: 'POST',
        body: JSON.stringify({
          ficha_id: fichaEscolhida[mesaId] || null,
          senha: senhaDigitada[mesaId] || '',
        }),
      })
      carregarMesas()
    } catch (err) {
      setErro(err.message)
    } finally {
      setProcessando(null)
    }
  }

  if (carregando) return <p className="mc-status">Carregando mesas...</p>

  return (
    <div className="mc-container">
      {erro && <div className="mc-erro">{erro}</div>}

      {mesas.length === 0 && <p className="mc-status">Nenhuma mesa criada até o momento.</p>}

      <div className="mc-lista">
        {mesas.map((mesa) => (
          <div key={mesa.id} className="mc-card">
            <div className="mc-card-header">
              <h3 className="mc-card-nome">
                {mesa.nome}
                {mesa.tem_senha && <span className="mc-cadeado" title="Protegida por senha">🔒</span>}
              </h3>
              <span className={`mc-badge mc-badge-${mesa.status}`}>{STATUS_LABEL[mesa.status]}</span>
            </div>
            <div className="mc-card-info">
              {mesa.data && <span><b>Data:</b> {mesa.data}</span>}
              {mesa.local && <span><b>Local:</b> {mesa.local}</span>}
              <span><b>Jogadores:</b> {mesa.total_jogadores}{mesa.max_jogadores ? `/${mesa.max_jogadores}` : ''}</span>
            </div>

            <div className="mc-card-acao">
              {!usuario && (
                <span className="mc-prompt">
                  <Link to="/login">Faça login</Link> para se inscrever nesta mesa.
                </span>
              )}
              {usuario && mesa.inscrito && <span className="mc-prompt">Você já está inscrito nesta mesa.</span>}
              {usuario && !mesa.inscrito && mesa.status === 'em_criacao' && (
                <div className="mc-inscricao">
                  {mesa.tem_senha && (
                    <input
                      type="text"
                      className="mc-senha-input"
                      placeholder="Senha de acesso"
                      value={senhaDigitada[mesa.id] || ''}
                      onChange={(e) => setSenhaDigitada(prev => ({ ...prev, [mesa.id]: e.target.value }))}
                    />
                  )}
                  {minhasFichas.length > 0 && (
                    <select
                      value={fichaEscolhida[mesa.id] || ''}
                      onChange={(e) => setFichaEscolhida(prev => ({ ...prev, [mesa.id]: e.target.value }))}
                    >
                      <option value="">Sem ficha vinculada</option>
                      {minhasFichas.map(f => (
                        <option key={f.id} value={f.id}>{f.nome_personagem || `Ficha #${f.id}`}</option>
                      ))}
                    </select>
                  )}
                  <button
                    className="mc-btn"
                    disabled={processando === mesa.id}
                    onClick={() => inscrever(mesa.id)}
                  >
                    {processando === mesa.id ? 'Inscrevendo...' : 'Inscrever-se'}
                  </button>
                </div>
              )}
              {usuario && !mesa.inscrito && mesa.status !== 'em_criacao' && (
                <span className="mc-prompt">Inscrições encerradas.</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MesasCriadas
