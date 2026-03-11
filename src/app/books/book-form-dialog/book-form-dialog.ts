import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { BookSearchResult, BookUpsertInput } from '../openlibrary.types';

interface BookFormDialogData {
  mode: 'add' | 'edit';
  book?: BookSearchResult;
}

@Component({
  selector: 'app-book-form-dialog',
  templateUrl: './book-form-dialog.html',
  styleUrl: './book-form-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
})
export class BookFormDialogComponent {
  protected readonly data = inject<BookFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<BookFormDialogComponent, BookUpsertInput>);

  private readonly currentYear = new Date().getFullYear();

  protected readonly dialogTitle = computed(() =>
    this.data.mode === 'add' ? 'Add book' : 'Edit book',
  );

  protected readonly submitLabel = computed(() =>
    this.data.mode === 'add' ? 'Add book' : 'Save changes',
  );

  protected readonly form = new FormGroup({
    title: new FormControl(this.data.book?.title ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(180)],
    }),
    author: new FormControl(this.data.book?.author_name?.[0] ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(120)],
    }),
    first_publish_year: new FormControl(this.data.book?.first_publish_year ?? this.currentYear, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1450), Validators.max(this.currentYear + 1)],
    }),
    catalog_number: new FormControl(this.data.book?.lccn?.[0] ?? this.data.book?.oclc?.[0] ?? this.data.book?.isbn?.[0] ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(40), Validators.pattern(/^[A-Za-z0-9\-./\s]+$/)],
    }),
    ratings_average: new FormControl(this.data.book?.ratings_average ?? 0, {
      nonNullable: true,
      validators: [Validators.min(0), Validators.max(5)],
    }),
  });

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: BookUpsertInput = this.form.getRawValue();
    this.dialogRef.close(payload);
  }
}
