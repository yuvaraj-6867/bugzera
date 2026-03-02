type ConfirmHandler = (message: string, title?: string) => Promise<boolean>

let _handler: ConfirmHandler | null = null

export const registerConfirmHandler = (handler: ConfirmHandler) => {
  _handler = handler
}

export const confirmDialog = (message: string, title = 'Are you sure?'): Promise<boolean> => {
  if (_handler) return _handler(message, title)
  return Promise.resolve(window.confirm(message))
}
