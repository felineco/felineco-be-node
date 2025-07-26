import { Socket } from 'socket.io';

export interface CustomSocketData {
  userId?: string;
}

export interface CustomSocket extends Socket {
  data: CustomSocketData;
}
