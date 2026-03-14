from pathlib import Path


def write_constraints(project_dir, constraints):

    docs = Path(project_dir) / "docs"

    docs.mkdir(exist_ok=True)

    file = docs / "constraints.md"

    lines = ["# System Constraints", ""]

    lines.append("## Performance")
    lines.append("")

    for item in constraints["performance"]:
        lines.append(f"- {item}")

    lines.append("")
    lines.append("## Scalability")
    lines.append("")

    for item in constraints["scalability"]:
        lines.append(f"- {item}")

    lines.append("")
    lines.append("## Security")
    lines.append("")

    for item in constraints["security"]:
        lines.append(f"- {item}")

    lines.append("")
    lines.append("## Operational")
    lines.append("")

    for item in constraints["operational"]:
        lines.append(f"- {item}")

    file.write_text("\n".join(lines))