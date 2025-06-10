const WorkerMessageTypes = [
  'init',
  'initialized',
  'client_rpc',
  'log',
  'open',
  'join',
  'error',
  'unsubscribe',
  'cleanup',
  'parse_invite_code',
] as const

export type WorkerMessageType = (typeof WorkerMessageTypes)[number]
