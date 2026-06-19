# BigQuery Release Notes Tracker

A sleek, responsive, and modern web application built using **Python Flask** on the backend and **plain vanilla HTML, CSS, and JavaScript** on the frontend. The application fetches the official Google Cloud BigQuery release notes Atom feed, presents them in an interactive glassmorphic interface, and provides users with a built-in custom editor to share selected updates directly to Twitter/X.

## 🚀 Features

- **Live RSS/Atom Feed Parsing**: Automatically fetches and parses release updates directly from the official Google Cloud BigQuery feed.
- **Categorized Feed Sorting**: Splits multi-topic entries into individual, distinct cards categorized by update types: `Feature`, `Announcement`, `Issue`, and `Deprecation`.
- **Aesthetic Glassmorphism UI**: Beautiful, interactive dark mode styling featuring ambient glow backdrops, color-coded borders, responsive grid layouts, and micro-animations.
- **Search & Type Filtering**: Instant client-side text search and type filtering options to quickly find relevant updates.
- **Shimmer Loaders & Error Handling**: Uses modern skeleton loader animations during reload phases and features graceful error recovery.
- **Custom Twitter/X Share Integration**: Select any update to draft, edit, and share directly to Twitter/X. Features automated snippet formatting, character limits counting (up to 280 characters), and pre-populated hashtags.

---

## 🛠️ Project Structure

```text
bq-releases-notes/
├── static/
│   ├── css/
│   │   └── style.css       # Custom glassmorphic styling & responsive layouts
│   └── js/
│       └── app.js          # Client-side feed fetching, searching, and tweet formatting
├── templates/
│   └── index.html          # Main HTML structure with interactive search & filter controls
├── app.py                  # Flask server containing feed fetch, parsing, and caching logic
├── test_parse.py           # Command-line parser test utility script
├── .gitignore              # Standard git ignore definitions
└── README.md               # Project documentation (this file)
```

---

## 💻 Getting Started

### Prerequisites

- Python 3.10 or higher
- `pip` package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/fsteveb/steve-event-talks-app.git
   cd steve-event-talks-app
   ```

2. (Optional but recommended) Create and activate a virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install the required dependencies:
   ```bash
   pip install Flask
   ```

### Running the Application

Start the Flask development server:

```bash
python app.py
```

The application will start in development mode, listening on **http://127.0.0.1:5000**. Open this URL in your web browser to browse and interact with the release notes tracker.

---

## 📄 License

This project is licensed under the MIT License.
