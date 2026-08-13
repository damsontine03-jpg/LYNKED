const TOKEN_KEY = 'ht.session'

export function getApiBase() {
  return (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
}

export function getStoredToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function storeToken(token: string | null) {
  if (typeof window === 'undefined') return
  if (token) window.localStorage.setItem(TOKEN_KEY, token)
  else window.localStorage.removeItem(TOKEN_KEY)
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const token = options.token === undefined ? getStoredToken() : options.token
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers,
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T
  if (!res.ok) {
    throw new Error(data.error || 'Request failed')
  }
  return data
}
