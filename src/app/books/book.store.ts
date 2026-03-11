import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, filter, switchMap, tap } from 'rxjs/operators';

import { BookService } from './book.service';
import { ApiError, BookSearchParams, BookSearchResponse, BookSearchResult } from './openlibrary.types';

const INITIAL_LIST_LENGTH = 200;
const DEFAULT_PAGE_SIZE = 10;

interface BooksState {
    books: BookSearchResult[];
    filteredBooks: BookSearchResult[];
    selectedBook: BookSearchResult | null;
    searchParams: BookSearchParams;
    isLoading: boolean;
    error: string | null;
    totalFound: number;
}

const initialState: BooksState = {
    books: [],
    filteredBooks: [],
    selectedBook: null,
    searchParams: { q: '', limit: DEFAULT_PAGE_SIZE, offset: 0 },
    isLoading: false,
    error: null,
    totalFound: 0,
};

export const BooksStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withComputed(({ books, totalFound, searchParams }) => ({
        hasBooks: computed(() => books().length > 0),
        hasMore: computed(() => books().length < totalFound()),
        loadedCount: computed(() => books().length),
        pageSize: computed(() => Math.max(1, searchParams().limit ?? DEFAULT_PAGE_SIZE)),
        currentPage: computed(() => {
            const size = Math.max(1, searchParams().limit ?? DEFAULT_PAGE_SIZE);
            return books().length > 0 ? Math.ceil(books().length / size) : 0;
        }),
        totalPages: computed(() => Math.ceil(totalFound() / Math.max(1, searchParams().limit ?? DEFAULT_PAGE_SIZE))),
    })),
    withMethods((store) => {
        const bookService = inject(BookService);

        const toErrorMessage = (result: BookSearchResponse | ApiError): string | null =>
            'error' in result ? result.error : null;

        return {
            loadInitialBooks: rxMethod<void>(
                pipe(
                    filter(() => !store.isLoading()),
                    tap(() => patchState(store, { isLoading: true, error: null })),
                    switchMap(() => {
                        const params: BookSearchParams = {
                            q: 'ratings_count:[0 TO *]',
                            limit: INITIAL_LIST_LENGTH,
                        };

                        return bookService.searchBooks(params).pipe(
                            tap((result) => {
                                patchState(store, {
                                    books: 'docs' in result ? result.docs : [],
                                    filteredBooks: 'docs' in result ? result.docs : [],
                                    totalFound: 'docs' in result ? result.docs.length : 0,
                                    searchParams: { ...params, offset: 'docs' in result ? result.docs.length : 0, q: '' },
                                    isLoading: false,
                                    error: toErrorMessage(result),
                                });
                            }),
                            catchError(() => {
                                patchState(store, {
                                    error: 'Failed to load initial books list.',
                                    isLoading: false,
                                });
                                return EMPTY;
                            }),
                        );
                    }),
                ),
            ),

            filterBooks: rxMethod<BookSearchParams>(
                pipe(
                    tap((params) => {
                        const books = store.books();
                        const filteredBooks = books?.filter((book) => book.title.toLowerCase().includes(params.q.toLowerCase())) || [];

                        patchState(store, {
                            filteredBooks: filteredBooks,
                        })
                    }),
                ),
            ),

            selectBook(book: BookSearchResult | null): void {
                patchState(store, { selectedBook: book });
            },

            clearSearch(): void {
                patchState(store, {
                    filteredBooks: store.books(),
                    totalFound: store.books().length,
                    searchParams: { q: '', limit: DEFAULT_PAGE_SIZE, offset: 0 },
                    selectedBook: null,
                    error: null,
                });
            },
        };
    }),
);
