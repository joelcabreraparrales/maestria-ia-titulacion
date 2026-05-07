import * as env from "env-var";
import { EnvService } from "../../shared/domain/env.service";

export class EnvAdapter extends EnvService {
  public get(key: string): string {
    return env.get(key).required().asString();
  }

  public getInt(key: string, defaultValue?: number): number {
    const variable = env.get(key);
    if (defaultValue !== undefined) {
      return variable.default(defaultValue).asInt();
    }
    return variable.required().asInt();
  }

  public getOptional(key: string): string | undefined {
    return env.get(key).asString();
  }
}
