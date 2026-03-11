import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

import { BookSearchResult } from '../openlibrary.types';

interface BookDetailsDialogData {
  book: BookSearchResult;
}

@Component({
  selector: 'app-book-details-dialog',
  templateUrl: './book-details-dialog.html',
  styleUrl: './book-details-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    NgOptimizedImage,
    MatDialogModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
  ],
})
export class BookDetailsDialogComponent {
  protected readonly data = inject<BookDetailsDialogData>(MAT_DIALOG_DATA);

  protected readonly coverUrl = computed(() => {
    const coverId = this.data.book.cover_i;
    return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null;
  });

  protected readonly authors = computed(() => this.data.book.author_name?.join(', ') ?? 'Unknown author');
  protected readonly subjects = computed(() => this.data.book.subject?.slice(0, 10) ?? []);
}
