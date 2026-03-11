import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { BooksPageComponent } from './books-page';
import { BooksStore } from '../book.store';
import { BookSearchResult, BookUpsertInput } from '../openlibrary.types';

const sampleBook = {
  key: '/works/1',
  title: 'Sample',
} as unknown as BookSearchResult;

describe('BooksPageComponent', () => {
  const createStoreMock = () => ({
    error: () => null,
    hasBooks: () => false,
    hasMore: () => false,
    loadedCount: () => 0,
    totalFound: () => 0,
    checkedOutCount: () => 0,
    availableCount: () => 0,
    checkedOutBookKeys: () => [],
    pageSize: () => 10,
    currentPage: () => 0,
    totalPages: () => 0,
    filteredBooks: () => [],
    searchParams: () => ({ q: '', limit: 10, offset: 0 }),
    isLoading: () => false,
    loadInitialBooks: vi.fn(),
    filterBooks: vi.fn(),
    clearSearch: vi.fn(),
    selectBook: vi.fn(),
    addBook: vi.fn(),
    editBook: vi.fn(),
    deleteBook: vi.fn(),
    toggleBookLending: vi.fn(() => true),
  });

  it('loads initial books on construction when list is empty', async () => {
    const storeMock = createStoreMock();

    await TestBed.configureTestingModule({
      imports: [BooksPageComponent],
      providers: [
        { provide: BooksStore, useValue: storeMock },
        {
          provide: MatDialog,
          useValue: { open: vi.fn(() => ({ afterClosed: () => of(undefined) })) },
        },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    TestBed.createComponent(BooksPageComponent);

    expect(storeMock.loadInitialBooks).toHaveBeenCalled();
  });

  it('adds a book when add dialog returns payload', async () => {
    const storeMock = createStoreMock();
    const snackOpen = vi.fn();
    const payload: BookUpsertInput = {
      title: 'Clean Code',
      author: 'Robert C. Martin',
      first_publish_year: 2008,
      catalog_number: 'CAT-2008',
      ratings_average: 4.8,
    };

    await TestBed.configureTestingModule({
      imports: [BooksPageComponent],
      providers: [
        { provide: BooksStore, useValue: storeMock },
        {
          provide: MatDialog,
          useValue: { open: vi.fn(() => ({ afterClosed: () => of(payload) })) },
        },
        { provide: MatSnackBar, useValue: { open: snackOpen } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(BooksPageComponent);
    const component = fixture.componentInstance;

    component.onAddBook();

    expect(storeMock.addBook).toHaveBeenCalledWith(payload);
    expect(snackOpen).toHaveBeenCalled();
  });

  it('edits a book when edit dialog returns payload', async () => {
    const storeMock = createStoreMock();
    const payload: BookUpsertInput = {
      title: 'Refactoring 2nd Ed',
      author: 'Martin Fowler',
      first_publish_year: 2018,
      catalog_number: 'CAT-2018',
      ratings_average: 4.6,
    };

    await TestBed.configureTestingModule({
      imports: [BooksPageComponent],
      providers: [
        { provide: BooksStore, useValue: storeMock },
        {
          provide: MatDialog,
          useValue: { open: vi.fn(() => ({ afterClosed: () => of(payload) })) },
        },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(BooksPageComponent);
    const component = fixture.componentInstance;

    component.onBookEdited(sampleBook);

    expect(storeMock.editBook).toHaveBeenCalledWith('/works/1', payload);
  });

  it('deletes a book and shows feedback', async () => {
    const storeMock = createStoreMock();
    const snackOpen = vi.fn();

    await TestBed.configureTestingModule({
      imports: [BooksPageComponent],
      providers: [
        { provide: BooksStore, useValue: storeMock },
        {
          provide: MatDialog,
          useValue: { open: vi.fn(() => ({ afterClosed: () => of(undefined) })) },
        },
        { provide: MatSnackBar, useValue: { open: snackOpen } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(BooksPageComponent);
    const component = fixture.componentInstance;

    component.onBookDeleted(sampleBook);

    expect(storeMock.deleteBook).toHaveBeenCalledWith(sampleBook);
    expect(snackOpen).toHaveBeenCalled();
  });

  it('toggles lending state and shows feedback', async () => {
    const storeMock = createStoreMock();
    const snackOpen = vi.fn();
    storeMock.toggleBookLending = vi.fn(() => true);

    await TestBed.configureTestingModule({
      imports: [BooksPageComponent],
      providers: [
        { provide: BooksStore, useValue: storeMock },
        {
          provide: MatDialog,
          useValue: { open: vi.fn(() => ({ afterClosed: () => of(undefined) })) },
        },
        { provide: MatSnackBar, useValue: { open: snackOpen } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(BooksPageComponent);
    const component = fixture.componentInstance;

    component.onBookLendingToggled(sampleBook);

    expect(storeMock.toggleBookLending).toHaveBeenCalledWith('/works/1');
    expect(snackOpen).toHaveBeenCalled();
  });
});
