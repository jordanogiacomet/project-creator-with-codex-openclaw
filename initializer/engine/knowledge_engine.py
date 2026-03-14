"""
Knowledge Engine

Injects domain knowledge, patterns, libraries and scaling strategies
based on archetype and capabilities.
"""


def generate_knowledge(spec):

    archetype = spec.get("archetype")
    capabilities = spec.get("capabilities", [])

    knowledge = {
        "patterns": [],
        "recommended_libraries": [],
        "scaling_strategies": [],
        "pitfalls": [],
    }

    # -----------------------------------------
    # EDITORIAL CMS
    # -----------------------------------------

    if archetype == "editorial-cms":

        knowledge["patterns"].extend(
            [
                "Use headless CMS architecture.",
                "Separate content management from public rendering.",
                "Implement preview mode for unpublished content.",
            ]
        )

        knowledge["recommended_libraries"].extend(
            [
                "Next.js",
                "Payload CMS",
                "PostgreSQL",
            ]
        )

        knowledge["scaling_strategies"].extend(
            [
                "Use CDN caching for public pages.",
                "Use Incremental Static Regeneration for high traffic pages.",
                "Store media in S3-compatible storage.",
            ]
        )

        knowledge["pitfalls"].extend(
            [
                "Content schema changes after launch can cause migration issues.",
                "Preview rendering must match production rendering.",
            ]
        )

    # -----------------------------------------
    # CAPABILITY KNOWLEDGE
    # -----------------------------------------

    if "scheduled-jobs" in capabilities:

        knowledge["patterns"].append(
            "Background job queues should be idempotent."
        )

        knowledge["recommended_libraries"].append(
            "BullMQ / Redis queues"
        )

    if "public-site" in capabilities:

        knowledge["patterns"].append(
            "Public pages should be cacheable at edge."
        )

    if "i18n" in capabilities:

        knowledge["patterns"].append(
            "Use locale fallback strategies."
        )

    return knowledge