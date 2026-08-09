import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import './Admin.css'

const PAPEL_LABEL = { jogador: 'Jogador', mestre: 'Mestre', administrador: 'Administrador' }

const FORM_VAZIO = { nome_usuario: '', email: '', senha: '', papel: 'jogador', nome_exibicao: '' }

function Admin() {
  const { usuario } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState(FORM_VAZIO)
  const [criando, setCriando] = useState(false)
  const [excluindoId, setExcluindoId] = useState(null)

  const carregarUsuarios = () => {
    apiFetch('/api/admin/usuarios')
      .then(setUsuarios)
      .catch(() => setErro('Não foi possível carregar os usuários.'))
      .finally(() => setCarregando(false))
  }

  useEffect(() => { carregarUsuarios() }, [])

  if (!usuario) return null

  if (usuario.papel !== 'administrador') {
    return (
      <div className="admin-page">
        <div className="admin-negado">Acesso restrito a contas de administrador.</div>
      </div>
    )
  }

  const criarUsuario = async (e) => {
    e.preventDefault()
    setErro('')
    setCriando(true)
    try {
      await apiFetch('/api/admin/usuarios', { method: 'POST', body: JSON.stringify(form) })
      setForm(FORM_VAZIO)
      carregarUsuarios()
    } catch (err) {
      setErro(err.message)
    } finally {
      setCriando(false)
    }
  }

  const excluirUsuario = async (alvo) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${alvo.nome_usuario}"? Essa ação não pode ser desfeita.`)) {
      return
    }
    setErro('')
    setExcluindoId(alvo.id)
    try {
      await apiFetch(`/api/admin/usuarios/${alvo.id}`, { method: 'DELETE' })
      setUsuarios(prev => prev.filter(u => u.id !== alvo.id))
    } catch (err) {
      setErro(err.message)
    } finally {
      setExcluindoId(null)
    }
  }

  return (
    <div className="admin-page">
      <h1 className="admin-title">Gerenciamento de Usuários</h1>

      {erro && <div className="admin-erro">{erro}</div>}

      <div className="admin-layout">
        <section className="admin-criar">
          <h2 className="admin-secao-titulo">Criar Usuário</h2>
          <form className="admin-form" onSubmit={criarUsuario}>
            <label>
              Nome de usuário
              <input
                value={form.nome_usuario}
                onChange={(e) => setForm({ ...form, nome_usuario: e.target.value })}
                required
              />
            </label>
            <label>
              E-mail (opcional)
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label>
              Nome de exibição (opcional)
              <input
                value={form.nome_exibicao}
                onChange={(e) => setForm({ ...form, nome_exibicao: e.target.value })}
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                minLength={6}
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                required
              />
            </label>
            <label>
              Papel
              <select value={form.papel} onChange={(e) => setForm({ ...form, papel: e.target.value })}>
                <option value="jogador">Jogador</option>
                <option value="mestre">Mestre</option>
                <option value="administrador">Administrador</option>
              </select>
            </label>
            <button className="admin-btn" type="submit" disabled={criando}>
              {criando ? 'Criando...' : 'Criar Usuário'}
            </button>
          </form>
        </section>

        <section className="admin-lista-secao">
          <h2 className="admin-secao-titulo">Usuários Cadastrados</h2>
          {carregando && <p className="admin-status-texto">Carregando...</p>}
          {!carregando && usuarios.length === 0 && <p className="admin-status-texto">Nenhum usuário cadastrado.</p>}
          <div className="admin-tabela-wrap">
            {usuarios.length > 0 && (
              <table className="admin-tabela">
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>E-mail</th>
                    <th>Papel</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id}>
                      <td>{u.nome_exibicao || u.nome_usuario}</td>
                      <td>{u.email || '—'}</td>
                      <td><span className={`admin-badge admin-badge-${u.papel}`}>{PAPEL_LABEL[u.papel]}</span></td>
                      <td>
                        <button
                          className="admin-btn-excluir"
                          disabled={u.id === usuario.id || excluindoId === u.id}
                          onClick={() => excluirUsuario(u)}
                        >
                          {excluindoId === u.id ? 'Excluindo...' : 'Excluir'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Admin
