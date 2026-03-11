import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { BooksStore } from './book.store';
import { BookService } from './book.service';
import { BookSearchResult, BookUpsertInput } from './openlibrary.types';

const createBook = (
  key: string,
  overrides: Partial<BookSearchResult> = {},
): BookSearchResult =>
    ({
      key,
      type: 'work',
      seed: [key],
      title: 'Sample title',
      title_suggest: 'Sample title',
      title_sort: 'sample title',
      edition_count: 1,
      edition_key: [],
      publish_date: ['2000'],
      publish_year: [2000],
      first_publish_year: 2000,
      number_of_pages_median: 0,
      lccn: ['CAT-1'],
      publish_place: [],
      oclc: [],
      contributor: [],
      lcc: [],
      ddc: [],
      isbn: [],
      last_modified_i: 0,
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
      ratings_average: 0,
      ratings_sortable: 0,
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
      author_key: ['author'],
      author_name: ['Author'],
      author_alternative_name: [],
      person: [],
      place: [],
      subject: [],
      time: [],
      id_amazon: [],
      id_librarything: [],
      id_goodreads: [],
      id_google: [],
      id_project_gutenberg: [],
      id_standard_ebooks: [],
      ...overrides,
    }) as BookSearchResult;

describe('BooksStore', () => {
  let store: InstanceType<typeof BooksStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: BookService,
          useValue: {
            searchBooks: vi.fn(() =>
              of({
                numFound: 0,
                start: 0,
                numFoundExact: true,
                docs: [],
                num_found: 0,
                q: '',
                offset: 0,
              }),
            ),
          },
        },
      ],
    });

    store = TestBed.inject(BooksStore);
  });

  it('adds a new book to books and filteredBooks', () => {
    const payload: BookUpsertInput = {
      title: 'New Book',
      author: 'Ada Lovelace',
      first_publish_year: 1843,
      catalog_number: 'QA-001',
      ratings_average: 4.5,
    };

    store.addBook(payload);

    expect(store.books().length).toBe(1);
    expect(store.filteredBooks().length).toBe(1);
    expect(store.books()[0].title).toBe('New Book');
    expect(store.totalFound()).toBe(1);
  });

  it('edits an existing book by key', () => {
    store.addBook({
      title: 'Old title',
      author: 'Old author',
      first_publish_year: 1990,
      catalog_number: 'CAT-OLD',
      ratings_average: 2,
    });

    const target = store.books()[0];

    store.editBook(target.key, {
      title: 'Updated title',
      author: 'Updated author',
      first_publish_year: 2001,
      catalog_number: 'CAT-NEW',
      ratings_average: 5,
    });

    const updated = store.books()[0];
    expect(updated.title).toBe('Updated title');
    expect(updated.author_name[0]).toBe('Updated author');
    expect(updated.first_publish_year).toBe(2001);
    expect(updated.lccn[0]).toBe('CAT-NEW');
    expect(updated.ratings_average).toBe(5);
  });

  it('deletes a selected book and clears selectedBook', () => {
    const bookA = createBook('/works/A', { title: 'A' });
    const bookB = createBook('/works/B', { title: 'B' });

    store.addBook({
      title: bookA.title,
      author: 'Author A',
      first_publish_year: 2000,
      catalog_number: 'A-1',
    });
    store.addBook({
      title: bookB.title,
      author: 'Author B',
      first_publish_year: 2001,
      catalog_number: 'B-1',
    });

    const selected = store.books()[0];
    store.selectBook(selected);

    store.deleteBook(selected);

    expect(store.books().some((book) => book.key === selected.key)).toBe(false);
    expect(store.filteredBooks().some((book) => book.key === selected.key)).toBe(false);
    expect(store.selectedBook()).toBeNull();
  });

  it('sorts filtered books by author, publication date, and catalog number', () => {
    const alpha = createBook('/works/alpha', {
      title: 'Alpha',
      author_name: ['Zed'],
      first_publish_year: 1990,
      lccn: ['CAT-9'],
    });
    const beta = createBook('/works/beta', {
      title: 'Beta',
      author_name: ['Alice'],
      first_publish_year: 2010,
      lccn: ['CAT-1'],
    });

    store.addBook({
      title: alpha.title,
      author: alpha.author_name[0],
      first_publish_year: alpha.first_publish_year,
      catalog_number: alpha.lccn[0],
    });
    store.addBook({
      title: beta.title,
      author: beta.author_name[0],
      first_publish_year: beta.first_publish_year,
      catalog_number: beta.lccn[0],
    });

    store.filterBooks({ q: '', sort: 'author' });
    expect(store.filteredBooks().map((book) => book.author_name[0])).toEqual(['Alice', 'Zed']);

    store.filterBooks({ q: '', sort: 'publicationDate' });
    expect(store.filteredBooks().map((book) => book.first_publish_year)).toEqual([2010, 1990]);

    store.filterBooks({ q: '', sort: 'catalogNumber' });
    expect(store.filteredBooks().map((book) => book.lccn[0])).toEqual(['CAT-1', 'CAT-9']);
  });

  it('checks out and checks in a book', () => {
    store.addBook({
      title: 'Lending target',
      author: 'Librarian',
      first_publish_year: 2020,
      catalog_number: 'LEND-1',
    });

    const target = store.books()[0];

    const firstToggle = store.toggleBookLending(target.key);
    expect(firstToggle).toBe(true);
    expect(store.isBookCheckedOut(target.key)).toBe(true);
    expect(store.checkedOutCount()).toBe(1);

    const secondToggle = store.toggleBookLending(target.key);
    expect(secondToggle).toBe(false);
    expect(store.isBookCheckedOut(target.key)).toBe(false);
    expect(store.checkedOutCount()).toBe(0);
  });

  it('removes lending state when deleting a checked out book', () => {
    store.addBook({
      title: 'Lent book',
      author: 'Author',
      first_publish_year: 2019,
      catalog_number: 'LEND-2',
    });

    const target = store.books()[0];
    store.toggleBookLending(target.key);
    expect(store.isBookCheckedOut(target.key)).toBe(true);

    store.deleteBook(target);

    expect(store.isBookCheckedOut(target.key)).toBe(false);
    expect(store.checkedOutCount()).toBe(0);
  });
});
