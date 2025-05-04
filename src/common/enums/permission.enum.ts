export enum Privilege {
  USER = 'user',
}

export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
}

export function isPrivilege(value: string): value is Privilege {
  return Object.values(Privilege).includes(value as Privilege);
}

export function isAction(value: string): value is Action {
  return Object.values(Action).includes(value as Action);
}
