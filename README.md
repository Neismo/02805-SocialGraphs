# 02805 Social Graphs and Interactions

Group project for **DTU 02805 — Social Graphs and Interactions**. Each week of the course
ends with one post on our public site: take the week's tools to the shared playground
dataset and write up what we found.

**Authors:**
- **Noah Ruy** (`s244207`)
- **Oliver** (`s194591`)

---

## 🌐 Live site

👉 **<https://neismo.github.io/02805-SocialGraphs/>**

- **Hub (`index.html`)** — project intro and the weekly roadmap.
- **Week 1 (`week1.html`)** — the Marvel Wikipedia link network: 303 characters,
  1,784 directed links.
  - Degree distributions, in and out, on linear and log–log axes.
  - In- versus out-degree: the two leaderboards, and why they are different people.
  - The connected components, including the one real island outside the giant component.
  - Interactive D3.js force-directed graph with search, community filters and a
    character inspector.
  - A re-derivation of part of the edge list from the live Wikipedia API, as a check on
    the snapshot.
- Light / dark theme, persisted across pages. Responsive.

---

## 🐍 Loading the graph

Every node is added *before* any edge, so the 17 characters with no links in either
direction survive into the graph instead of being dropped.

```python
from pathlib import Path
import pandas as pd, networkx as nx

data = Path("docs/data")
nodes = pd.read_csv(data / "week1_nodes.tsv", sep="\t", comment="#",
                    quoting=3)  # QUOTE_NONE: TSVs never quote, but blurbs may contain "quotes"
edges = pd.read_csv(data / "week1_edges.tsv", sep="\t", comment="#",
                    names=["source", "target"])

G = nx.DiGraph()
G.add_nodes_from(nodes.node_id)          # all 303 first, so the isolates survive
G.add_edges_from(edges.itertuples(index=False))
# G: 303 nodes, 1784 edges, 17 isolates
```

Note the `names=[...]`: the edge file writes its column header as a comment
(`# source	target`), so `comment="#"` strips it and there is no header row left to
read. Without naming the columns, pandas promotes the first edge to a header and the
graph silently comes out with 1783 edges.

---

## 🚀 Running things

The repo uses [uv](https://docs.astral.sh/uv/). The frozen snapshot is tracked in
`docs/data/`, so everything below works straight from a clone.

```bash
uv sync

# graph summary and the top five most-referenced characters
uv run python main.py

# rebuild docs/data/week1_graph.json (degrees, PageRank, Louvain, components)
uv run python scripts/prepare_week1.py

# stretch: re-derive part of the edge list from the live Wikipedia API and compare
uv run python scripts/check_snapshot_api.py
```

Preview the site locally:

```bash
python3 -m http.server 8000 --directory docs
```

Then open <http://localhost:8000/week1.html>.

---

## 📊 Week 1, in numbers

| | |
|---|---|
| Characters (nodes) | 303 |
| Directed links (edges) | 1,784 |
| Undirected edges | 1,434 (350 pairs point both ways) |
| Isolates (no links either way) | 17 |
| Characters never linked *to* | 58 |
| Mean in-degree = mean out-degree | 5.89 |
| Most linked to | Spider-Man (106 in, 9 out) |
| Links out the most | Betsy Braddock (7 in, 28 out) |
| Weakly connected components | 19 (giant = 277, one island of 9, 17 singletons) |
| Snapshot edges reproduced from the live API | 87 / 89 on a 5-character sample |

---

## ⚙️ Deployment

`.github/workflows/deploy-pages.yml` publishes `docs/` to GitHub Pages on every push to
`master` or `main`.

---

## 📁 Repository structure

```text
.
├── docs/                         # the GitHub Pages site
│   ├── index.html                # project hub
│   ├── week1.html                # week 1 post
│   ├── css/styles.css            # theme, layout, components
│   ├── js/
│   │   ├── main.js               # navigation + theme toggle
│   │   ├── week1.js              # D3 force simulation, inspector, search
│   │   └── week1-analysis.js     # degree distributions, in vs out, the islands
│   └── data/
│       ├── week1_nodes.tsv       # frozen snapshot: node roster
│       ├── week1_edges.tsv       # frozen snapshot: directed edge list
│       └── week1_graph.json      # derived: degrees, PageRank, communities, components
├── scripts/
│   ├── prepare_week1.py          # builds week1_graph.json from the TSVs
│   └── check_snapshot_api.py     # re-derives edges from the Wikipedia API
├── .github/workflows/
│   └── deploy-pages.yml          # Pages deployment
├── main.py                       # quick graph summary
├── pyproject.toml
└── README.md
```
