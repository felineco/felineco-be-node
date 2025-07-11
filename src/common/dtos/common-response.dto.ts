export interface Response<T> {
  data: T;
  meta?: any;
  statusCode: number;
  timestamp: string;
}
