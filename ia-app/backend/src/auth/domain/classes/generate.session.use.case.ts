import { GeneratedSessionResult } from "../interfaces/generated.session.result.interface";
import { Credential } from "./credential.class";

export abstract class GenerateSessionUseCase {
  public abstract generateSession(credential: Credential): Promise<GeneratedSessionResult>;
}
