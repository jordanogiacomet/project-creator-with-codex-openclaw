from pathlib import Path


def write_knowledge(project_dir, knowledge):

    docs = Path(project_dir) / "docs"

    docs.mkdir(exist_ok=True)

    file = docs / "knowledge.md"

    lines = ["# Domain Knowledge", ""]

    lines.append("## Patterns")
    lines.append("")
    for item in knowledge["patterns"]:
        lines.append(f"- {item}")

    lines.append("")
    lines.append("## Recommended Libraries")
    lines.append("")
    for item in knowledge["recommended_libraries"]:
        lines.append(f"- {item}")

    lines.append("")
    lines.append("## Scaling Strategies")
    lines.append("")
    for item in knowledge["scaling_strategies"]:
        lines.append(f"- {item}")

    lines.append("")
    lines.append("## Common Pitfalls")
    lines.append("")
    for item in knowledge["pitfalls"]:
        lines.append(f"- {item}")

    file.write_text("\n".join(lines))