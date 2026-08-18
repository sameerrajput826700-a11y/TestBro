# MCQ Test App

A local-first MCQ test application built with TypeScript and Vite. It runs entirely in the browser and stores questions, test results, and settings in IndexedDB, so no backend server is required.

## Features

- Create and manage MCQ question banks
- Import JSON question files
- Create custom tests with timing and marking rules
- Take tests in the browser
- View results and detailed answer review
- Track test history
- Use offline question bank JSON files
- Download a printable progress card / analysis report from the results page

## Project Structure

```text
TestAppV3/
├── mcq-app/
│   ├── src/
│   ├── offline-question-bank/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   └── package-lock.json
├── README.md
└── ...
```

## Requirements

Before running the app, make sure you have the following installed:

- Node.js (recommended: v18 or later)
- npm (comes with Node.js)

## Setup Instructions

1. Open a terminal in the project folder:

```bash
cd "c:\Users\sameer\OneDrive\Desktop\Sameer Projects\TestAppV3\mcq-app"
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev -- --host 0.0.0.0
```

4. Open the app in the browser:

```text
http://localhost:5173/
```

## Production Build

To create a production build:

```bash
npm run build
```

This generates the final files in the `dist` folder.

## Offline Question Bank

The app includes a folder named `offline-question-bank/` with sample JSON modules such as:

- Module1.json
- Module2.json
- Module3.json
- Model_Paper_23.json
- RAILWAY_MOD02.json

These files are automatically discovered by the app on the Import Questions page.

## Important Notes

- This app stores data in the browser's IndexedDB, so the data is local to that browser/device.
- If you open the app in a different browser profile or after clearing browser storage, the saved questions/tests may not appear.
- If you want to start fresh, clear browser storage or delete IndexedDB entries for this app.

## Helpful commands

```bash
npm install
npm run dev -- --host 0.0.0.0
npm run build
```

## Troubleshooting

### App does not start
- Check if Node.js is installed correctly:

```bash
node -v
npm -v
```

### Port already in use
- Vite may use port 5173 by default.
- If needed, stop other running apps or run:

```bash
npm run dev -- --host 0.0.0.0 --port 4173
```

### JSON file not appearing in app
- Make sure the file is inside the `offline-question-bank/` folder.
- Refresh the page after adding a new JSON file.
- Check that the JSON is valid and matches the required question format.

## License

This project is provided for local use and educational/demo purposes.
