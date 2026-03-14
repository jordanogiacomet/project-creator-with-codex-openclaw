"""
PRD Intelligence Engine

Enriches PRD with product thinking elements.
"""


def generate_prd_intelligence(spec):

    archetype = spec.get("archetype")
    answers = spec.get("answers", {})
    capabilities = spec.get("capabilities", [])

    intelligence = {
        "problem_statement": "",
        "personas": [],
        "success_metrics": [],
        "scope": {
            "in_scope": [],
            "out_of_scope": [],
        },
        "assumptions": [],
    }

    # --------------------------------------------------
    # PROBLEM STATEMENT
    # --------------------------------------------------

    if archetype == "editorial-cms":

        intelligence["problem_statement"] = (
            "Organizations often need to manage structured editorial content "
            "and publish it across digital surfaces without tightly coupling "
            "content management to frontend presentation."
        )

    else:

        intelligence["problem_statement"] = (
            "The system aims to solve a defined operational workflow by "
            "providing a structured backend and scalable architecture."
        )

    # --------------------------------------------------
    # PERSONAS
    # --------------------------------------------------

    if archetype == "editorial-cms":

        intelligence["personas"] = [
            {
                "name": "Content Editor",
                "goal": "Create and publish editorial content quickly."
            },
            {
                "name": "Administrator",
                "goal": "Manage users, roles, and system configuration."
            },
            {
                "name": "Site Visitor",
                "goal": "Consume published content through the public website."
            },
        ]

    # --------------------------------------------------
    # SUCCESS METRICS
    # --------------------------------------------------

    intelligence["success_metrics"] = [
        "Content publishing time reduced compared to manual workflows.",
        "System availability above 99.5%.",
        "Editorial users can publish content without developer intervention."
    ]

    if "public-site" in capabilities:

        intelligence["success_metrics"].append(
            "Public pages load under acceptable performance thresholds."
        )

    # --------------------------------------------------
    # SCOPE
    # --------------------------------------------------

    intelligence["scope"]["in_scope"] = [
        "Core content management workflows.",
        "Authentication and role-based access control.",
        "Public content delivery via frontend."
    ]

    intelligence["scope"]["out_of_scope"] = [
        "Advanced marketing automation.",
        "Complex analytics dashboards.",
        "External integrations not required for core workflow."
    ]

    # --------------------------------------------------
    # ASSUMPTIONS
    # --------------------------------------------------

    intelligence["assumptions"] = [
        "Editorial users are trained internal staff.",
        "Initial traffic will be moderate.",
        "System will evolve after MVP validation."
    ]

    return intelligence