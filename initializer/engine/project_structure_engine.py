"""Project Structure Engine.

Derives the expected directory structure for the generated project
based on stack, archetype, capabilities, and features.

This gives the execution agent a concrete map of where files should
be created, preventing improvisation and ensuring consistency.

The engine is stack-agnostic: it detects the ecosystem (Node.js,
Python, Go) from the stack dict and generates appropriate paths.
"""

from __future__ import annotations

from typing import Any


# -------------------------------------------------------------------
# Ecosystem detection (same logic as openclaw_bundle commands)
# -------------------------------------------------------------------

_NODE_FRONTENDS = {"nextjs", "next.js", "next", "react", "vue", "nuxt", "svelte", "sveltekit", "astro", "remix"}
_NODE_BACKENDS = {"payload", "payload-cms", "node-api", "express", "fastify", "hono", "nestjs", "adonis", "strapi"}
_PYTHON_BACKENDS = {"django", "flask", "fastapi", "litestar"}
_GO_BACKENDS = {"go", "golang", "gin", "echo", "fiber"}


def _detect_ecosystem(stack: dict[str, Any]) -> str:
    frontend = (stack.get("frontend") or "").lower().strip()
    backend = (stack.get("backend") or "").lower().strip()

    if backend in _PYTHON_BACKENDS or frontend in ("django",):
        return "python"
    if backend in _GO_BACKENDS:
        return "go"
    if frontend in _NODE_FRONTENDS or backend in _NODE_BACKENDS:
        return "node"
    if frontend:
        return "node"
    return "unknown"


# -------------------------------------------------------------------
# Directory entry helper
# -------------------------------------------------------------------

def _dir(path: str, purpose: str) -> dict[str, str]:
    return {"path": path, "purpose": purpose}


# -------------------------------------------------------------------
# Node.js structures
# -------------------------------------------------------------------

def _node_nextjs_payload(
    capabilities: list[str],
    features: list[str],
    has_public: bool,
) -> list[dict[str, str]]:
    """Next.js + Payload CMS monorepo structure."""
    dirs = [
        _dir("src/app", "Next.js app router — route groups and pages"),
        _dir("src/app/(app)", "Admin/authenticated application routes"),
        _dir("src/collections", "Payload CMS collection definitions"),
        _dir("src/globals", "Payload CMS global definitions"),
        _dir("src/components", "Shared React UI components"),
        _dir("src/components/ui", "Base UI primitives (Button, Input, Modal, etc.)"),
        _dir("src/lib", "Shared utilities, helpers, and business logic"),
        _dir("src/hooks", "Custom React hooks"),
        _dir("src/styles", "Global styles and Tailwind config"),
        _dir("docker", "Docker and docker-compose files"),
    ]

    if has_public:
        dirs.append(_dir("src/app/(public)", "Public-facing routes (marketing, content)"))

    if "authentication" in features:
        dirs.append(_dir("src/app/(auth)", "Auth routes (login, register, etc.)"))

    if "media-library" in features:
        dirs.append(_dir("src/collections/Media.ts", "Payload Media collection with upload config"))

    if "scheduled-jobs" in capabilities:
        dirs.append(_dir("src/jobs", "Background job definitions and scheduler"))

    dirs.append(_dir("docs/stories", "Story files for agent execution"))

    return dirs


def _node_nextjs_api(
    capabilities: list[str],
    features: list[str],
    has_public: bool,
) -> list[dict[str, str]]:
    """Next.js + generic Node API (express, fastify, etc.)."""
    dirs = [
        _dir("src/app", "Next.js app router — route groups and pages"),
        _dir("src/app/(app)", "Admin/authenticated application routes"),
        _dir("src/app/api", "Next.js API routes or standalone API server"),
        _dir("src/components", "Shared React UI components"),
        _dir("src/components/ui", "Base UI primitives (Button, Input, Modal, etc.)"),
        _dir("src/lib", "Shared utilities, helpers, and business logic"),
        _dir("src/hooks", "Custom React hooks"),
        _dir("src/models", "Database models and schema definitions"),
        _dir("src/middleware", "Express/Fastify middleware (auth, logging, etc.)"),
        _dir("src/styles", "Global styles and Tailwind config"),
        _dir("docker", "Docker and docker-compose files"),
    ]

    if has_public:
        dirs.append(_dir("src/app/(public)", "Public-facing routes"))

    if "authentication" in features:
        dirs.append(_dir("src/app/(auth)", "Auth routes (login, register, etc.)"))

    if "scheduled-jobs" in capabilities:
        dirs.append(_dir("src/jobs", "Background job definitions and scheduler"))

    dirs.append(_dir("docs/stories", "Story files for agent execution"))

    return dirs


