from pathlib import Path

from initializer.playbooks.playbook_loader import load_playbook
from initializer.flow.archetype_detection import detect_archetype

from initializer.runtime.spec_builder import build_semantic_spec
from initializer.runtime.spec_writer import write_spec

from initializer.synthesis.architecture import synthesize_architecture
from initializer.synthesis.stories import generate_stories

from initializer.engine.capability_engine import apply_capabilities
from initializer.engine.risk_engine import analyze_risks
from initializer.engine.design_system_engine import generate_design_system
from initializer.engine.constraint_engine import generate_constraints
from initializer.engine.knowledge_engine import generate_knowledge
from initializer.engine.prd_intelligence_engine import generate_prd_intelligence

from initializer.renderers.prd_renderer import render_prd
from initializer.renderers.stories_renderer import write_stories
from initializer.renderers.architecture_renderer import write_architecture
from initializer.renderers.risks_renderer import write_risks
from initializer.renderers.design_system_renderer import write_design_system
from initializer.renderers.constraints_renderer import write_constraints
from initializer.renderers.knowledge_renderer import write_knowledge
from initializer.renderers.prd_intelligence_renderer import write_prd_intelligence

from initializer.renderers.project_files import (
    write_basic_files,
    write_agents,
    write_progress,
    write_decisions,
)

OUTPUT_DIR = Path("output")


# --------------------------------------------------
# CLI HELPERS
# --------------------------------------------------


def prompt_text(label, default=None):

    suffix = f" [{default}]" if default else ""

    value = input(f"{label}{suffix}: ").strip()

    if value == "" and default is not None:
        return default

    return value


def prompt_choice(label, options, default_index=0):

    print(label)

    for i, opt in enumerate(options, 1):

        marker = " (default)" if i - 1 == default_index else ""

        print(f"  {i}. {opt}{marker}")

    value = input("> ").strip()

    if value == "":
        return options[default_index]

    return options[int(value) - 1]


def prompt_boolean(label, default):

    default_label = "y" if default else "n"

    value = input(f"{label} (y/n) [default={default_label}]: ").strip().lower()

    if value == "":
        return default

    return value in ["y", "yes", "true"]


# --------------------------------------------------
# FILESYSTEM
# --------------------------------------------------


def ensure_output_dir():

    OUTPUT_DIR.mkdir(exist_ok=True)


def create_project_dir(slug):

    project_dir = OUTPUT_DIR / slug

    project_dir.mkdir(parents=True, exist_ok=True)

    return project_dir


# --------------------------------------------------
# DISCOVERY
# --------------------------------------------------


def collect_input():

    raw_prompt = prompt_text("Describe the project")

    archetype = detect_archetype(raw_prompt)

    playbook = load_playbook(archetype)

    print()
    print(f"Detected archetype: {archetype}")
    print(playbook["description"])
    print()

    project_name = prompt_text("Project name")

    slug_default = project_name.lower().replace(" ", "-")

    project_slug = prompt_text("Project slug", slug_default)

    summary = prompt_text("One sentence summary")

    surface = prompt_choice(
        "Choose product surface",
        ["internal_admin_only", "admin_plus_public_site"],
        default_index=1,
    )

    deploy_target = prompt_choice(
        "Choose deploy target",
        ["docker", "docker_and_k8s_later"],
        default_index=0,
    )

    answers = {}

    for q in playbook.get("discovery_questions", []):

        value = prompt_boolean(q["question"], q["default"])

        answers[q["id"]] = value

    answers["project_name"] = project_name
    answers["project_slug"] = project_slug
    answers["summary"] = summary
    answers["surface"] = surface
    answers["deploy_target"] = deploy_target

    return raw_prompt, archetype, playbook, answers


# --------------------------------------------------
# PIPELINE
# --------------------------------------------------


def run_new_project(spec=None):

    ensure_output_dir()

    raw_prompt, archetype, playbook, answers = collect_input()

    slug = answers["project_slug"]

    project_dir = create_project_dir(slug)

    # --------------------------------------------------
    # SEMANTIC SPEC
    # --------------------------------------------------

    spec = build_semantic_spec(
        raw_prompt,
        archetype,
        playbook,
        answers,
    )

    # --------------------------------------------------
    # ARCHITECTURE SYNTHESIS
    # --------------------------------------------------

    architecture = synthesize_architecture(spec, playbook)

    spec["architecture"] = architecture

    # --------------------------------------------------
    # STORY GENERATION
    # --------------------------------------------------

    stories = generate_stories(spec, architecture)

    spec["stories"] = stories

    # --------------------------------------------------
    # CAPABILITY ENGINE
    # --------------------------------------------------

    architecture, stories, capabilities = apply_capabilities(spec)

    spec["architecture"] = architecture
    spec["stories"] = stories
    spec["capabilities"] = capabilities

    # --------------------------------------------------
    # RISK ENGINE
    # --------------------------------------------------

    risks = analyze_risks(spec)

    spec["risks"] = risks

    # --------------------------------------------------
    # DESIGN SYSTEM ENGINE
    # --------------------------------------------------

    design_system = generate_design_system(spec)

    spec["design_system"] = design_system

    # --------------------------------------------------
    # CONSTRAINT ENGINE
    # --------------------------------------------------

    constraints = generate_constraints(spec)

    spec["constraints"] = constraints

    # --------------------------------------------------
    # KNOWLEDGE ENGINE
    # --------------------------------------------------

    knowledge = generate_knowledge(spec)

    spec["knowledge"] = knowledge

    # --------------------------------------------------
    # PRD INTELLIGENCE ENGINE
    # --------------------------------------------------

    prd_intelligence = generate_prd_intelligence(spec)

    spec["prd_intelligence"] = prd_intelligence

    # --------------------------------------------------
    # WRITE SPEC
    # --------------------------------------------------

    write_spec(spec, project_dir)

    # --------------------------------------------------
    # BASE FILES
    # --------------------------------------------------

    write_basic_files(project_dir)

    write_agents(project_dir)

    write_progress(project_dir)

    write_decisions(project_dir)

    # --------------------------------------------------
    # DOCUMENTATION
    # --------------------------------------------------

    prd = render_prd(spec)

    (project_dir / "PRD.md").write_text(prd)

    write_stories(project_dir, spec["stories"])

    write_architecture(project_dir, spec["architecture"])

    write_risks(project_dir, spec["risks"])

    write_design_system(project_dir, spec["design_system"])

    write_constraints(project_dir, spec["constraints"])

    write_knowledge(project_dir, spec["knowledge"])

    write_prd_intelligence(project_dir, spec["prd_intelligence"])

    print()
    print("Bootstrap generated successfully.")
    print(project_dir)