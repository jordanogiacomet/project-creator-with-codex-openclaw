"""
Constraint Engine

Derives architectural constraints from archetype, capabilities
and deployment configuration.
"""


def generate_constraints(spec):

    archetype = spec.get("archetype")
    capabilities = spec.get("capabilities", [])
    answers = spec.get("answers", {})

    constraints = {
        "performance": [],
        "scalability": [],
        "security": [],
        "operational": [],
    }

    # --------------------------------------------------
    # PERFORMANCE
    # --------------------------------------------------

    constraints["performance"].append(
        "Public pages should render in under 500ms under normal load."
    )

    constraints["performance"].append(
        "API responses should target <200ms median latency."
    )

    if "public-site" in capabilities:

        constraints["performance"].append(
            "Public assets must be cacheable via CDN."
        )

    # --------------------------------------------------
    # SCALABILITY
    # --------------------------------------------------

    constraints["scalability"].append(
        "System should support horizontal scaling of application servers."
    )

    constraints["scalability"].append(
        "Database must support concurrent editorial users."
    )

    if "scheduled-jobs" in capabilities:

        constraints["scalability"].append(
            "Background job workers must scale independently."
        )

    # --------------------------------------------------
    # SECURITY
    # --------------------------------------------------

    constraints["security"].append(
        "All authentication flows must enforce secure password hashing."
    )

    constraints["security"].append(
        "All external APIs must require authentication or signed requests."
    )

    if archetype == "editorial-cms":

        constraints["security"].append(
            "Editorial roles must enforce permission boundaries."
        )

    # --------------------------------------------------
    # OPERATIONAL
    # --------------------------------------------------

    constraints["operational"].append(
        "Application must support environment-based configuration."
    )

    constraints["operational"].append(
        "Structured logging should be used for all backend services."
    )

    if answers.get("deploy_target") == "docker":

        constraints["operational"].append(
            "Application must run in containerized environments."
        )

    return constraints