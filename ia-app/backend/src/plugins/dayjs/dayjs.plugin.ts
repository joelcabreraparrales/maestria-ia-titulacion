import dayjs, { ManipulateType } from 'dayjs';
import { DateManager } from './dayjs.class';

export class ImpDateManager extends DateManager {
  public add(date: string, value: number, unit: ManipulateType): string {
    const $date = dayjs(date);
    return $date.add(value, unit).format('YYYY-MM-DD HH:mm:ss');
  }
  public transformDate(date: string, format?: string): string {
    let formatDate = format;
    if (!format) {
      formatDate = 'YYYY-MM-DD';
    }
    return dayjs(date).format(formatDate);
  }
  public getStringDate(format?: string): string {
    let formatDate = format;
    if (!format) {
      formatDate = 'YYYY-MM-DD';
    }
    return dayjs().format(formatDate);
  }
}
