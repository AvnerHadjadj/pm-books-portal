# PM Books Portal

Library management application built with Angular.

## Live Demo

- **Deployed URL:** http://pm-books-portal.angularjobs.co.il

## Features

- View list of books
- Search books by name and author
- View book details
- Add / edit / delete books with form validation
- Responsive layout for desktop and mobile

## Data Source

The app uses **Open Library API** for initial data population.

- Initial load request (200 items, any ratings):  
  https://openlibrary.org/search.json?q=ratings_count:%5B0%20TO%20*%5D&limit=200

## Tech Stack

- Angular
- TypeScript
- HTML
- SCSS/CSS

## Run Locally

### Prerequisites

- Node.js (LTS recommended)
- npm
- Angular CLI

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AvnerHadjadj/pm-books-portal
   cd pm-books-portal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm start
   ```
   or:
   ```bash
   ng serve
   ```

4. Open:
   - `http://localhost:4200`

## Build

```bash
npm run build
```

Production build output is generated in `dist/`.

## Testing

### Unit Tests

Run:
```bash
npm test
```
or:
```bash
ng test
```

### Optional: Headless test run (CI style)

```bash
ng test --watch=false --browsers=ChromeHeadless
```

## Notes / Trade-offs

- The initial book list is fetched from Open Library with a fixed query/limit for predictable startup behavior.
- As this is an assignment project, some production hardening items (advanced error handling, caching strategy, and API resiliency) can be expanded further if needed.

## Submission Checklist

- [x] Source code uploaded to a public GitHub repository
- [x] Public deployed app link provided
- [x] README includes local run instructions
- [x] README includes testing instructions
- [x] Optional feature documented (external book API: Open Library)