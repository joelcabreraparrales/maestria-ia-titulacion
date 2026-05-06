import { Routes } from '@angular/router';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { AiBiChatComponent } from './pages/ai-bi-chat/ai-bi-chat.component';
import { authGuard } from './shared/guards/auth.guard';
import { publicGuard } from './shared/guards/public.guard';

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'ai-bi-chat',
        pathMatch: 'full',
      },
      {
        path: 'ai-bi-chat',
        component: AiBiChatComponent,
        title: 'Chat BI con IA | IA App',
      },
    ]
  },
  // auth pages
  {
    path: 'signin',
    component: SignInComponent,
    canActivate: [publicGuard],
    title: 'Iniciar sesión | IA App',
  },
  {
    path: 'signup',
    component: SignUpComponent,
    canActivate: [publicGuard],
    title: 'Crear cuenta | IA App',
  },
  // error pages
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Página no encontrada | IA App',
  },
];
