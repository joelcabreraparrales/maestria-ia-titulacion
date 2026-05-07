import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ComputedChart, TableState } from '../../models/chat.models';
import { ChartBuilderService } from '../../services/chart-builder.service';

@Component({
  selector: 'app-chat-charts-grid',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './chat-charts-grid.component.html',
  styles: [`
    @keyframes chartReveal { from{opacity:0;transform:translateY(22px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
    .chart-in { animation: chartReveal .55s cubic-bezier(.22,1,.36,1) both }
  `]
})
export class ChatChartsGridComponent {
  @Input() charts: ComputedChart[] = [];

  private tableStates = new Map<string, TableState>();

  constructor(readonly chartBuilder: ChartBuilderService) {}

  private getTableState(chartId: string): TableState {
    if (!this.tableStates.has(chartId)) {
      this.tableStates.set(chartId, { page: 0, sortKey: '', sortAsc: true });
    }
    return this.tableStates.get(chartId)!;
  }

  getTablePage(chartId: string): number { return this.getTableState(chartId).page; }

  getTablePageCount(chart: ComputedChart): number { return Math.ceil(chart.tableData.length / 10); }

  getTableRows(chart: ComputedChart): Record<string, unknown>[] {
    const state = this.getTableState(chart.chartId);
    let rows = [...chart.tableData];
    if (state.sortKey) {
      rows = rows.sort((a, b) => {
        const av = a[state.sortKey];
        const bv = b[state.sortKey];
        const an = parseFloat(String(av ?? ''));
        const bn = parseFloat(String(bv ?? ''));
        const cmp = !isNaN(an) && !isNaN(bn) ? an - bn : String(av ?? '').localeCompare(String(bv ?? ''));
        return state.sortAsc ? cmp : -cmp;
      });
    }
    const start = state.page * 10;
    return rows.slice(start, start + 10);
  }

  toggleSort(chartId: string, key: string): void {
    const state = this.getTableState(chartId);
    if (state.sortKey === key) { state.sortAsc = !state.sortAsc; }
    else { state.sortKey = key; state.sortAsc = true; }
  }

  setTablePage(chartId: string, page: number): void { this.getTableState(chartId).page = page; }

  getSortIndicator(chartId: string, key: string): string {
    const state = this.getTableState(chartId);
    if (state.sortKey !== key) return '';
    return state.sortAsc ? '↑' : '↓';
  }

  formatTableCell(value: unknown, type: string): string {
    if (value == null) return '—';
    if (type === 'date') {
      const d = new Date(String(value));
      return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short' });
    }
    if (type === 'number') {
      const n = parseFloat(String(value));
      return isNaN(n) ? String(value) : n.toLocaleString('es-ES', { maximumFractionDigits: 2 });
    }
    return String(value);
  }
}
