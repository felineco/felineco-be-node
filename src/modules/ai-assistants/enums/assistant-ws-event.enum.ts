// src/modules/ai-assistants/enums/assistant-ws-event.enum.ts
export enum AssistantWsEventRequestEnum {
  CHAT_MESSAGE = 'chat_message',
  PING = 'ping',
}

export enum AssistantWsEventResponseEnum {
  SESSION_CREATED = 'session_created',
  SESSION_CLOSED = 'session_closed',
  PONG = 'pong',
  ERROR = 'error',
}

const broadcastPrefix = 'broadcast:';

export enum AssistantWsEventBroadcastEnum {
  INITIALIZE = `${broadcastPrefix}initialize`,
  ADD_IMAGES = `${broadcastPrefix}add_images`,
  DELETE_IMAGES = `${broadcastPrefix}delete_images`,
  ADD_AUDIOS = `${broadcastPrefix}add_audios`,
  DELETE_AUDIOS = `${broadcastPrefix}delete_audios`,
  UPDATE_FIELDS = `${broadcastPrefix}update_fields`,
  DELETE_FIELDS = `${broadcastPrefix}delete_fields`,
  PONG = `${broadcastPrefix}pong`,
}
