export type ToastTone = 'success' | 'error'

export interface ToastItem {
  id: string
  message: string
  tone: ToastTone
}

type Listener = (toasts: ToastItem[]) => void

let toasts: ToastItem[] = []
const listeners = new Set<Listener>()

function emit() {
  for (const listener of listeners) listener(toasts)
}

export function showToast(message: string, tone: ToastTone = 'success') {
  const item: ToastItem = {
    id: `toast-${crypto.randomUUID()}`,
    message,
    tone,
  }
  toasts = [...toasts, item]
  emit()
  window.setTimeout(() => dismissToast(item.id), 4200)
}

export function dismissToast(id: string) {
  toasts = toasts.filter((item) => item.id !== id)
  emit()
}

export function subscribeToasts(listener: Listener) {
  listeners.add(listener)
  listener(toasts)
  return () => {
    listeners.delete(listener)
  }
}
