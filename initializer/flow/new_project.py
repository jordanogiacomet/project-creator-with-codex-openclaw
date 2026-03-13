from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent


@dataclass
class BootstrapInput:
    raw_prompt: str
    project_name: str
    project_slug: str
    project_summary: str
    product_surface: str
    stack_confirmation: bool
    deploy_target: str
    collections: list[str]
    globals_: list[str]
    media_types: list[str]
    roles: list[str]
    internal_users_only: bool
    end_user_auth: bool
    public_signup: bool
    storage_backend: str
    draft_publish: bool
    preview: bool
    scheduled_publishing: bool
    approval_workflow: bool
    multi_tenancy: bool
    audit_logging: bool
    background_jobs: bool
    i18n: bool
    system_constraints: str
    scalability_expectations: str
    non_functional_constraints: str
    output_directory: str


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    return value or "project"


def prompt_text(label: str, default: str | None = None, required: bool = True) -> str:
    while True:
        suffix = f" [{default}]" if default else ""
        value = input(f"{label}{suffix}: ").strip()
        if not value and default is not None:
            return default
        if value or not required:
            return value
        print("This field is required.")


def prompt_yes_no(label: str, default: bool = True) -> bool:
    default_label = "Y/n" if default else "y/N"
    while True:
        value = input(f"{label} [{default_label}]: ").strip().lower()
        if not value:
            return default
        if value in {"y", "yes"}:
            return True
        if value in {"n", "no"}:
            return False
        print("Please answer yes or no.")


def prompt_choice(label: str, options: list[str], default: str | None = None) -> str:
    print(label)
    for idx, option in enumerate(options, start=1):
        marker = " (default)" if option == default else ""
        print(f"  {idx}. {option}{marker}")

    while True:
        raw = input("> ").strip()
        if not raw and default is not None:
            return default
        if raw.isdigit():
            idx = int(raw) - 1
            if 0 <= idx < len(options):
                return options[idx]
        if raw in options:
            return raw
        print("Choose one of the listed options.")


def prompt_list(label: str, default: list[str] | None = None) -> list[str]:
    default_str = ", ".join(default or [])
    raw = prompt_text(label, default=default_str, required=False)
    items = [item.strip() for item in raw.split(",") if item.strip()]
    return items


def detect_archetype(prompt: str) -> str:
    lowered = prompt.lower()
    signals = ["next", "next.js", "payload", "postgres", "postgresql"]
    score = sum(1 for signal in signals if signal in lowered)
    return "next-payload-postgres" if score >= 2 else "unknown"


def create_directories(root: Path) -> None:
    directories = [
        "src/app",
        "src/payload/collections",
        "src/payload/globals",
        "public",
        "docs/stories",
        "docs/architecture",
    ]
    for directory in directories:
        (root / directory).mkdir(parents=True, exist_ok=True)


def write_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def render_prd(data: BootstrapInput) -> str:
    return dedent(
        f"""
        # PRD.md

        ## Product name

        **{data.project_name}**

        ---

        ## Version

        `0.1`

        ---

        ## Status

        `bootstrap-generated`

        ---

        ## Product summary

        {data.project_summary}

        ---

        ## Stack

        - Next.js
        - Payload
        - PostgreSQL

        ---

        ## Product surface

        `{data.product_surface}`

        ---

        ## Initial deploy target

        `{data.deploy_target}`

        ---

        ## Collections

        {chr(10).join(f"- {item}" for item in data.collections)}

        ---

        ## Globals

        {chr(10).join(f"- {item}" for item in data.globals_) if data.globals_ else "- none"}

        ---

        ## Media types

        {chr(10).join(f"- {item}" for item in data.media_types) if data.media_types else "- none"}

        ---

        ## Roles

        {chr(10).join(f"- {item}" for item in data.roles)}

        ---

        ## Editorial workflows

        - Draft/publish: {"yes" if data.draft_publish else "no"}
        - Preview: {"yes" if data.preview else "no"}
        - Scheduled publishing: {"yes" if data.scheduled_publishing else "no"}
        - Approval workflow: {"yes" if data.approval_workflow else "no"}

        ---

        ## Critical confirmations

        - Multi-tenancy: {"yes" if data.multi_tenancy else "no"}
        - End-user auth: {"yes" if data.end_user_auth else "no"}
        - Public signup: {"yes" if data.public_signup else "no"}
        - Storage backend: {data.storage_backend}
        - Audit logging: {"yes" if data.audit_logging else "no"}
        - Background jobs: {"yes" if data.background_jobs else "no"}
        - i18n: {"yes" if data.i18n else "no"}

        ---

        ## System constraints

        {data.system_constraints}

        ---

        ## Scalability expectations

        {data.scalability_expectations}

        ---

        ## Non-functional constraints

        {data.non_functional_constraints}

        ---

        ## Bootstrap note

        This file was generated by the V0 initializer.
        It is intended for human review before implementation begins.
        """
    ).strip()


