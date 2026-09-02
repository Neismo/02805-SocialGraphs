#!/usr/bin/env python3
"""
Process Week 1 Marvel Comics Superhero network data.
Loads week1_nodes.tsv and week1_edges.tsv using pandas & networkx,
computes network metrics (Louvain communities, in/out degrees, PageRank, components),
and exports the processed JSON payload to docs/data/week1_graph.json along with copies
of the original TSVs.
"""

import os
import json
import pandas as pd
import networkx as nx
import networkx.algorithms.community as nx_comm

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    # the tracked snapshot lives in docs/data, so this script runs from a fresh clone
    data_dir = os.path.join(base_dir, "docs", "data")
    docs_data_dir = os.path.join(base_dir, "docs", "data")
    os.makedirs(docs_data_dir, exist_ok=True)

    nodes_file = os.path.join(data_dir, "week1_nodes.tsv")
    edges_file = os.path.join(data_dir, "week1_edges.tsv")

    print(f"Reading {nodes_file} and {edges_file}...")

    # Exact loading specified in assignment
    nodes = pd.read_csv(nodes_file, sep="\t", comment="#", quoting=3)
    edges = pd.read_csv(edges_file, sep="\t", comment="#", names=["source", "target"])

    G = nx.DiGraph()
    G.add_nodes_from(nodes.node_id)
    G.add_edges_from(edges.itertuples(index=False))

    print(f"Constructed DiGraph G: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")


    # Compute network metrics
    in_deg_dict = dict(G.in_degree())
    out_deg_dict = dict(G.out_degree())
    total_deg_dict = {n: in_deg_dict[n] + out_deg_dict[n] for n in G.nodes()}
    pagerank_dict = nx.pagerank(G)

    # Louvain communities on undirected projection
    G_undir = G.to_undirected()
    comms = sorted(nx_comm.louvain_communities(G_undir, seed=42), key=len, reverse=True)

    # These names are OUR reading of what each cluster contains, not an output of Louvain
    # (the algorithm returns unlabelled sets of nodes). Keying them by community index was
    # a trap: the index depends on the ordering networkx happens to return, so a version
    # bump silently moves every label onto the wrong cluster. Anchor each label to a
    # character instead, and label a cluster only if its anchor is actually inside it.
    comm_anchors = [
        ("Luke_Cage",              "Street Level & Urban Knights"),
        ("Wolverine_(character)",  "X-Men & Mutant Factions"),
        ("Star-Lord",              "Cosmic Marvel & Guardians"),
        ("Spider-Man",             "Spider-Verse & Web Warriors"),
        ("Hulk",                   "Gamma & Heavyweight Avengers"),
        ("Doctor_Strange",         "Doctor Strange & the Supernatural"),
        ("Human_Torch",            "Fantastic Four, Inhumans & Golden Age"),
        ("Radian_(Morituri)",      "Strikeforce: Morituri"),
    ]

    comm_colors = [
        "#3B82F6",  # Blue (Street level)
        "#EC4899",  # Pink/Magenta (X-Men)
        "#8B5CF6",  # Purple (Cosmic)
        "#EF4444",  # Red (Spider-Verse)
        "#10B981",  # Green (Gamma / Heavyweights)
        "#F59E0B",  # Amber/Orange (Midnight Sons)
        "#06B6D4",  # Cyan (Classic Avengers)
        "#6366F1",  # Indigo (Morituri)
        "#94A3B8"   # Slate (Isolates)
    ]

    node_comm_map = {}
    for cid, comm in enumerate(comms):
        if len(comm) > 2:
            anchored = [name for anchor, name in comm_anchors if anchor in comm]
            # two anchors in one cluster means Louvain merged them: say so rather than
            # picking one name and quietly dropping the other
            c_name = " + ".join(anchored) if anchored else f"Community {cid + 1}"
            color = comm_colors[cid % len(comm_colors)]
            c_id = cid
        else:
            c_name = "Isolated / Minor Clusters"
            color = "#94A3B8"
            c_id = 8
        for n in comm:
            node_comm_map[n] = (c_id, c_name, color)

    # Connected components
    wcc = sorted(nx.weakly_connected_components(G), key=len, reverse=True)
    node_wcc_map = {}
    for wcc_id, comp in enumerate(wcc):
        for n in comp:
            node_wcc_map[n] = wcc_id

    # Node metadata mapping
    node_info_dict = {}
    for _, row in nodes.iterrows():
        nid = row["node_id"]
        node_info_dict[nid] = {
            "name": str(row.get("name", nid)),
            "wikidata_id": str(row.get("wikidata_id", "")) if pd.notna(row.get("wikidata_id")) else "",
            "url": str(row.get("url", "")) if pd.notna(row.get("url")) else "",
            "description": str(row.get("description", "")) if pd.notna(row.get("description")) else ""
        }

    # Build node list
    nodes_list = []
    for n in G.nodes():
        info = node_info_dict.get(n, {"name": n, "wikidata_id": "", "url": "", "description": ""})
        cid, cname, color = node_comm_map.get(n, (8, "Isolated / Minor Clusters", "#94A3B8"))
        in_neighbors = sorted(list(G.predecessors(n)), key=lambda x: in_deg_dict[x], reverse=True)
        out_neighbors = sorted(list(G.successors(n)), key=lambda x: in_deg_dict[x], reverse=True)

        nodes_list.append({
            "id": n,
            "name": info["name"],
            "wikidata_id": info["wikidata_id"],
            "url": info["url"],
            "description": info["description"],
            "in_degree": in_deg_dict[n],
            "out_degree": out_deg_dict[n],
            "total_degree": total_deg_dict[n],
            "pagerank": round(pagerank_dict.get(n, 0.0), 6),
            "community_id": cid,
            "community_name": cname,
            "community_color": color,
            "component_id": node_wcc_map.get(n, 0),
            "is_isolate": total_deg_dict[n] == 0,
            "in_neighbors": in_neighbors,
            "out_neighbors": out_neighbors
        })

    # Sort nodes by in_degree descending
    nodes_list.sort(key=lambda x: x["in_degree"], reverse=True)

    # Build links list
    links_list = []
    for u, v in G.edges():
        links_list.append({
            "source": u,
            "target": v
        })

    # Build communities summary list
    communities_summary = []
    for cid in range(9):
        c_nodes = [n for n in nodes_list if n["community_id"] == cid]
        if c_nodes:
            top_chars = [n["name"] for n in c_nodes[:4]]
            communities_summary.append({
                "id": cid,
                "name": c_nodes[0]["community_name"],
                "color": c_nodes[0]["community_color"],
                "count": len(c_nodes),
                "top_characters": top_chars
            })

    payload = {
        "summary": {
            "num_nodes": G.number_of_nodes(),
            "num_edges": G.number_of_edges(),
            "is_directed": True,
            "density": round(nx.density(G), 5),
            "num_isolates": len(list(nx.isolates(G))),
            "num_wcc": len(wcc),
            "largest_wcc_size": len(wcc[0]),
            "avg_in_degree": round(sum(in_deg_dict.values()) / G.number_of_nodes(), 2),
            "avg_out_degree": round(sum(out_deg_dict.values()) / G.number_of_nodes(), 2),
        },
        "communities": communities_summary,
        "nodes": nodes_list,
        "links": links_list
    }

    out_json = os.path.join(docs_data_dir, "week1_graph.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    print(f"Saved {out_json} with {len(nodes_list)} nodes and {len(links_list)} links.")

if __name__ == "__main__":
    main()
