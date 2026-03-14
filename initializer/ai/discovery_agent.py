"""
AI Discovery Agent

Turns a rough idea into structured answers
that the initializer pipeline can consume.
"""


def build_discovery_prompt(prompt):

    return f"""
You are a product architect.

A user described a project idea.

Your job is to ask the minimal set of questions required
to define the architecture of the system.

Project idea:
{prompt}

Ask questions covering:

- public site
- authentication
- background jobs
- localization
- storage
- integrations

Return the questions as a list.
"""


def simulate_ai_questions(prompt):
    """
    Temporary stub before connecting real AI.
    """

    return [
        "Will the system expose a public website?",
        "Will the system require background jobs?",
        "Will the system support multiple languages?",
        "Will users need authentication?",
        "Will the system store media files?",
    ]


def run_discovery(prompt):
    """
    Main discovery entrypoint.
    """

    questions = simulate_ai_questions(prompt)

    answers = {}

    print("\nAI Discovery Questions:\n")

    for q in questions:

        value = input(f"{q} (y/n): ").strip().lower()

        answers[q] = value in ["y", "yes", "true"]

    return answers