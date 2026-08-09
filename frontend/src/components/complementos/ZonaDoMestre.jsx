import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../services/api'
import './ZonaDoMestre.css'

function MesaGerenciador({ mesa, onAtualizada, onExcluida }) {
  const [data, setData] = useState(mesa.data || '')
  const [local, setLocal] = useState(mesa.local || '')
  const [novaSenha, setNovaSenha] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [expandido, setExpandido] = useState(false)
  const [jogadores, setJogadores] = useState(null)
  const [erro, setErro] = useState('')

  const salvar = async () => {
    setSalvando(true)
    setErro('')
    try {
      const corpo = { data, local }
      if (novaSenha.trim()) corpo.senha = novaSenha.trim()
      const atualizada = await apiFetch(`/api/mesas/${mesa.id}`, {
        method: 'PATCH',
        body: JSON.stringify(corpo),
      })
      setNovaSenha('')
      onAtualizada(atualizada)
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const removerSenha = async () => {
    setSalvando(true)
    setErro('')
    try {
      const atualizada = await apiFetch(`/api/mesas/${mesa.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ senha: '' }),
      })
      onAtualizada(atualizada)
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const alternarStatus = async () => {
    const novoStatus = mesa.status === 'em_criacao' ? 'em_andamento' : 'em_criacao'
    setSalvando(true)
    setErro('')
    try {
      const atualizada = await apiFetch(`/api/mesas/${mesa.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: novoStatus }),
      })
      onAtualizada(atualizada)
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const excluirMesa = async () => {
    if (!window.confirm(`Tem certeza que deseja excluir a mesa "${mesa.nome}"? Essa ação não pode ser desfeita.`)) {
      return
    }
    setExcluindo(true)
    setErro('')
    try {
      await apiFetch(`/api/mesas/${mesa.id}`, { method: 'DELETE' })
      onExcluida(mesa.id)
    } catch (err) {
      setErro(err.message)
      setExcluindo(false)
    }
  }

  const alternarExpandido = () => {
    const novo = !expandido
    setExpandido(novo)
    if (novo && !jogadores) {
      apiFetch(`/api/mesas/${mesa.id}/jogadores`)
        .then(setJogadores)
        .catch(() => setErro('Não foi possível carregar os jogadores.'))
    }
  }

  const removerJogador = async (jogadorId) => {
    try {
      await apiFetch(`/api/mesas/${mesa.id}/jogadores/${jogadorId}`, { method: 'DELETE' })
      setJogadores(prev => prev.filter(j => j.jogador_id !== jogadorId))
    } catch (err) {
      setErro(err.message)
    }
  }

  return (
    <div className="zm-mesa">
      <button className="zm-mesa-header" onClick={alternarExpandido}>
        <span className="zm-mesa-nome">
          {mesa.nome}
          {mesa.tem_senha && <span className="zm-cadeado" title="Protegida por senha">🔒</span>}
        </span>
        <span className={`zm-status zm-status-${mesa.status}`}>
          {mesa.status === 'em_criacao' ? 'Em criação' : 'Em andamento'}
        </span>
      </button>

      {expandido && (
        <div className="zm-mesa-body">
          {erro && <div className="zm-erro">{erro}</div>}

          <div className="zm-campos">
            <label>
              Data
              <input value={data} onChange={(e) => setData(e.target.value)} placeholder="Ex: 20/08/2026" />
            </label>
            <label>
              Local
              <input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex: Discord" />
            </label>
            <label>
              {mesa.tem_senha ? 'Trocar senha de acesso' : 'Definir senha de acesso'}
              <input
                type="text"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder={mesa.tem_senha ? 'Mesa protegida por senha' : 'Sem senha (qualquer jogador pode entrar)'}
              />
            </label>
            <div className="zm-acoes">
              <button className="zm-btn" onClick={salvar} disabled={salvando}>Salvar</button>
              <button className="zm-btn zm-btn-secundario" onClick={alternarStatus} disabled={salvando}>
                Marcar como {mesa.status === 'em_criacao' ? 'Em andamento' : 'Em criação'}
              </button>
              {mesa.tem_senha && (
                <button className="zm-btn zm-btn-secundario" onClick={removerSenha} disabled={salvando}>
                  Remover Senha
                </button>
              )}
              <button className="zm-btn zm-btn-excluir" onClick={excluirMesa} disabled={excluindo}>
                {excluindo ? 'Excluindo...' : 'Excluir Mesa'}
              </button>
            </div>
          </div>

          <div className="zm-jogadores">
            <h4>Jogadores inscritos {mesa.max_jogadores ? `(máx. ${mesa.max_jogadores})` : ''}</h4>
            {!jogadores && <p className="zm-status-texto">Carregando...</p>}
            {jogadores?.length === 0 && <p className="zm-status-texto">Nenhum jogador inscrito ainda.</p>}
            {jogadores?.map((j) => (
              <div key={j.jogador_id} className="zm-jogador">
                <span className="zm-jogador-nome">{j.nome_exibicao}</span>
                {j.ficha_id ? (
                  <Link to={`/ficha/${j.ficha_id}`} target="_blank" rel="noopener noreferrer">Ver ficha</Link>
                ) : (
                  <span className="zm-sem-ficha">Sem ficha vinculada</span>
                )}
                <button className="zm-remover" onClick={() => removerJogador(j.jogador_id)}>Remover</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ZonaDoMestre() {
  const { usuario } = useAuth()
  const [mesas, setMesas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({ nome: '', data: '', local: '', jogadores: '', senha: '' })
  const [criando, setCriando] = useState(false)

  const carregarMesas = () => {
    apiFetch('/api/mesas/minhas')
      .then(setMesas)
      .catch(() => setErro('Não foi possível carregar suas mesas.'))
      .finally(() => setCarregando(false))
  }

  useEffect(() => { carregarMesas() }, [])

  if (usuario?.papel !== 'mestre') return null

  const criarMesa = async (e) => {
    e.preventDefault()
    if (!form.nome.trim()) return
    setCriando(true)
    setErro('')
    try {
      await apiFetch('/api/mesas', { method: 'POST', body: JSON.stringify(form) })
      setForm({ nome: '', data: '', local: '', jogadores: '', senha: '' })
      carregarMesas()
    } catch (err) {
      setErro(err.message)
    } finally {
      setCriando(false)
    }
  }

  const atualizarMesaNaLista = (mesaAtualizada) => {
    setMesas(prev => prev.map(m => (m.id === mesaAtualizada.id ? { ...m, ...mesaAtualizada } : m)))
  }

  return (
    <div className="zm-container">
      <section className="zm-criar">
        <h3 className="zm-secao-titulo">Criar Mesa</h3>
        <form className="zm-form" onSubmit={criarMesa}>
          <label>
            Nome
            <input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
            />
          </label>
          <label>
            Data
            <input
              value={form.data}
              onChange={(e) => setForm({ ...form, data: e.target.value })}
              placeholder="Ex: 20/08/2026"
            />
          </label>
          <label>
            Local
            <input
              value={form.local}
              onChange={(e) => setForm({ ...form, local: e.target.value })}
              placeholder="Ex: Discord"
            />
          </label>
          <label>
            Jogadores (máximo)
            <input
              type="number"
              min="1"
              value={form.jogadores}
              onChange={(e) => setForm({ ...form, jogadores: e.target.value })}
              placeholder="Sem limite"
            />
          </label>
          <label>
            Senha de acesso (opcional)
            <input
              type="text"
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
              placeholder="Só quem souber a senha pode se inscrever"
            />
          </label>
          <button className="zm-btn" type="submit" disabled={criando}>
            {criando ? 'Criando...' : 'Criar Mesa'}
          </button>
        </form>
      </section>

      <section className="zm-gerenciador">
        <h3 className="zm-secao-titulo">Minhas Mesas</h3>
        {erro && <div className="zm-erro">{erro}</div>}
        {carregando && <p className="zm-status-texto">Carregando...</p>}
        {!carregando && mesas.length === 0 && <p className="zm-status-texto">Você ainda não criou nenhuma mesa.</p>}
        <div className="zm-lista">
          {mesas.map((mesa) => (
            <MesaGerenciador
              key={mesa.id}
              mesa={mesa}
              onAtualizada={atualizarMesaNaLista}
              onExcluida={(mesaId) => setMesas(prev => prev.filter(m => m.id !== mesaId))}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

export default ZonaDoMestre
