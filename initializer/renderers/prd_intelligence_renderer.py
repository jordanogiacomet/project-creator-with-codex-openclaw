from pathlib import Path


def write_prd_intelligence(project_dir, intelligence):

    docs = Path(project_dir) / "docs"

    docs.mkdir(exist_ok=True)

    file = docs / "product-intelligence.md"

    lines = ["# Product Intelligence", ""]

    lines.append("## Problem Statement")
    lines.append("")
    lines.append(intelligence["problem_statement"])
    lines.append("")

    lines.append("## User Personas")
    lines.append("")

    for p in intelligence["personas"]:
        lines.append(f"- {p['name']}: {p['goal']}")

    lines.append("")
    lines.append("## Success Metrics")
    lines.append("")

    for m in intelligence["success_metrics"]:
        lines.append(f"- {m}")

    lines.append("")
    lines.append("## Scope")
    lines.append("")

    lines.append("### In Scope")

    for item in intelligence["scope"]["in_scope"]:
        lines.append(f"- {item}")

    lines.append("")
    lines.append("### Out of Scope")

    for item in intelligence["scope"]["out_of_scope"]:
        lines.append(f"- {item}")

    lines.append("")
    lines.append("## Assumptions")
    lines.append("")

    for a in intelligence["assumptions"]:
        lines.append(f"- {a}")

    file.write_text("\n".join(lines))