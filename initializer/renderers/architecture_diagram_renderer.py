from pathlib import Path


def write_architecture_diagram(project_dir, diagram):

    arch_dir = Path(project_dir) / "docs" / "architecture"

    arch_dir.mkdir(parents=True, exist_ok=True)

    file = arch_dir / "diagram.mmd"

    lines = ["graph TD"]

    # nodes

    for node_id, label in diagram["nodes"]:

        lines.append(f'{node_id}["{label}"]')

    # edges

    for source, target in diagram["edges"]:

        lines.append(f"{source} --> {target}")

    file.write_text("\n".join(lines))