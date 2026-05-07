import { Component } from '@angular/core';

@Component({
  selector: 'app-chat-hero-banner',
  standalone: true,
  imports: [],
  templateUrl: './chat-hero-banner.component.html',
  styles: [`
    @keyframes aiBreath  { 0%,100%{transform:scale(1)}     50%{transform:scale(1.07)} }
    @keyframes orbitA    { from{transform:rotate(0deg)}    to{transform:rotate(360deg)}  }
    @keyframes orbitB    { from{transform:rotate(0deg)}    to{transform:rotate(-360deg)} }
    @keyframes orbitC    { from{transform:rotate(60deg)}   to{transform:rotate(420deg)}  }
    @keyframes heroFloat { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-9px)} }
    .ai-breathe { animation: aiBreath  3s ease-in-out infinite }
    .orbit-a    { animation: orbitA    8s linear      infinite; transform-origin:center }
    .orbit-b    { animation: orbitB   13s linear      infinite; transform-origin:center }
    .orbit-c    { animation: orbitC   10s linear      infinite; transform-origin:center }
    .hero-float { animation: heroFloat  5s ease-in-out infinite }
  `]
})
export class ChatHeroBannerComponent {}
