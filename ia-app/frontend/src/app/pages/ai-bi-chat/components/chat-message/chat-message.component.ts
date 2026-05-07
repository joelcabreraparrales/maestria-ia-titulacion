import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../../models/chat.models';
import { ChartBuilderService } from '../../services/chart-builder.service';

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-message.component.html',
  styles: [`
    @keyframes msgReveal { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes stepIn    { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
    @keyframes spin      { to{transform:rotate(360deg)} }
    @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
    .msg-in  { animation: msgReveal .3s ease-out both }
    .step-in { animation: stepIn   .3s ease-out }
    .spin    { animation: spin     1s linear infinite }
    .cursor::after { content:'▋'; display:inline-block; margin-left:1px; animation:cursorBlink .7s step-end infinite }
  `]
})
export class ChatMessageComponent {
  @Input() message!: ChatMessage;
  @Input() animationDelay = '0ms';
  @Output() followUpSelected = new EventEmitter<string>();

  constructor(readonly chartBuilder: ChartBuilderService) {}

  formatTime(d: Date): string {
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
}
