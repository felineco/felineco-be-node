// src/modules/ai-assistants/enums/assistant-ws-event.enum.ts
export enum AssistantWsEventRequestEnum {
  PING = 'ping',
  AUDIO_CHUNK = 'audio_chunk',
}

export enum AssistantWsEventResponseEnum {
  SESSION_CREATED = 'session_created',
  SESSION_CLOSED = 'session_closed',
  ERROR = 'error',
  PONG = 'pong',
  AUDIO_CHUNK_RECEIVED = 'audio_chunk_received',
}

const syncPrefix = 'sync:';

export enum SyncEventBroadcastEnum {
  INITIALIZE = `${syncPrefix}initialize`,
  ADD_IMAGES = `${syncPrefix}add_images`,
  DELETE_IMAGES = `${syncPrefix}delete_images`,
  ADD_AUDIOS = `${syncPrefix}add_audios`,
  DELETE_AUDIOS = `${syncPrefix}delete_audios`,
  UPDATE_NOTE_FIELDS = `${syncPrefix}update_note_fields`,
  DELETE_FIELDS = `${syncPrefix}delete_fields`,
  UPDATE_REMINDER_FIELDS = `${syncPrefix}update_reminder_fields`,
  UPDATE_WARNING_FIELDS = `${syncPrefix}update_warning_fields`,
  PONG = `${syncPrefix}pong`,
}