def _node_spa_api(
    frontend: str,
    backend: str,
    capabilities: list[str],
    features: list[str],
) -> list[dict[str, str]]:
    """SPA frontend (React, Vue, Svelte) + separate Node backend."""
    dirs = [
        _dir("src/client", f"{frontend} client application"),
        _dir("src/client/pages", "Client page components"),
        _dir("src/client/components", "Shared UI components"),
        _dir("src/client/lib", "Client-side utilities and hooks"),
        _dir("src/server", f"{backend} server application"),
        _dir("src/server/routes", "API route handlers"),
        _dir("src/server/models", "Database models and schema"),
        _dir("src/server/middleware", "Server middleware (auth, logging)"),
        _dir("src/shared", "Shared types and constants between client and server"),
        _dir("docker", "Docker and docker-compose files"),
    ]

    if "scheduled-jobs" in capabilities:
        dirs.append(_dir("src/server/jobs", "Background job definitions"))

    dirs.append(_dir("docs/stories", "Story files for agent execution"))

    return dirs


# -------------------------------------------------------------------
# Python structures
# -------------------------------------------------------------------

def _python_django(
    capabilities: list[str],
    features: list[str],
) -> list[dict[str, str]]:
    """Django project structure."""
    dirs = [
        _dir("config", "Django project settings and URL configuration"),
        _dir("apps/core", "Core application module"),
        _dir("apps/accounts", "User accounts and authentication"),
        _dir("templates", "Django HTML templates"),
        _dir("static", "Static files (CSS, JS, images)"),
        _dir("tests", "Test suite"),
        _dir("docker", "Docker and docker-compose files"),
    ]

    if "roles" in features:
        dirs.append(_dir("apps/accounts/permissions.py", "Role and permission definitions"))

    if "scheduled-jobs" in capabilities:
        dirs.append(_dir("apps/jobs", "Background job definitions and management commands"))

    dirs.append(_dir("docs/stories", "Story files for agent execution"))

    return dirs


def _python_fastapi(
    capabilities: list[str],
    features: list[str],
) -> list[dict[str, str]]:
    """FastAPI / Flask / Litestar project structure."""
    dirs = [
        _dir("app", "Application package"),
        _dir("app/api", "API route handlers"),
        _dir("app/models", "Database models (SQLAlchemy, etc.)"),
        _dir("app/schemas", "Pydantic request/response schemas"),
        _dir("app/services", "Business logic services"),
        _dir("app/middleware", "Middleware (auth, CORS, logging)"),
        _dir("app/core", "Configuration, dependencies, security"),
        _dir("migrations", "Alembic database migrations"),
        _dir("tests", "Test suite"),
        _dir("docker", "Docker and docker-compose files"),
    ]

    if "scheduled-jobs" in capabilities:
        dirs.append(_dir("app/jobs", "Background job definitions"))

    dirs.append(_dir("docs/stories", "Story files for agent execution"))

    return dirs


# -------------------------------------------------------------------
# Go structures
# -------------------------------------------------------------------

def _go_structure(
    capabilities: list[str],
    features: list[str],
) -> list[dict[str, str]]:
    """Go project structure (standard layout)."""
    dirs = [
        _dir("cmd/server", "Main server entrypoint"),
        _dir("internal/handler", "HTTP handlers"),
        _dir("internal/model", "Domain models and types"),
        _dir("internal/service", "Business logic services"),
        _dir("internal/repository", "Database access layer"),
        _dir("internal/middleware", "HTTP middleware (auth, logging)"),
        _dir("internal/config", "Configuration loading"),
        _dir("migrations", "SQL migration files"),
        _dir("docker", "Docker and docker-compose files"),
    ]

    if "scheduled-jobs" in capabilities:
        dirs.append(_dir("cmd/worker", "Background worker entrypoint"))
        dirs.append(_dir("internal/jobs", "Job definitions"))

    dirs.append(_dir("docs/stories", "Story files for agent execution"))

    return dirs


