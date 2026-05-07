import { Component } from '@angular/core';

@Component({
  selector: 'app-chat-empty-state',
  standalone: true,
  imports: [],
  template: `
    <div class="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center dark:border-gray-700 dark:bg-white/[0.02]">
      <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-7 text-brand-500">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/>
        </svg>
      </div>
      <h3 class="text-base font-semibold text-gray-800 dark:text-white/90 mb-1">Sin gráficos aún</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
        Usa el chat para hacer una consulta. Los gráficos generados por el LLM aparecerán aquí automáticamente.
      </p>
    </div>
  `,
})
export class ChatEmptyStateComponent {}
