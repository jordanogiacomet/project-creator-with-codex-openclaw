"""
Story Coverage Checker

Ensures each capability has at least one story.
"""


def check_story_coverage(spec):

    capabilities = spec.get("capabilities", [])
    stories = spec.get("stories", [])

    coverage = {}

    for cap in capabilities:

        coverage[cap] = False

        for story in stories:

            if cap.replace("-", " ") in story["description"].lower():
                coverage[cap] = True

    missing = []

    for cap, covered in coverage.items():
        if not covered:
            missing.append(cap)

    return missing