# -------------------------------------------------------------------
# Fallback
# -------------------------------------------------------------------

def _fallback_structure() -> list[dict[str, str]]:
    """Minimal structure when ecosystem is unknown."""
    return [
        _dir("src", "Application source code"),
        _dir("tests", "Test suite"),
        _dir("docker", "Docker and docker-compose files"),
        _dir("docs/stories", "Story files for agent execution"),
    ]


# -------------------------------------------------------------------
# Root files
# -------------------------------------------------------------------

def _root_files_node() -> list[dict[str, str]]:
    return [
        _dir("package.json", "Dependencies and npm scripts"),
        _dir("tsconfig.json", "TypeScript configuration"),
        _dir(".eslintrc.js", "ESLint configuration (or eslint.config.js)"),
        _dir(".prettierrc", "Prettier configuration"),
        _dir(".env.example", "Environment variable template"),
        _dir(".gitignore", "Git ignore rules"),
        _dir("docker-compose.yml", "Docker services (database, etc.)"),
        _dir("README.md", "Project documentation"),
    ]


def _root_files_python() -> list[dict[str, str]]:
    return [
        _dir("requirements.txt", "Python dependencies (or pyproject.toml)"),
        _dir(".env.example", "Environment variable template"),
        _dir(".gitignore", "Git ignore rules"),
        _dir("docker-compose.yml", "Docker services (database, etc.)"),
        _dir("README.md", "Project documentation"),
    ]


def _root_files_go() -> list[dict[str, str]]:
    return [
        _dir("go.mod", "Go module definition"),
        _dir("go.sum", "Go dependency checksums"),
        _dir(".env.example", "Environment variable template"),
        _dir(".gitignore", "Git ignore rules"),
        _dir("docker-compose.yml", "Docker services (database, etc.)"),
        _dir("Makefile", "Build and run commands"),
        _dir("README.md", "Project documentation"),
    ]


def _root_files_fallback() -> list[dict[str, str]]:
    return [
        _dir(".env.example", "Environment variable template"),
        _dir(".gitignore", "Git ignore rules"),
        _dir("README.md", "Project documentation"),
    ]


# -------------------------------------------------------------------
# Public API
# -------------------------------------------------------------------

def generate_project_structure(spec: dict[str, Any]) -> dict[str, Any]:
    """Generate the expected project directory structure.

    Returns a dict with:
    - root_type: monorepo layout description
    - ecosystem: detected ecosystem (node, python, go, unknown)
    - directories: list of {path, purpose} dicts
    - root_files: list of {path, purpose} dicts for root-level files
    """
    stack = spec.get("stack", {})
    features = spec.get("features", [])
    capabilities = spec.get("capabilities", [])

    frontend = (stack.get("frontend") or "").lower().strip()
    backend = (stack.get("backend") or "").lower().strip()

    has_public = "public-site" in capabilities
    ecosystem = _detect_ecosystem(stack)

    directories: list[dict[str, str]]
    root_files: list[dict[str, str]]
    root_type: str

    if ecosystem == "node":
        is_nextjs = frontend in ("nextjs", "next.js", "next")
        is_payload = backend in ("payload", "payload-cms")

        if is_nextjs and is_payload:
            root_type = "Next.js + Payload monorepo (single package.json)"
            directories = _node_nextjs_payload(capabilities, features, has_public)
        elif is_nextjs:
            root_type = f"Next.js + {backend} monorepo (single package.json)"
            directories = _node_nextjs_api(capabilities, features, has_public)
        else:
            root_type = f"{frontend} + {backend} project"
            directories = _node_spa_api(frontend, backend, capabilities, features)

        root_files = _root_files_node()

    elif ecosystem == "python":
        if backend == "django":
            root_type = "Django project"
            directories = _python_django(capabilities, features)
        else:
            root_type = f"{backend} project"
            directories = _python_fastapi(capabilities, features)

        root_files = _root_files_python()

    elif ecosystem == "go":
        root_type = f"Go project ({backend})" if backend else "Go project"
        directories = _go_structure(capabilities, features)
        root_files = _root_files_go()

    else:
        root_type = "Project (unknown stack — configure manually)"
        directories = _fallback_structure()
        root_files = _root_files_fallback()

    return {
        "root_type": root_type,
        "ecosystem": ecosystem,
        "directories": directories,
        "root_files": root_files,
    }