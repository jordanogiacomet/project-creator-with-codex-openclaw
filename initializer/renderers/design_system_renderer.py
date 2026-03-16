"""Design System Renderer.

Writes docs/design-system.md from the generated design system dict.

Updated to handle:
- Nested token structure (spacing, colors, font, etc.)
- Component dicts with name, purpose, and variants
- Backward compatible with string-only components
"""

from pathlib import Path


def _render_tokens(tokens):
    """Render the tokens section, handling both flat and nested dicts."""
    lines = []

    for key, value in tokens.items():
        if key == "tailwind_mapping":
            # Render as a note, not a token table
            continue

        if isinstance(value, dict):
            lines.append(f"### {key.replace('_', ' ').title()}")
            lines.append("")
            for sub_key, sub_value in value.items():
                lines.append(f"- **{sub_key}**: `{sub_value}`")
            lines.append("")
        else:
            lines.append(f"- **{key}**: {value}")

    # Tailwind mapping as a note at the end
    tailwind = tokens.get("tailwind_mapping")
    if tailwind:
        lines.append(f"> {tailwind}")
        lines.append("")

    return lines


def _render_components(components):
    """Render the components section, handling both string and dict formats."""
    lines = []

    for component in components:
        if isinstance(component, dict):
            name = component.get("name", "Unknown")
            purpose = component.get("purpose", "")
            variants = component.get("variants", [])

            lines.append(f"### {name}")
            if purpose:
                lines.append(f"{purpose}")
            if variants:
                lines.append(f"- Variants: {', '.join(variants)}")
            lines.append("")
        else:
            # Backward compatible: plain string
            lines.append(f"- {component}")

    return lines


def write_design_system(project_dir, design):
    """Write design-system.md to the docs directory."""
    docs = Path(project_dir) / "docs"
    docs.mkdir(exist_ok=True)

    file = docs / "design-system.md"

    lines = ["# Design System", ""]

    # --- Philosophy ---
    lines.append("## Philosophy")
    lines.append("")
    for p in design.get("philosophy", []):
        lines.append(f"- {p}")
    lines.append("")

    # --- Tokens ---
    tokens = design.get("tokens", {})
    if tokens:
        lines.append("## Tokens")
        lines.append("")
        lines.extend(_render_tokens(tokens))

    # --- Components ---
    components = design.get("components", [])
    if components:
        lines.append("## Components")
        lines.append("")
        lines.extend(_render_components(components))

    # --- Patterns ---
    patterns = design.get("patterns", [])
    if patterns:
        lines.append("## UX Patterns")
        lines.append("")
        for p in patterns:
            lines.append(f"- {p}")
        lines.append("")

    # --- Recommendations ---
    recommendations = design.get("recommendations", [])
    if recommendations:
        lines.append("## Recommendations")
        lines.append("")
        for r in recommendations:
            lines.append(f"- {r}")
        lines.append("")

    file.write_text("\n".join(lines), encoding="utf-8")