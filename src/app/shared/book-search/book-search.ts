import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { BookSearchParams, SortOption } from '../../books/openlibrary.types';

@Component({
  selector: 'app-book-search',
  templateUrl: './book-search.html',
  styleUrl: './book-search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TitleCasePipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
})
export class BookSearchComponent {
  readonly isLoading = input<boolean>(false);
  readonly searched = output<BookSearchParams>();
  readonly cleared = output<void>();

  readonly sortOptions: SortOption[] = ['relevance', 'new', 'old', 'rating', 'title', 'random'];
  readonly limitOptions = [10, 25, 50, 100];

  readonly form = new FormGroup({
    q: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3)
      ]
    }),
    author: new FormControl('', { nonNullable: true }),
    sort: new FormControl<SortOption>('relevance', { nonNullable: true }),
    limit: new FormControl(10, { nonNullable: true }),
  });

  onSearch(): void {
    if (!this.form.value.q?.trim()) return;
    const { q, author, sort, limit } = this.form.getRawValue();
    const params: BookSearchParams = { q: q.trim(), sort, limit };
    if (author.trim()) params.author = author.trim();
    this.searched.emit(params);
  }

  onClear(): void {
    this.form.reset({ q: '', author: '', sort: 'relevance', limit: 10 });
    this.cleared.emit();
  }
}