def render_decisions(data: BootstrapInput) -> str:
    today = datetime.now().strftime("%Y-%m-%d")
    return dedent(
        f"""
        # decisions.md

        ## Decisions

        ### DEC-001
        - **Date:** {today}
        - **Status:** accepted
        - **Decision:** The project archetype is `Next.js + Payload + PostgreSQL`.
        - **Reason:** This bootstrap was generated from the selected V0 playbook.
        - **Consequences:** The initial implementation should remain aligned to this stack.

        ### DEC-002
        - **Date:** {today}
        - **Status:** accepted
        - **Decision:** The initial deploy/runtime target is `{data.deploy_target}`.
        - **Reason:** This was confirmed during discovery.
        - **Consequences:** Generated local setup and docs should reflect this target.

        ### DEC-003
        - **Date:** {today}
        - **Status:** accepted
        - **Decision:** The product surface is `{data.product_surface}`.
        - **Reason:** This was confirmed during discovery.
        - **Consequences:** Story design and directory structure should reflect this surface boundary.

        ### DEC-004
        - **Date:** {today}
        - **Status:** accepted
        - **Decision:** The storage backend direction is `{data.storage_backend}`.
        - **Reason:** This was confirmed during discovery.
        - **Consequences:** Media handling should follow this direction unless superseded later.
        """
    ).strip()


def render_progress(data: BootstrapInput) -> str:
    now = utc_now()
    return dedent(
        f"""
        # progress.txt — {data.project_name}
        # Append-only operational log and execution memory

        [{now}] INFO — Project bootstrap generated by OpenClaw Project Initializer V0
        [{now}] INFO — Project name: {data.project_name}
        [{now}] INFO — Project slug: {data.project_slug}
        [{now}] INFO — Archetype: Next.js + Payload + PostgreSQL
        [{now}] INFO — Product surface: {data.product_surface}
        [{now}] INFO — Deploy target: {data.deploy_target}
        [{now}] INFO — Review is required before implementation begins
        """
    ).strip()


def render_agents() -> str:
    return dedent(
        """
        # AGENTS.md

        You are an execution agent working inside the generated repository.

        Read order:
        1. PRD.md
        2. decisions.md
        3. progress.txt
        4. README.md
        5. docs/stories/

        Rules:
        - work one story at a time
        - do not touch production
        - do not deploy automatically
        - validate changes before claiming completion
        - update progress.txt after meaningful work
        - do not silently change architecture
        """
    ).strip()


def render_readme(data: BootstrapInput) -> str:
    return dedent(
        f"""
        # {data.project_name}

        Bootstrap generated from the `next-payload-postgres` V0 playbook.

        ## Stack

        - Next.js
        - Payload
        - PostgreSQL

        ## Surface

        `{data.product_surface}`

        ## Local runtime

        `{data.deploy_target}`

        ## Main docs

        - `PRD.md`
        - `decisions.md`
        - `progress.txt`
        - `AGENTS.md`
        - `docs/stories/`

        ## Status

        Bootstrap generated. Review required before implementation.
        """
    ).strip()


def render_env_example(data: BootstrapInput) -> str:
    return dedent(
        f"""
        DATABASE_URL=postgresql://postgres:postgres@localhost:5432/{data.project_slug}
        PAYLOAD_SECRET=change-me
        NEXT_PUBLIC_SERVER_URL=http://localhost:3000
        """
    ).strip()


def render_docker_compose(data: BootstrapInput) -> str:
    return dedent(
        f"""
        version: "3.9"

        services:
          postgres:
            image: postgres:16
            container_name: {data.project_slug}_postgres
            restart: unless-stopped
            environment:
              POSTGRES_DB: {data.project_slug}
              POSTGRES_USER: postgres
              POSTGRES_PASSWORD: postgres
            ports:
              - "5432:5432"
            volumes:
              - postgres_data:/var/lib/postgresql/data

        volumes:
          postgres_data:
        """
    ).strip()


def render_story(index: int, title: str, body: str) -> str:
    story_id = f"ST-{index:03d}"
    return dedent(
        f"""
        # {story_id} — {title}

        ## Status

        `todo`

        ## Story

        {body}
        """
    ).strip()


def write_bootstrap_files(root: Path, data: BootstrapInput) -> None:
    write_file(root / "PRD.md", render_prd(data))
    write_file(root / "prd.json", json.dumps(asdict(data), indent=2, ensure_ascii=False))
    write_file(root / "decisions.md", render_decisions(data))
    write_file(root / "progress.txt", render_progress(data))
    write_file(root / "AGENTS.md", render_agents())
    write_file(root / "README.md", render_readme(data))
    write_file(root / ".env.example", render_env_example(data))
    write_file(root / "docker-compose.yml", render_docker_compose(data))

    write_file(
        root / "docs/stories/ST-001-review-bootstrap.md",
        render_story(
            1,
            "Review bootstrap and approve implementation start",
            "Review PRD.md, decisions.md, progress.txt, AGENTS.md, environment defaults, and folder structure before implementation begins.",
        ),
    )
    write_file(
        root / "docs/stories/ST-002-define-content-model.md",
        render_story(
            2,
            "Define Payload collections and globals",
            "Translate approved collections, globals, and media types into explicit Payload definitions.",
        ),
    )
    write_file(
        root / "docs/stories/ST-003-auth-and-roles.md",
        render_story(
            3,
            "Define auth and role boundaries",
            "Implement approved internal roles and any explicitly approved authentication boundary.",
        ),
    )


