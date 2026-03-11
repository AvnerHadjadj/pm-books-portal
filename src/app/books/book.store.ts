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
    withComputed(({ books, totalFound, searchParams, filteredBooks }) => ({
        hasBooks: computed(() => books().length > 0),
        hasMore: computed(() => books().length < totalFound()),
        loadedCount: computed(() => filteredBooks().length),
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

        const getAuthorForSort = (book: BookSearchResult): string =>
            book.author_name?.[0]?.trim().toLowerCase() ?? '';

        const getCatalogNumberForSort = (book: BookSearchResult): string =>
            book.lccn?.[0] ?? book.oclc?.[0] ?? book.isbn?.[0] ?? '';

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
                        let filteredBooks = books.filter((book) => {
                            const matchesAuthor = params.author
                                ? book.author_name?.some((author) =>
                                      author.toLowerCase().includes(params.author!.toLowerCase()),
                                  )
                                : true;

                            const matchesQuery = params.q
                                ? book.title.toLowerCase().includes(params.q.toLowerCase())
                                : true;

                            return matchesAuthor && matchesQuery;
                        }).sort((a, b) => {
                            switch (params.sort) {
                                case 'author':
                                    return getAuthorForSort(a).localeCompare(getAuthorForSort(b));
                                case 'catalogNumber':
                                    return getCatalogNumberForSort(a).localeCompare(getCatalogNumberForSort(b));
                                case 'publicationDate':
                                default:
                                    return (b.first_publish_year ?? 0) - (a.first_publish_year ?? 0);
                            }
                        });
                        
                        patchState(store, {
                            filteredBooks: filteredBooks,
                        })
                    }),
                ),
            ),

            selectBook(book: BookSearchResult | null): void {
                patchState(store, { selectedBook: book });
            },

            deleteBook(bookToDelete: BookSearchResult): void {
                const nextBooks = store.books().filter((book) => book.key !== bookToDelete.key);
                const nextFilteredBooks = store.filteredBooks().filter((book) => book.key !== bookToDelete.key);

                patchState(store, {
                    books: nextBooks,
                    filteredBooks: nextFilteredBooks,
                    totalFound: nextBooks.length,
                    selectedBook: store.selectedBook()?.key === bookToDelete.key ? null : store.selectedBook(),
                });
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
