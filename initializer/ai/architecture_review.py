"""
AI Architecture Review Agent

Analyzes generated architecture and provides suggestions.
"""


def build_review_prompt(spec):

    architecture = spec.get("architecture", {})
    capabilities = spec.get("capabilities", [])

    return f"""
You are a senior software architect.

Review this system architecture.

Architecture:
{architecture}

Capabilities:
{capabilities}

Provide suggestions for:

- scalability
- reliability
- security
- performance

Return concise recommendations.
"""


def simulate_review(spec):
    """
    Temporary stub until real LLM integration.
    """

    architecture = spec.get("architecture", {})

    suggestions = []

    components = [c["name"] for c in architecture.get("components", [])]

    if "database" in components:
        suggestions.append(
            "Consider adding database backups and replication."
        )

    if "frontend" in components:
        suggestions.append(
            "Introduce CDN caching for static assets."
        )

    if "worker" in components:
        suggestions.append(
            "Ensure background jobs are idempotent."
        )

    return suggestions


def review_architecture(spec):

    suggestions = simulate_review(spec)

    print("\nAI Architecture Review:\n")

    for s in suggestions:
        print(f"- {s}")

    return suggestions