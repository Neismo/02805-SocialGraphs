# 02805 Social Graphs and Interactions

A data science and network analysis project exploring complex interaction topologies, community structures, and text dynamics for DTU Course 02805 (Social Data Analysis and Visualization).

---

## 🌐 Live Explainer Website (GitHub Pages)

The project includes an interactive explainer website located in the [`docs/`](docs/) directory.

When deployed to GitHub Pages, the site is live at:
👉 **`https://neismo.github.io/02805-SocialGraphs/`**

### Structure & Modules:
- 🏠 **Course Hub (`index.html`)**: Overview of weekly modules and network science methodology.
- 🦸 **Week 1 Subpage (`week1.html`)**:
  - **Dataset**: 303 Marvel Comics superheroes and 1,784 directed Wikipedia article hyperlinks.
  - **Data Loading**: Python / NetworkX `DiGraph` construction from `week1_nodes.tsv` and `week1_edges.tsv`.
  - **Interactive D3.js Network Visualization**: Force-directed layout with draggable nodes, zoom & pan, search with auto-complete, community filters, direction-coded links (incoming/outgoing arrows), and character inspector with clickable neighbor traversal.
  - **Top Superheroes & Centrality Metrics**: Ranking table by in-degree and PageRank.
  - **Data Downloads**: Direct access to TSVs and precomputed graph JSON.
- 🌓 **Light / Dark Mode**: Theme switch with state persistence across pages.
- 📱 **Fully Responsive**: Optimized for desktop, tablet, and mobile viewing.

---

## 🐍 Loading the Graph in Python

```python
import pandas as pd, networkx as nx

nodes = pd.read_csv("data/week1_nodes.tsv", sep="\t", comment="#",
                    quoting=3)  # QUOTE_NONE: TSVs never quote, but blurbs may contain "quotes"
edges = pd.read_csv("data/week1_edges.tsv", sep="\t", comment="#",
                    names=["source", "target"])

G = nx.DiGraph()
G.add_nodes_from(nodes.node_id)
G.add_edges_from(edges.itertuples(index=False))
# G: 303 nodes, 1784 edges
```

---

## 🚀 How to Preview the Website Locally

```bash
# Preview the docs/ folder
python3 -m http.server 8000 --directory docs
```
Then open [http://localhost:8000](http://localhost:8000) or [http://localhost:8000/week1.html](http://localhost:8000/week1.html) in your browser.

---

## ⚙️ Automated GitHub Pages Deployment

The repository includes a GitHub Actions workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) that automatically deploys the [`docs/`](docs/) directory to GitHub Pages on every push to `main` or `master`.

---

## 📁 Repository Structure

```text
.
├── data/
│   ├── week1_nodes.tsv           # Superhero nodes (name, url, description)
│   └── week1_edges.tsv           # Directed Wikipedia hyperlinks
├── docs/                         # GitHub Pages explainer website
│   ├── index.html                # Course Hub & weekly roadmap
│   ├── week1.html                # Week 1: Marvel Superhero Graph subpage
│   ├── css/
│   │   └── styles.css            # Modern responsive CSS styles & themes
│   ├── js/
│   │   ├── main.js               # Common site navigation & theme logic
│   │   └── week1.js              # D3.js interactive force simulation & inspector
│   └── data/
│       ├── week1_nodes.tsv       # Public node dataset
│       ├── week1_edges.tsv       # Public edge dataset
│       └── week1_graph.json      # Processed graph with metrics & communities
├── scripts/
│   └── prepare_week1.py          # Data pipeline script
├── .github/
│   └── workflows/
│       └── deploy-pages.yml      # GitHub Actions Pages deployment
├── pyproject.toml                # Python dependencies (managed via uv)
├── main.py                       # Python project entrypoint
└── README.md
```
