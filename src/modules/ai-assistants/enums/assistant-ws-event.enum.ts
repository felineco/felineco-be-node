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

const syncPrefix = 'sync:';

export enum SyncEventBroadcastEnum {
  INITIALIZE = `${syncPrefix}initialize`,
  ADD_IMAGES = `${syncPrefix}add_images`,
  DELETE_IMAGES = `${syncPrefix}delete_images`,
  ADD_AUDIOS = `${syncPrefix}add_audios`,
  DELETE_AUDIOS = `${syncPrefix}delete_audios`,
  UPDATE_NOTE_FIELDS = `${syncPrefix}update_note_fields`,
  DELETE_NOTE_FIELDS = `${syncPrefix}delete_note_fields`,
  UPDATE_REMINDER_FIELDS = `${syncPrefix}update_reminder_fields`,
  UPDATE_WARNING_FIELDS = `${syncPrefix}update_warning_fields`,
  PONG = `${syncPrefix}pong`,
}
