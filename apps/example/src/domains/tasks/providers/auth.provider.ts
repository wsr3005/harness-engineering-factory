export interface AuthProvider {
  getActorId(): string;
  canMutateTasks(actorId: string): boolean;
}

export class StubAuthProvider implements AuthProvider {
  constructor(private readonly actorId = 'system') {}

  getActorId(): string {
    return this.actorId;
  }

  canMutateTasks(actorId: string): boolean {
    return actorId.length > 0;
  }
}
