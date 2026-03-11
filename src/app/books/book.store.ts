import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

import { BookService } from './book.service';
import { BookSearchParams, BookSearchResponse, BookSearchResult } from './openlibrary.types';

interface BooksState {
  books: BookSearchResult[];
  selectedBook: BookSearchResult | null;
  searchParams: BookSearchParams;
  isLoading: boolean;
  error: string | null;
  totalFound: number;
}

const initialState: BooksState = {
  books: [],
  selectedBook: null,
  searchParams: { q: '' },
  isLoading: false,
  error: null,
  totalFound: 0,
};

export const BooksStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ books, totalFound }) => ({
    hasBooks: computed(() => books().length > 0),
    hasMore: computed(() => books().length < totalFound()),
  })),
  withMethods((store) => {
    const bookService = inject(BookService);

    return {
      search: rxMethod<BookSearchParams>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((params) =>
            bookService.searchBooks(params).pipe(
              tap((result) => {
                if ('error' in result) {
                  patchState(store, {
                    error: (result as { error: string }).error,
                    isLoading: false,
                  });
                } else {
                  const response = result as BookSearchResponse;
                  patchState(store, {
                    books: response.docs,
                    totalFound: response.numFound,
                    searchParams: params,
                    isLoading: false,
                  });
                }
              }),
              catchError(() => {
                patchState(store, {
                  error: 'An unexpected error occurred. Please try again.',
                  isLoading: false,
                });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      selectBook(book: BookSearchResult | null): void {
        patchState(store, { selectedBook: book });
      },

      clearSearch(): void {
        patchState(store, {
          books: [],
          totalFound: 0,
          searchParams: { q: '' },
          error: null,
        });
      },
    };
  }),
);
