"""
AI Refine Engine

Improves generated spec using heuristics now
and AI later.
"""


def refine_prd(spec):

    architecture = spec.get("architecture", {})
    decisions = architecture.get("decisions", [])

    improvements = []

    if "CDN recommended for public assets." not in decisions:
        improvements.append("CDN recommended for public assets.")

    if "Add monitoring and logging stack." not in decisions:
        improvements.append("Add monitoring and logging stack.")

    if "Add automated database backups." not in decisions:
        improvements.append("Add automated database backups.")

    decisions.extend(improvements)

    spec["architecture"]["decisions"] = decisions

    return spec


def refine_stories(spec):

    stories = spec.get("stories", [])

    ids = [s["id"] for s in stories]

    if "ST-900" not in ids:
        stories.append(
            {
                "id": "ST-900",
                "title": "Setup monitoring and logging",
                "description": "Integrate monitoring, logging and error tracking."
            }
        )

    if "ST-901" not in ids:
        stories.append(
            {
                "id": "ST-901",
                "title": "Implement backups",
                "description": "Automate database backups and retention policies."
            }
        )

    spec["stories"] = stories

    return spec


def refine_spec(spec):

    spec = refine_prd(spec)
    spec = refine_stories(spec)

    return spec