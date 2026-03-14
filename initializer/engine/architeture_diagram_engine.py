"""
Architecture Diagram Engine

Generates Mermaid architecture diagrams from synthesized architecture.
"""


def generate_architecture_diagram(spec):

    architecture = spec.get("architecture", {})

    components = architecture.get("components", [])

    nodes = []
    edges = []

    # basic nodes
    for component in components:

        name = component.get("name")

        node_id = name.replace("-", "_")

        nodes.append((node_id, name))

    # naive connections
    # (later this can become smarter)

    node_ids = [n[0] for n in nodes]

    if "frontend" in node_ids and "cms" in node_ids:
        edges.append(("frontend", "cms"))

    if "cms" in node_ids and "database" in node_ids:
        edges.append(("cms", "database"))

    if "worker" in node_ids and "database" in node_ids:
        edges.append(("worker", "database"))

    if "frontend" in node_ids and "cdn" in node_ids:
        edges.append(("cdn", "frontend"))

    diagram = {
        "nodes": nodes,
        "edges": edges,
    }

    return diagram