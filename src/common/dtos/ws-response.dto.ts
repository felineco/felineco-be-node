export interface WsResponse<T> {
  data?: T;
  message?: string;
  event?: string;
  socketId: string;
  timestamp: string;
  msgId: string;
}

export interface WsHandlerReturnInterface<T> {
  data?: T;
  message?: string;
  event: string;
}
