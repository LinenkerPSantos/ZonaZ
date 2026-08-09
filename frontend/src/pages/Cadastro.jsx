import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

function Cadastro() {
  const { registrar } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }
    setEnviando(true)
    try {
      await registrar(email, senha)
      navigate('/')
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Cadastrar</h1>
        <p className="auth-subtitle">Crie sua conta de jogador para se inscrever em mesas.</p>

        {erro && <div className="auth-error">{erro}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="confirmarSenha">Confirmar senha</label>
            <input
              id="confirmarSenha"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-submit" disabled={enviando}>
            {enviando ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <div className="auth-links">
          <span>Já tem conta? <Link to="/login">Entre aqui</Link></span>
        </div>
      </div>
    </div>
  )
}

export default Cadastro
