import { ManipulateType } from "dayjs";

export abstract class DateManager {
  abstract getStringDate(format?: string): string;
  abstract transformDate(date: string, format?: string): string;
  abstract add(date: string, value: number, unit: ManipulateType): string;
}
