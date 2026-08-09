export async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const dados = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(dados.erro || 'Ocorreu um erro inesperado.')
  }
  return dados
}
