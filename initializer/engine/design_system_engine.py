"""
Design System Engine

Generates UI/UX design system recommendations based on archetype
and product surface.
"""


def generate_design_system(spec):

    archetype = spec.get("archetype")
    answers = spec.get("answers", {})

    surface = answers.get("surface")

    design = {
        "philosophy": [],
        "tokens": {},
        "components": [],
        "patterns": [],
        "recommendations": [],
    }

    # -----------------------------------------
    # BASE DESIGN PHILOSOPHY
    # -----------------------------------------

    design["philosophy"].append(
        "Favor clarity and content-first layout."
    )

    design["philosophy"].append(
        "Use consistent spacing scale and typography hierarchy."
    )

    design["philosophy"].append(
        "Minimize cognitive load for editorial workflows."
    )

    # -----------------------------------------
    # TOKENS
    # -----------------------------------------

    design["tokens"] = {
        "spacing_scale": "4px base grid",
        "border_radius": "6px default",
        "font_primary": "Inter",
        "font_secondary": "System UI",
    }

    # -----------------------------------------
    # COMPONENTS
    # -----------------------------------------

    components = [
        "Button",
        "Input",
        "Textarea",
        "Select",
        "Modal",
        "Toast",
        "Dropdown",
    ]

    # CMS usually needs these
    if archetype == "editorial-cms":

        components.extend(
            [
                "RichTextEditor",
                "MediaPicker",
                "ContentList",
                "ContentStatusBadge",
                "PublishControls",
            ]
        )

    if surface == "admin_plus_public_site":

        components.extend(
            [
                "NavigationBar",
                "HeroBlock",
                "ContentCard",
                "Footer",
            ]
        )

    design["components"] = components

    # -----------------------------------------
    # UX PATTERNS
    # -----------------------------------------

    patterns = [
        "Use optimistic UI for publishing actions",
        "Provide clear status indicators for draft vs published content",
        "Autosave editorial content where possible",
    ]

    if archetype == "editorial-cms":

        patterns.append(
            "Preview mode should match public rendering exactly."
        )

    design["patterns"] = patterns

    # -----------------------------------------
    # RECOMMENDATIONS
    # -----------------------------------------

    design["recommendations"] = [
        "Use Tailwind CSS or CSS variables for token system.",
        "Maintain a component library shared between admin and public site.",
        "Document component usage and accessibility constraints.",
    ]

    return design