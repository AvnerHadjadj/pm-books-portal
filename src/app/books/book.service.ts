import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { OpenLibraryClientConfig, BookSearchParams, BookSearchResponse, ApiError, YearRange } from './openlibrary.types';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class BookService {
    private http = inject(HttpClient);
    private readonly snackBar = inject(MatSnackBar);

    private config: OpenLibraryClientConfig = {
        baseURL: 'https://openlibrary.org',
        timeout: 10000,
        headers: {},
    };

    // Rate limit: allow 1 request per second
    private lastRequestTime = 0;

    searchBooks(params: BookSearchParams): Observable<BookSearchResponse | ApiError> {
        const now = Date.now();
        if (now - this.lastRequestTime < 1000) {
            return throwError(() => ({ error: 'Rate limit exceeded', status: 429 }));
        }
        this.lastRequestTime = now;

        const url = `${this.config.baseURL}/search.json`;
        const httpParams = this.buildHttpParams(params);
        const options = {
            headers: new HttpHeaders(this.config.headers || {}),
            params: httpParams,
        };

        return this.http.get<BookSearchResponse>(url, options).pipe(
            catchError((error) => {
                // TODO: Handle specific error cases (network, API errors, etc.)
                this.snackBar.open(error, 'Ignore', { duration: 5000 });
                // Fallback: try local JSON if available
                return this.loadLocalFallback(params);
            })
        );
    }

    private buildHttpParams(params: BookSearchParams): HttpParams {
        let httpParams = new HttpParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                httpParams = httpParams.set(key, String(value));
            }
        });

        return httpParams;
    }

    // Fallback to local JSON file
    private loadLocalFallback(params: BookSearchParams): Observable<BookSearchResponse | ApiError> {
        // Example: load from assets/books-fallback.json
        return this.http.get<BookSearchResponse>('/assets/books-fallback.json').pipe(
            catchError(() => throwError(() => {
                const error = 'Failed to load fallback data';

                this.snackBar.open(error, 'Dismiss', { duration: 5000 });

                return { error, status: 500 }
            }))
        );
    }
}
