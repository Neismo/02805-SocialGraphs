from pathlib import Path

import pandas as pd
import networkx as nx

def load_week1_graph():
    # Load nodes and edges as specified
    # docs/data holds the tracked copy of the frozen snapshot, so this runs from a clone
    data = Path(__file__).resolve().parent / "docs" / "data"
    nodes = pd.read_csv(data / "week1_nodes.tsv", sep="\t", comment="#",
                        quoting=3)  # QUOTE_NONE: TSVs never quote, but blurbs may contain "quotes"
    edges = pd.read_csv(data / "week1_edges.tsv", sep="\t", comment="#",
                        names=["source", "target"])

    G = nx.DiGraph()
    G.add_nodes_from(nodes.node_id)
    G.add_edges_from(edges.itertuples(index=False))
    return G, nodes, edges

def main():
    print("🕸️ 02805 Social Graphs and Interactions")
    print("Loading Week 1 Marvel Superhero Network...")
    G, nodes, edges = load_week1_graph()
    print(f"✓ Successfully built DiGraph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
    
    top_in = sorted(G.in_degree(), key=lambda x: x[1], reverse=True)[:5]
    print("\nTop 5 Most Referenced Superheroes (In-Degree):")
    for idx, (hero, count) in enumerate(top_in, 1):
        print(f"  {idx}. {hero} ({count} in-links)")

if __name__ == "__main__":
    main()
