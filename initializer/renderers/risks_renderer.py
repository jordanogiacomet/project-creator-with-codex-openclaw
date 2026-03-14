from pathlib import Path


def write_risks(project_dir, risks):

    docs = Path(project_dir) / "docs"
    docs.mkdir(exist_ok=True)

    risks_file = docs / "risks.md"

    lines = ["# Architectural Risks", ""]

    for risk in risks:

        lines.append(f"## {risk['title']}")
        lines.append("")
        lines.append(f"Risk: {risk['risk']}")
        lines.append("")
        lines.append(f"Impact: {risk['impact']}")
        lines.append("")
        lines.append(f"Mitigation: {risk['mitigation']}")
        lines.append("")

    risks_file.write_text("\n".join(lines))