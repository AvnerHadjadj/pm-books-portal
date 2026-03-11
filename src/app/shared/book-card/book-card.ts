import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DecimalPipe, NgOptimizedImage } from '@angular/common';

import { BookSearchResult } from '../../books/openlibrary.types';

@Component({
  selector: 'app-book-card',
  templateUrl: './book-card.html',
  styleUrl: './book-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgOptimizedImage,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    DecimalPipe
  ],
})
export class BookCardComponent {
  readonly book = input.required<BookSearchResult>();
  readonly selected = output<BookSearchResult>();
  readonly edited = output<BookSearchResult>();
  readonly deleted = output<BookSearchResult>();

  readonly coverUrl = computed(() => {
    const coverId = this.book().cover_i;
    return coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
      : null;
  });

  readonly authorsText = computed(() =>
    this.book().author_name?.join(', ') ?? 'Unknown author',
  );

  readonly ratingStars = computed(() => {
    const avg = this.book().ratings_average ?? 0;
    const full = Math.round(avg);
    return [1, 2, 3, 4, 5].map((n) => (n <= full ? 'star' : 'star_border'));
  });

  readonly topSubjects = computed(() => this.book().subject?.slice(0, 3) ?? []);

  onSelect(): void {
    this.selected.emit(this.book());
  }

  onMenuTriggerClick(event: Event): void {
    event.stopPropagation();
  }

  onEdit(): void {
    this.edited.emit(this.book());
  }

  onDelete(): void {
    this.deleted.emit(this.book());
  }
}