def print_summary(data: BootstrapInput) -> None:
    print()
    print("Bootstrap generated successfully.")
    print(f"Project: {data.project_name}")
    print(f"Slug: {data.project_slug}")
    print(f"Output: {data.output_directory}")
    print("Artifacts:")
    print("  - PRD.md")
    print("  - prd.json")
    print("  - decisions.md")
    print("  - progress.txt")
    print("  - AGENTS.md")
    print("  - README.md")
    print("  - .env.example")
    print("  - docker-compose.yml")
    print("  - docs/stories/")
    print()
    print("Next step: review the generated bootstrap before implementation.")


def collect_input() -> BootstrapInput:
    print("OpenClaw Project Initializer — V0")
    print("This will generate a reviewable bootstrap package.")
    print()

    raw_prompt = prompt_text("Describe the project you want to bootstrap")
    detected = detect_archetype(raw_prompt)

    if detected == "next-payload-postgres":
        print("Detected archetype: next-payload-postgres")
    else:
        print("Archetype not confidently detected.")
        if not prompt_yes_no("Proceed with the V0 playbook: Next.js + Payload + PostgreSQL?", default=True):
            raise SystemExit(1)

    project_name = prompt_text("Project name")
    project_slug = prompt_text("Project slug", default=slugify(project_name))
    project_summary = prompt_text("One-sentence summary")
    product_surface = prompt_choice(
        "Choose the product surface",
        ["internal_admin_only", "admin_plus_public_site"],
        default="admin_plus_public_site",
    )
    stack_confirmation = prompt_yes_no("Confirm target stack: Next.js + Payload + PostgreSQL?", default=True)
    deploy_target = prompt_choice(
        "Choose the initial deploy target",
        ["docker", "docker_and_k8s_later"],
        default="docker",
    )

    collections = prompt_list("Collections (comma-separated)", default=["users", "posts", "pages", "media"])
    globals_ = prompt_list("Globals (comma-separated)", default=["siteSettings", "header", "footer"])
    media_types = prompt_list("Media types (comma-separated)", default=["images", "documents"])
    roles = prompt_list("Roles (comma-separated)", default=["admin", "editor", "viewer"])

    internal_users_only = prompt_yes_no("Is authentication limited to internal users only?", default=True)
    end_user_auth = prompt_yes_no("Will end-user authentication exist?", default=False)
    public_signup = prompt_yes_no("Will public signup exist?", default=False)
    storage_backend = prompt_choice(
        "Choose storage backend direction",
        ["local_first", "plan_external_backend_now"],
        default="local_first",
    )

    draft_publish = prompt_yes_no("Is draft/publish required?", default=True)
    preview = prompt_yes_no("Is preview required?", default=True)
    scheduled_publishing = prompt_yes_no("Is scheduled publishing required?", default=False)
    approval_workflow = prompt_yes_no("Is approval workflow required?", default=False)

    multi_tenancy = prompt_yes_no("Should the project assume multi-tenancy?", default=False)
    audit_logging = prompt_yes_no("Is audit logging required?", default=True)
    background_jobs = prompt_yes_no("Are background jobs required?", default=False)
    i18n = prompt_yes_no("Is multi-language content required?", default=False)

    system_constraints = prompt_text(
        "System constraints / architecture notes",
        default="Separate admin and public surfaces clearly. Keep the initial structure simple.",
    )
    scalability_expectations = prompt_text(
        "Scalability expectations",
        default="Low initial traffic and small internal team, with moderate growth later.",
    )
    non_functional_constraints = prompt_text(
        "Non-functional constraints",
        default="Easy local setup, readable docs, basic observability.",
    )

    output_directory = prompt_text("Output directory", default=f"./output/{project_slug}")

    return BootstrapInput(
        raw_prompt=raw_prompt,
        project_name=project_name,
        project_slug=project_slug,
        project_summary=project_summary,
        product_surface=product_surface,
        stack_confirmation=stack_confirmation,
        deploy_target=deploy_target,
        collections=collections,
        globals_=globals_,
        media_types=media_types,
        roles=roles,
        internal_users_only=internal_users_only,
        end_user_auth=end_user_auth,
        public_signup=public_signup,
        storage_backend=storage_backend,
        draft_publish=draft_publish,
        preview=preview,
        scheduled_publishing=scheduled_publishing,
        approval_workflow=approval_workflow,
        multi_tenancy=multi_tenancy,
        audit_logging=audit_logging,
        background_jobs=background_jobs,
        i18n=i18n,
        system_constraints=system_constraints,
        scalability_expectations=scalability_expectations,
        non_functional_constraints=non_functional_constraints,
        output_directory=output_directory,
    )


def run_new_project() -> int:
    data = collect_input()
    output_dir = Path(data.output_directory).resolve()

    if output_dir.exists():
        print(f"Error: output directory already exists: {output_dir}")
        return 1

    create_directories(output_dir)
    write_bootstrap_files(output_dir, data)
    print_summary(data)
    return 0