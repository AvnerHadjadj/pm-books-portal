import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { BookFormDialogComponent } from './book-form-dialog';
import { BookSearchResult } from '../openlibrary.types';

const sampleBook = {
    key: '/works/1',
    title: 'Existing Book',
    author_name: ['Existing Author'],
    first_publish_year: 2005,
    lccn: ['CAT-100'],
    ratings_average: 3.5,
} as unknown as BookSearchResult;

describe('BookFormDialogComponent', () => {
    it('does not submit when form is invalid', async () => {
        const closeSpy = vi.fn();

        await TestBed.configureTestingModule({
            imports: [BookFormDialogComponent],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: { mode: 'add' } },
                { provide: MatDialogRef, useValue: { close: closeSpy } },
            ],
        }).compileComponents();

        const fixture = TestBed.createComponent(BookFormDialogComponent);
        fixture.detectChanges();

        const component = fixture.componentInstance as unknown as {
            form: { patchValue: (value: unknown) => void; markAllAsTouched: () => void };
            onSubmit: () => void;
        };

        component.form.patchValue({ title: '', author: '', catalog_number: '' });
        component.onSubmit();

        expect(closeSpy).not.toHaveBeenCalled();
    });

    it('submits valid add form payload', async () => {
        const closeSpy = vi.fn();

        await TestBed.configureTestingModule({
            imports: [BookFormDialogComponent],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: { mode: 'add' } },
                { provide: MatDialogRef, useValue: { close: closeSpy } },
            ],
        }).compileComponents();

        const fixture = TestBed.createComponent(BookFormDialogComponent);
        fixture.detectChanges();

        const component = fixture.componentInstance as unknown as {
            form: { setValue: (value: unknown) => void };
            onSubmit: () => void;
        };

        component.form.setValue({
            title: 'Domain-Driven Design',
            author: 'Eric Evans',
            first_publish_year: 2003,
            catalog_number: 'CAT-2003',
            ratings_average: 4.9,
        });

        component.onSubmit();

        expect(closeSpy).toHaveBeenCalledWith({
            title: 'Domain-Driven Design',
            author: 'Eric Evans',
            first_publish_year: 2003,
            catalog_number: 'CAT-2003',
            ratings_average: 4.9,
        });
    });

    it('pre-populates values in edit mode', async () => {
        await TestBed.configureTestingModule({
            imports: [BookFormDialogComponent],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: { mode: 'edit', book: sampleBook } },
                { provide: MatDialogRef, useValue: { close: vi.fn() } },
            ],
        }).compileComponents();

        const fixture = TestBed.createComponent(BookFormDialogComponent);
        fixture.detectChanges();

        const component = fixture.componentInstance as unknown as {
            form: {
                getRawValue: () => {
                    title: string;
                    author: string;
                    first_publish_year: number;
                    catalog_number: string;
                    ratings_average: number;
                };
            };
        };

        expect(component.form.getRawValue()).toEqual({
            title: 'Existing Book',
            author: 'Existing Author',
            first_publish_year: 2005,
            catalog_number: 'CAT-100',
            ratings_average: 3.5,
        });
    });
});
