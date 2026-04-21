import { randomUUID } from "crypto";
import { CodeGeneratorService } from "../../shared/domain/code.generator.service";

export class UuidCodeGeneratorService extends CodeGeneratorService {
  public generateCode(): string {
    return randomUUID();
  }
}
