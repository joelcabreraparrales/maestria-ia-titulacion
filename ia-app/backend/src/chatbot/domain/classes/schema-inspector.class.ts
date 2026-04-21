import { SchemaInfo } from "../interfaces/schema-info.interface";

export abstract class SchemaInspector {
  public abstract getSchemas(schemaNames: string[]): Promise<SchemaInfo>;
}
