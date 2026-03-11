import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { BookSearchParams, SortOption } from '../../books/openlibrary.types';

interface SortSelectionOption {
  value: SortOption;
  label: string;
}

@Component({
  selector: 'app-book-search',
  templateUrl: './book-search.html',
  styleUrl: './book-search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
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

  readonly sortOptions: SortSelectionOption[] = [
    { value: 'author', label: 'Author' },
    { value: 'publicationDate', label: 'Publication date' },
    { value: 'catalogNumber', label: 'Catalog number' },
  ];

  readonly defaultSort: SortOption = 'publicationDate';

  readonly form = new FormGroup({
    q: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.minLength(3)
      ]
    }),
    author: new FormControl('', { nonNullable: true }),
    sort: new FormControl<SortOption>(this.defaultSort, { nonNullable: true }),
    limit: new FormControl(10, { nonNullable: true }),
  });

  onSearch(): void {
    const { q, author, sort, limit } = this.form.getRawValue();
    const params: BookSearchParams = { q: q.trim(), sort, limit };
    if (author.trim()) params.author = author.trim();
    this.searched.emit(params);
  }

  onClear(): void {
    this.form.reset({ q: '', author: '', sort: this.defaultSort, limit: 10 });
    this.cleared.emit();
  }
}
