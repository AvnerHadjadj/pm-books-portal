import { Routes } from '@angular/router';

export const BOOKS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./books-page/books-page').then((m) => m.BooksPageComponent),
  },
];
