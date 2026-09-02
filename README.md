# 02805 Social Graphs and Interactions

A data science and network analysis project exploring complex interaction topologies, community structures, and text dynamics for DTU Course 02805 (Social Data Analysis and Visualization).

---

## 🌐 Live Explainer Website (GitHub Pages)

The project includes an interactive explainer website located in the [`docs/`](docs/) directory.

When deployed to GitHub Pages, the site will be live at:
👉 **`https://neismo.github.io/02805-SocialGraphs/`**

### Features:
- 📊 **Executive Summary & Metrics Dashboard**
- 🕸️ **Interactive D3.js Network Visualization**: Force-directed graph with draggable nodes, zoom/pan, community filtering, search, and node inspector.
- 💬 **NLP & Text Analysis**: TF-IDF keyword distribution and community sentiment analysis.
- 🌓 **Light / Dark Mode** support with theme persistence.
- 📱 **Fully Responsive** layout for desktop, tablet, and mobile.

---

## 🚀 How to Preview the Website Locally

You can preview the GitHub Pages site locally with any static web server:

Using Python:
```bash
# Preview the docs/ folder
python3 -m http.server 8000 --directory docs
```
Then open [http://localhost:8000](http://localhost:8000) in your browser.

---

## ⚙️ How to Enable GitHub Pages on GitHub

1. Go to your repository on GitHub: **[Neismo/02805-SocialGraphs](https://github.com/Neismo/02805-SocialGraphs)**
2. Click **Settings** (tab at top) &rarr; **Pages** (in the left sidebar).
3. Under **Build and deployment**:
   - **Option A (GitHub Actions - Recommended)**: Select **Source: GitHub Actions**. The included workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) will build and deploy automatically on every push!
   - **Option B (Deploy from branch)**: Select **Source: Deploy from a branch**, Branch: `master` (or `main`), and Folder: `/docs`. Click **Save**.

---

## 📁 Repository Structure

```text
.
├── docs/                     # GitHub Pages explainer website
│   ├── index.html            # Main webpage
│   ├── css/
│   │   └── styles.css        # Responsive styling & themes
│   └── js/
│       └── main.js           # Interactive D3 network & controls
├── .github/
│   └── workflows/
│       └── deploy-pages.yml  # Automated GitHub Actions Pages deployment
├── pyproject.toml            # Python dependencies (managed via uv)
├── main.py                   # Python project entrypoint
└── README.md
```
