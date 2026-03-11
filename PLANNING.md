## Plan: Angular Library App Architecture

Establish a scalable Angular architecture for the library management app using standalone components with OnPush change detection and zoneless configuration. Organize code into feature-based folders (e.g., books) with @ngrx/signals signalStore for state management, and shared dumb components for reusability. Load initial book data via HTTP calls to Open Library API through a dedicated service, ensuring responsive design and clean separation of concerns for maintainability and performance. Leverage Angular 21.2 syntax, including experimental signal forms and modern control flow.

### Steps
1. Update [app.config.ts](src/app/app.config.ts) to enable zoneless change detection and HTTP client.
2. Install and configure @ngrx/signals for signalStore-based state management.
3. Create [src/app/books/](src/app/books/) feature folder with signalStore service for book state management using @ngrx/signals.
4. Implement [src/app/books/book.service.ts](src/app/books/book.service.ts) for Open Library API HTTP calls.
5. Manually copy Open Library API types to [src/app/books/openlibrary.types.ts](src/app/books/openlibrary.types.ts) for type safety.
6. Design shared dumb components in [src/app/shared/](src/app/shared/) for book list, details, and forms using signal-based reactive forms (@angular/forms with signals).
7. Configure [app.routes.ts](src/app/app.routes.ts) for lazy-loaded book feature routing.
8. Integrate search/filter in book list using store signals and OnPush updates with modern control flow (@if, @for).

### Further Considerations
1. Use signals in store services for reactive state; confirm if computed signals suffice for derived data.
2. For pagination: Implement basic client-side or skip to focus on core features first.
3. Handle Open Library API rate limits with caching; consider fallback to local JSON if needed.
4. Utilize Angular 21.2 features: signal-based forms for add/edit book forms with built-in validation, modern control flow in templates, and enhanced signal forms reactivity.
5. Use extensively Angular Material 21.2.1 components for dumb components and implement cdk best practices for virtual scrolling and dialogs