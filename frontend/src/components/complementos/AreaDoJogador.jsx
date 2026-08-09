import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../services/api'
import './AreaDoJogador.css'

const STATUS_LABEL = { em_criacao: 'Em criação', em_andamento: 'Em andamento' }

function ChatMesa({ mesaId }) {
  const [mensagens, setMensagens] = useState(null)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const carregar = () => {
    apiFetch(`/api/mesas/${mesaId}/mensagens`)
      .then(setMensagens)
      .catch(() => setErro('Não foi possível carregar as mensagens.'))
  }

  useEffect(() => { carregar() }, [mesaId])

  const enviar = async (e) => {
    e.preventDefault()
    if (!texto.trim()) return
    setEnviando(true)
    setErro('')
    try {
      await apiFetch(`/api/mesas/${mesaId}/mensagens`, {
        method: 'POST',
        body: JSON.stringify({ texto: texto.trim() }),
      })
      setTexto('')
      carregar()
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="aj-chat">
      {erro && <div className="aj-erro">{erro}</div>}
      <div className="aj-chat-mensagens">
        {!mensagens && <p className="aj-status-texto">Carregando...</p>}
        {mensagens?.length === 0 && <p className="aj-status-texto">Nenhuma mensagem ainda. Comece a conversa.</p>}
        {mensagens?.map((m) => (
          <div key={m.id} className="aj-mensagem">
            <span className="aj-mensagem-autor">{m.nome_exibicao}</span>
            <span className="aj-mensagem-texto">{m.texto}</span>
          </div>
        ))}
      </div>
      <form className="aj-chat-form" onSubmit={enviar}>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva uma mensagem para o grupo..."
        />
        <button className="aj-btn" type="submit" disabled={enviando}>Enviar</button>
      </form>
    </div>
  )
}

function AreaDoJogador() {
  const { usuario } = useAuth()
  const [mesas, setMesas] = useState([])
  const [fichas, setFichas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mesaAberta, setMesaAberta] = useState(null)
  const [excluindoFichaId, setExcluindoFichaId] = useState(null)
  const [saindoMesaId, setSaindoMesaId] = useState(null)
  const [fichaPorMesa, setFichaPorMesa] = useState({})
  const [salvandoFichaMesaId, setSalvandoFichaMesaId] = useState(null)
  const [importando, setImportando] = useState(false)
  const [importErro, setImportErro] = useState('')
  const fileInputRef = useRef(null)

  const carregarTudo = () => {
    setCarregando(true)
    Promise.all([apiFetch('/api/mesas'), apiFetch('/api/fichas/minhas')])
      .then(([todasMesas, minhasFichas]) => {
        setMesas(todasMesas.filter((m) => m.inscrito))
        setFichas(minhasFichas)
      })
      .catch(() => setErro('Não foi possível carregar seus dados.'))
      .finally(() => setCarregando(false))
  }

  useEffect(() => { carregarTudo() }, [])

  if (!usuario) return null

  const excluirFicha = async (ficha) => {
    if (!window.confirm(`Tem certeza que deseja excluir a ficha "${ficha.nome_personagem || `#${ficha.id}`}"? Essa ação não pode ser desfeita.`)) {
      return
    }
    setExcluindoFichaId(ficha.id)
    setErro('')
    try {
      await apiFetch(`/api/fichas/${ficha.id}`, { method: 'DELETE' })
      setFichas((prev) => prev.filter((f) => f.id !== ficha.id))
    } catch (err) {
      setErro(err.message)
    } finally {
      setExcluindoFichaId(null)
    }
  }

  const sairDaMesa = async (mesa) => {
    if (!window.confirm(`Tem certeza que deseja sair da mesa "${mesa.nome}"?`)) {
      return
    }
    setSaindoMesaId(mesa.id)
    setErro('')
    try {
      await apiFetch(`/api/mesas/${mesa.id}/inscrever`, { method: 'DELETE' })
      setMesas((prev) => prev.filter((m) => m.id !== mesa.id))
      if (mesaAberta === mesa.id) setMesaAberta(null)
    } catch (err) {
      setErro(err.message)
    } finally {
      setSaindoMesaId(null)
    }
  }

  const fichaSelecionada = (mesa) =>
    fichaPorMesa[mesa.id] !== undefined ? fichaPorMesa[mesa.id] : (mesa.minha_ficha_id || '')

  const atualizarFichaDaMesa = async (mesa) => {
    setSalvandoFichaMesaId(mesa.id)
    setErro('')
    const novoFichaId = fichaSelecionada(mesa) || null
    try {
      await apiFetch(`/api/mesas/${mesa.id}/inscrever`, {
        method: 'PATCH',
        body: JSON.stringify({ ficha_id: novoFichaId }),
      })
      setMesas((prev) => prev.map((m) => (m.id === mesa.id ? { ...m, minha_ficha_id: novoFichaId } : m)))
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvandoFichaMesaId(null)
    }
  }

  const importarFicha = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImportErro('')
    setImportando(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const dados = JSON.parse(ev.target.result)
        if (!dados.ficha) throw new Error('Arquivo não é uma ficha válida da Zona-Z.')
        await apiFetch('/api/fichas', { method: 'POST', body: JSON.stringify(dados) })
        carregarTudo()
      } catch (err) {
        setImportErro(err.message || 'Não foi possível importar o arquivo.')
      } finally {
        setImportando(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.onerror = () => {
      setImportErro('Não foi possível ler o arquivo.')
      setImportando(false)
    }
    reader.readAsText(file)
  }

  return (
    <div className="aj-container">
      {erro && <div className="aj-erro">{erro}</div>}
      {carregando && <p className="aj-status-texto">Carregando...</p>}

      {!carregando && (
        <>
          <section className="aj-secao">
            <h3 className="aj-secao-titulo">Minhas Mesas</h3>
            {mesas.length === 0 && <p className="aj-status-texto">Você ainda não está inscrito em nenhuma mesa.</p>}
            <div className="aj-lista-mesas">
              {mesas.map((mesa) => (
                <div key={mesa.id} className="aj-mesa">
                  <button
                    className="aj-mesa-header"
                    onClick={() => setMesaAberta(mesaAberta === mesa.id ? null : mesa.id)}
                  >
                    <span className="aj-mesa-nome">{mesa.nome}</span>
                    <span className={`aj-badge aj-badge-${mesa.status}`}>{STATUS_LABEL[mesa.status]}</span>
                  </button>
                  {mesaAberta === mesa.id && (
                    <div className="aj-mesa-body">
                      <div className="aj-mesa-info">
                        {mesa.data && <span><b>Data:</b> {mesa.data}</span>}
                        {mesa.local && <span><b>Local:</b> {mesa.local}</span>}
                        <button
                          className="aj-btn-sair"
                          disabled={saindoMesaId === mesa.id}
                          onClick={() => sairDaMesa(mesa)}
                        >
                          {saindoMesaId === mesa.id ? 'Saindo...' : 'Sair da Mesa'}
                        </button>
                      </div>

                      <div className="aj-ficha-mesa">
                        <label>
                          Ficha vinculada a esta mesa
                          {fichas.length > 0 ? (
                            <select
                              value={fichaSelecionada(mesa)}
                              onChange={(e) => setFichaPorMesa((prev) => ({ ...prev, [mesa.id]: e.target.value }))}
                            >
                              <option value="">Sem ficha vinculada</option>
                              {fichas.map((f) => (
                                <option key={f.id} value={f.id}>{f.nome_personagem || `Ficha #${f.id}`}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="aj-status-texto">Você ainda não tem fichas para vincular.</span>
                          )}
                        </label>
                        {fichas.length > 0 && (
                          <button
                            className="aj-btn"
                            disabled={salvandoFichaMesaId === mesa.id}
                            onClick={() => atualizarFichaDaMesa(mesa)}
                          >
                            {salvandoFichaMesaId === mesa.id ? 'Salvando...' : 'Atualizar Ficha'}
                          </button>
                        )}
                      </div>

                      <h4 className="aj-chat-titulo">Histórico de conversas</h4>
                      <ChatMesa mesaId={mesa.id} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="aj-secao">
            <h3 className="aj-secao-titulo">Minhas Fichas</h3>
            {fichas.length === 0 && <p className="aj-status-texto">Você ainda não criou nenhuma ficha.</p>}
            <div className="aj-lista-fichas">
              {fichas.map((f) => (
                <div key={f.id} className="aj-ficha-card">
                  <Link to={`/ficha/${f.id}`} className="aj-ficha-link">
                    {f.nome_personagem || `Ficha #${f.id}`}
                  </Link>
                  <button
                    className="aj-btn-excluir"
                    disabled={excluindoFichaId === f.id}
                    onClick={() => excluirFicha(f)}
                  >
                    {excluindoFichaId === f.id ? 'Excluindo...' : 'Excluir'}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="aj-secao">
            <h3 className="aj-secao-titulo">Update de Ficha</h3>
            <p className="aj-status-texto">
              Já tem uma ficha exportada em JSON? Envie o arquivo aqui para cadastrá-la no seu perfil.
            </p>
            {importErro && <div className="aj-erro">{importErro}</div>}
            <label className="aj-btn aj-btn-upload">
              {importando ? 'Importando...' : 'Escolher arquivo JSON'}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={importarFicha}
                disabled={importando}
                hidden
              />
            </label>
          </section>
        </>
      )}
    </div>
  )
}

export default AreaDoJogador
