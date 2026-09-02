#!/usr/bin/env python3
"""Re-derive part of the week-1 edge list from the live Wikipedia API and compare.

The snapshot is handed to us ready-made. Its edges were harvested from the wiki-source,
where internal links appear as [[Page name]], so we can redo the same extraction through
the API and check whether we land on the same edges.

Two things worth knowing before reading the output:

  * Wikipedia answers 403 without a User-Agent identifying your client, and 429 if you
    ask too fast. Both are handled below.
  * The snapshot is frozen (2026-08-26) while the live articles keep moving, so perfect
    agreement is not the expected result. A disagreement is a question, not a bug.

Usage:  python scripts/check_snapshot_api.py [character_id ...]
"""
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

import networkx as nx
import pandas as pd

DATA = Path(__file__).resolve().parent.parent / "docs" / "data"
API = "https://en.wikipedia.org/w/api.php"
USER_AGENT = "DTU02805-week1-snapshot-check/1.0 (course exercise; github.com/Neismo/02805-SocialGraphs)"
DEFAULT_SAMPLE = ["Spider-Man", "Betsy_Braddock", "Hulk", "Adam_Warlock", "She-Hulk"]


def load_snapshot():
    nodes = pd.read_csv(DATA / "week1_nodes.tsv", sep="\t", comment="#", quoting=3)
    edges = pd.read_csv(DATA / "week1_edges.tsv", sep="\t", comment="#",
                        names=["source", "target"])
    G = nx.DiGraph()
    G.add_nodes_from(nodes.node_id)
    G.add_edges_from(edges.itertuples(index=False))
    return G, set(nodes.node_id)


def wikitext(title, retries=3):
    """The raw wiki-source of one article, following redirects."""
    query = urllib.parse.urlencode({"action": "parse", "page": title, "prop": "wikitext",
                                    "redirects": "1", "format": "json", "formatversion": "2"})
    request = urllib.request.Request(f"{API}?{query}", headers={"User-Agent": USER_AGENT})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.load(response)["parse"]["wikitext"]
        except urllib.error.HTTPError as err:
            if err.code == 429 and attempt < retries - 1:
                time.sleep(5 * (attempt + 1))       # rate limited: back off and retry
                continue
            raise


def linked_titles(text):
    """Every [[target]] in the wiki-source, as underscore-joined article titles."""
    titles = set()
    for match in re.finditer(r"\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]", text):
        title = match.group(1).strip().replace(" ", "_")
        if title and ":" not in title:              # skip File:, Category:, Wikipedia: ...
            titles.add(title[0].upper() + title[1:])
    return titles


def main():
    G, roster = load_snapshot()
    sample = sys.argv[1:] or DEFAULT_SAMPLE

    print(f"{'character':30s} {'snapshot':>9s} {'API':>5s} {'agree':>6s}")
    print("-" * 54)
    snapshot_total = api_total = agree_total = 0
    for character in sample:
        if character not in roster:
            print(f"{character:30s} not in the node roster — skipped")
            continue
        try:
            derived = (linked_titles(wikitext(character)) & roster) - {character}
        except Exception as err:                     # noqa: BLE001 - report and keep going
            print(f"{character:30s} FAILED: {type(err).__name__}: {err}")
            continue

        snapshot = set(G.successors(character))
        agreeing = derived & snapshot
        snapshot_total += len(snapshot)
        api_total += len(derived)
        agree_total += len(agreeing)
        print(f"{character:30s} {len(snapshot):9d} {len(derived):5d} {len(agreeing):6d}")
        for label, diff in [("only in the API", derived - snapshot),
                            ("only in the snapshot", snapshot - derived)]:
            if diff:
                print(f"    {label}: {', '.join(sorted(diff))}")
        time.sleep(0.5)                              # be a polite client

    if snapshot_total:
        print("-" * 54)
        print(f"{'total':30s} {snapshot_total:9d} {api_total:5d} {agree_total:6d}")
        print(f"\n{agree_total}/{snapshot_total} snapshot out-edges reproduced "
              f"({agree_total / snapshot_total:.0%}).")
        print("Edges the snapshot has but the live wiki-source does not are most likely\n"
              "articles edited since the freeze — verify before claiming it.")


if __name__ == "__main__":
    main()
