import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';

import { BooksStore } from '../book.store';
import { BookDetailsDialogComponent } from '../book-details-dialog/book-details-dialog';
import { BookSearchComponent } from '../../shared/book-search/book-search';
import { BookListComponent } from '../../shared/book-list/book-list';
import { BookSearchParams, BookSearchResult } from '../openlibrary.types';

@Component({
  selector: 'app-books-page',
  templateUrl: './books-page.html',
  styleUrl: './books-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatToolbarModule,
    MatDividerModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    BookSearchComponent,
    BookListComponent,
  ],
})
export class BooksPageComponent {
  protected readonly store = inject(BooksStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  constructor() {
    effect(() => {
      const error = this.store.error();
      if (error) {
        this.snackBar.open(error, 'Dismiss', { duration: 5000 });
      }
    });

    if (!this.store.hasBooks() && !this.store.isLoading() && !this.store.searchParams().q) {
      this.store.loadInitialBooks();
    }
  }

  onSearch(params: BookSearchParams): void {
    this.store.filterBooks(params);
  }

  onCleared(): void {
    this.store.clearSearch();
  }

  onBookSelected(book: BookSearchResult): void {
    this.store.selectBook(book);

    const dialogRef = this.dialog.open(BookDetailsDialogComponent, {
      data: { book },
      maxWidth: '90vw',
      width: '760px',
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe(() => this.store.selectBook(null));
  }

  onBookDeleted(book: BookSearchResult): void {
    this.store.deleteBook(book);
    this.snackBar.open(`Deleted "${book.title}"`, 'Dismiss', { duration: 3000 });
  }
}
