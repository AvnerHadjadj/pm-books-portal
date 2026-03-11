import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, filter, switchMap, tap } from 'rxjs/operators';

import { BookService } from './book.service';
import { ApiError, BookSearchParams, BookSearchResponse, BookSearchResult, BookUpsertInput } from './openlibrary.types';

const INITIAL_LIST_LENGTH = 200;
const DEFAULT_PAGE_SIZE = 10;

interface BooksState {
    books: BookSearchResult[];
    filteredBooks: BookSearchResult[];
    checkedOutBookKeys: string[];
    selectedBook: BookSearchResult | null;
    searchParams: BookSearchParams;
    isLoading: boolean;
    error: string | null;
    totalFound: number;
}

const initialState: BooksState = {
    books: [],
    filteredBooks: [],
    checkedOutBookKeys: [],
    selectedBook: null,
    searchParams: { q: '', limit: DEFAULT_PAGE_SIZE, offset: 0 },
    isLoading: false,
    error: null,
    totalFound: 0,
};

export const BooksStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withComputed(({ books, totalFound, searchParams, filteredBooks, checkedOutBookKeys }) => ({
        hasBooks: computed(() => books().length > 0),
        hasMore: computed(() => books().length < totalFound()),
        loadedCount: computed(() => filteredBooks().length),
        checkedOutCount: computed(() => checkedOutBookKeys().length),
        availableCount: computed(() => Math.max(0, books().length - checkedOutBookKeys().length)),
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

        const normalizeToken = (value: string): string =>
            value
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');

        const buildNewBook = (input: BookUpsertInput): BookSearchResult => {
            const nowEpochSeconds = Math.floor(Date.now() / 1000);
            const normalizedAuthor = normalizeToken(input.author) || 'unknown-author';
            const generatedKey = `/works/LOCAL-${Date.now()}-${Math.floor(Math.random() * 100_000)}`;

            return {
                key: generatedKey,
                type: 'work',
                seed: [generatedKey],
                title: input.title.trim(),
                title_suggest: input.title.trim(),
                title_sort: input.title.trim().toLowerCase(),
                edition_count: 1,
                edition_key: [],
                publish_date: [String(input.first_publish_year)],
                publish_year: [input.first_publish_year],
                first_publish_year: input.first_publish_year,
                number_of_pages_median: 0,
                lccn: [input.catalog_number.trim()],
                publish_place: [],
                oclc: [],
                contributor: [],
                lcc: [],
                ddc: [],
                isbn: [],
                last_modified_i: nowEpochSeconds,
                ebook_count_i: 0,
                ebook_access: 'no_ebook',
                has_fulltext: false,
                public_scan_b: false,
                ia: [],
                ia_collection: [],
                ia_collection_s: '',
                lending_edition_s: '',
                lending_identifier_s: '',
                printdisabled_s: '',
                ratings_average: input.ratings_average ?? 0,
                ratings_sortable: input.ratings_average ?? 0,
                ratings_count: 0,
                ratings_count_1: 0,
                ratings_count_2: 0,
                ratings_count_3: 0,
                ratings_count_4: 0,
                ratings_count_5: 0,
                readinglog_count: 0,
                want_to_read_count: 0,
                currently_reading_count: 0,
                already_read_count: 0,
                cover_edition_key: '',
                cover_i: 0,
                publisher: [],
                language: [],
                author_key: [normalizedAuthor],
                author_name: [input.author.trim()],
                author_alternative_name: [],
                person: [],
                place: [],
                subject: ['Manual Entry'],
                time: [],
                id_amazon: [],
                id_librarything: [],
                id_goodreads: [],
                id_google: [],
                id_project_gutenberg: [],
                id_standard_ebooks: [],
            };
        };

        const applyBookUpdate = (book: BookSearchResult, input: BookUpsertInput): BookSearchResult => {
            const updatedTitle = input.title.trim();
            const updatedAuthor = input.author.trim();
            const updatedCatalog = input.catalog_number.trim();
            const normalizedAuthor = normalizeToken(updatedAuthor) || 'unknown-author';

            return {
                ...book,
                title: updatedTitle,
                title_suggest: updatedTitle,
                title_sort: updatedTitle.toLowerCase(),
                author_name: [updatedAuthor],
                author_key: [normalizedAuthor],
                first_publish_year: input.first_publish_year,
                publish_year: [input.first_publish_year],
                publish_date: [String(input.first_publish_year)],
                lccn: [updatedCatalog],
                ratings_average: input.ratings_average ?? book.ratings_average,
                ratings_sortable: input.ratings_average ?? book.ratings_sortable,
            };
        };

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
                        const filteredBooks = books.filter((book) => {
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

            isBookCheckedOut(bookKey: string): boolean {
                return store.checkedOutBookKeys().includes(bookKey);
            },

            toggleBookLending(bookKey: string): boolean {
                const isCurrentlyCheckedOut = store.checkedOutBookKeys().includes(bookKey);
                const nextCheckedOutBookKeys = isCurrentlyCheckedOut
                    ? store.checkedOutBookKeys().filter((key) => key !== bookKey)
                    : [...store.checkedOutBookKeys(), bookKey];

                patchState(store, { checkedOutBookKeys: nextCheckedOutBookKeys });
                return !isCurrentlyCheckedOut;
            },

            addBook(input: BookUpsertInput): void {
                const createdBook = buildNewBook(input);
                const nextBooks = [createdBook, ...store.books()];
                const nextFilteredBooks = [createdBook, ...store.filteredBooks()];

                patchState(store, {
                    books: nextBooks,
                    filteredBooks: nextFilteredBooks,
                    totalFound: nextBooks.length,
                });
            },

            editBook(targetKey: string, input: BookUpsertInput): void {
                const nextBooks = store.books().map((book) =>
                    book.key === targetKey ? applyBookUpdate(book, input) : book,
                );
                const nextFilteredBooks = store.filteredBooks().map((book) =>
                    book.key === targetKey ? applyBookUpdate(book, input) : book,
                );
                const selectedBook = store.selectedBook();

                patchState(store, {
                    books: nextBooks,
                    filteredBooks: nextFilteredBooks,
                    selectedBook: selectedBook?.key === targetKey ? applyBookUpdate(selectedBook, input) : selectedBook,
                });
            },

            deleteBook(bookToDelete: BookSearchResult): void {
                const nextBooks = store.books().filter((book) => book.key !== bookToDelete.key);
                const nextFilteredBooks = store.filteredBooks().filter((book) => book.key !== bookToDelete.key);

                patchState(store, {
                    books: nextBooks,
                    filteredBooks: nextFilteredBooks,
                    checkedOutBookKeys: store.checkedOutBookKeys().filter((bookKey) => bookKey !== bookToDelete.key),
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
