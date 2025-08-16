export enum Privilege {
  USER = 'user',
  SESSION_TEMPLATE = 'session_template',
}

export enum Operation {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
}

export function isPrivilege(value: string): value is Privilege {
  return Object.values(Privilege).includes(value as Privilege);
}

export function isAction(value: string): value is Operation {
  return Object.values(Operation).includes(value as Operation);
}
