import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-sample-queries',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-sample-queries.component.html',
})
export class ChatSampleQueriesComponent {
  @Input() queries: string[] = [];
  @Output() querySelected = new EventEmitter<string>();
}
