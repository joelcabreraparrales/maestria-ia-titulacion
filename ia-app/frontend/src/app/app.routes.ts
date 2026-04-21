import { Routes } from '@angular/router';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { LineChartComponent } from './pages/charts/line-chart/line-chart.component';
import { BarChartComponent } from './pages/charts/bar-chart/bar-chart.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { AvatarElementComponent } from './pages/ui-elements/avatar-element/avatar-element.component';
import { BadgesComponent } from './pages/ui-elements/badges/badges.component';
import { ButtonsComponent } from './pages/ui-elements/buttons/buttons.component';
import { ImagesComponent } from './pages/ui-elements/images/images.component';
import { VideosComponent } from './pages/ui-elements/videos/videos.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { CalenderComponent } from './pages/calender/calender.component';
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
        component: EcommerceComponent,
        pathMatch: 'full',
        title: 'Dashboard | IA App',
      },
      {
        path: 'calendar',
        component: CalenderComponent,
        title: 'Calendario | IA App',
      },
      {
        path: 'profile',
        component: ProfileComponent,
        title: 'Perfil | IA App',
      },
      {
        path: 'form-elements',
        component: FormElementsComponent,
        title: 'Elementos de formulario | IA App',
      },
      {
        path: 'basic-tables',
        component: BasicTablesComponent,
        title: 'Tablas | IA App',
      },
      {
        path: 'blank',
        component: BlankComponent,
        title: 'Página en blanco | IA App',
      },
      {
        path: 'invoice',
        component: InvoicesComponent,
        title: 'Facturas | IA App',
      },
      {
        path: 'line-chart',
        component: LineChartComponent,
        title: 'Gráfico de líneas | IA App',
      },
      {
        path: 'bar-chart',
        component: BarChartComponent,
        title: 'Gráfico de barras | IA App',
      },
      {
        path: 'alerts',
        component: AlertsComponent,
        title: 'Alertas | IA App',
      },
      {
        path: 'avatars',
        component: AvatarElementComponent,
        title: 'Avatares | IA App',
      },
      {
        path: 'badge',
        component: BadgesComponent,
        title: 'Insignias | IA App',
      },
      {
        path: 'buttons',
        component: ButtonsComponent,
        title: 'Botones | IA App',
      },
      {
        path: 'images',
        component: ImagesComponent,
        title: 'Imágenes | IA App',
      },
      {
        path: 'videos',
        component: VideosComponent,
        title: 'Videos | IA App',
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
