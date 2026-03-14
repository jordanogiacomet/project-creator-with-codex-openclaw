"""
PRD Validator

Ensures spec contains required sections.
"""


REQUIRED_FIELDS = [
    "prompt",
    "archetype",
    "stack",
    "features",
    "architecture",
    "stories",
]


def validate_prd(spec):

    errors = []

    for field in REQUIRED_FIELDS:

        if field not in spec:
            errors.append(f"Missing field: {field}")

    architecture = spec.get("architecture", {})

    if "components" not in architecture:
        errors.append("Architecture missing components")

    if "decisions" not in architecture:
        errors.append("Architecture missing decisions")

    if len(spec.get("stories", [])) == 0:
        errors.append("No stories generated")

    return errors