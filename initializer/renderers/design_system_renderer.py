from pathlib import Path


def write_design_system(project_dir, design):

    docs = Path(project_dir) / "docs"

    docs.mkdir(exist_ok=True)

    file = docs / "design-system.md"

    lines = ["# Design System", ""]

    lines.append("## Philosophy")
    lines.append("")

    for p in design["philosophy"]:
        lines.append(f"- {p}")

    lines.append("")
    lines.append("## Tokens")
    lines.append("")

    for k, v in design["tokens"].items():
        lines.append(f"- {k}: {v}")

    lines.append("")
    lines.append("## Components")
    lines.append("")

    for c in design["components"]:
        lines.append(f"- {c}")

    lines.append("")
    lines.append("## UX Patterns")
    lines.append("")

    for p in design["patterns"]:
        lines.append(f"- {p}")

    lines.append("")
    lines.append("## Recommendations")
    lines.append("")

    for r in design["recommendations"]:
        lines.append(f"- {r}")

    file.write_text("\n".join(lines))