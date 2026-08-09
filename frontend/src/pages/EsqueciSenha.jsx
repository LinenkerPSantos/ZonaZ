import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

function EsqueciSenha() {
  const { esqueciSenha } = useAuth()
  const [email, setEmail] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setMensagem('')
    setEnviando(true)
    try {
      const { mensagem } = await esqueciSenha(email)
      setMensagem(mensagem)
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Esqueci minha senha</h1>
        <p className="auth-subtitle">
          Informe seu e-mail cadastrado. Se ele existir, enviaremos um link para redefinir a senha.
        </p>

        {erro && <div className="auth-error">{erro}</div>}
        {mensagem && <div className="auth-success">{mensagem}</div>}

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
          <button type="submit" className="auth-submit" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar link de redefinição'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Voltar para o login</Link>
        </div>
      </div>
    </div>
  )
}

export default EsqueciSenha
