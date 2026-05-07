import { Component, Input, Output, EventEmitter, ViewChild, ElementRef,
         AfterViewChecked, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SafeHtmlPipe } from '../../../../shared/pipe/safe-html.pipe';
import { ChatMessage } from '../../models/chat.models';
import { ChatMessageComponent } from '../chat-message/chat-message.component';

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeHtmlPipe, ChatMessageComponent],
  templateUrl: './chat-panel.component.html',
  styles: [`
    @keyframes btnPulse  { 0%{box-shadow:0 0 0 0 rgba(70,95,255,.55)} 70%{box-shadow:0 0 0 14px rgba(70,95,255,0)} 100%{box-shadow:0 0 0 0 rgba(70,95,255,0)} }
    @keyframes chatSlide { from{opacity:0;transform:translateY(14px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes aiBreath  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.07)} }
    .btn-pulse  { animation: btnPulse  2s ease-in-out infinite }
    .chat-panel { animation: chatSlide .25s cubic-bezier(.22,1,.36,1) }
    .ai-breathe { animation: aiBreath  3s ease-in-out infinite }
    .dot-1 { animation: dotJump 1.4s ease-in-out         infinite }
    .dot-2 { animation: dotJump 1.4s ease-in-out .2s     infinite }
    .dot-3 { animation: dotJump 1.4s ease-in-out .4s     infinite }
    @keyframes dotJump { 0%,60%,100%{transform:translateY(0);opacity:.55} 30%{transform:translateY(-5px);opacity:1} }
  `]
})
export class ChatPanelComponent implements AfterViewChecked, OnChanges {
  @ViewChild('msgContainer') msgContainer!: ElementRef<HTMLDivElement>;

  @Input() messages: ChatMessage[] = [];
  @Input() isOpen = false;
  @Input() isTyping = false;
  @Input() prefillMessage = '';

  @Output() toggle = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();
  @Output() messageSent = new EventEmitter<string>();
  @Output() followUpSelected = new EventEmitter<string>();

  userMessage = '';
  shouldScroll = false;

  readonly icons = {
    send:  `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"/></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>`,
    chat:  `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"/></svg>`,
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['messages']) this.shouldScroll = true;
    if (changes['prefillMessage']?.currentValue) {
      this.userMessage = changes['prefillMessage'].currentValue;
    }
    if (changes['isOpen']?.currentValue === true) this.shouldScroll = true;
  }

  sendMessage(): void {
    const text = this.userMessage.trim();
    if (!text || this.isTyping) return;
    this.messageSent.emit(text);
    this.userMessage = '';
    this.shouldScroll = true;
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.msgContainer) {
      const el = this.msgContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
  }
}
