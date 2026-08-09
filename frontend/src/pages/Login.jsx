import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [identificador, setIdentificador] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      const usuario = await login(identificador, senha)
      navigate(usuario.papel === 'administrador' ? '/admin' : '/')
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Entrar</h1>
        <p className="auth-subtitle">Acesse sua conta para se inscrever em mesas.</p>

        {erro && <div className="auth-error">{erro}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="identificador">E-mail ou usuário</label>
            <input
              id="identificador"
              type="text"
              autoComplete="username"
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-submit" disabled={enviando}>
            {enviando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/esqueci-senha">Esqueci minha senha</Link>
          <span>Não tem conta? <Link to="/cadastro">Cadastre-se</Link></span>
        </div>
      </div>
    </div>
  )
}

export default Login
