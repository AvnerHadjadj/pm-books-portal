import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { BookCardComponent } from '../book-card/book-card';
import { BookSearchResult } from '../../books/openlibrary.types';

@Component({
  selector: 'app-book-list',
  templateUrl: './book-list.html',
  styleUrl: './book-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrollingModule, MatProgressSpinnerModule, BookCardComponent],
})
export class BookListComponent {
  readonly books = input.required<BookSearchResult[]>();
  readonly isLoading = input<boolean>(false);
  readonly bookSelected = output<BookSearchResult>();
  readonly bookEdited = output<BookSearchResult>();
  readonly bookDeleted = output<BookSearchResult>();

  trackByKey(_index: number, book: BookSearchResult): string {
    return book.key;
  }
}
