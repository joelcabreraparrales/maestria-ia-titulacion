import { RefreshResult } from "../interfaces/refresh.result.interface";

export abstract class RefreshSessionUseCase {
  public abstract refresh(sessionCode: string, token: string): Promise<RefreshResult>;
}
