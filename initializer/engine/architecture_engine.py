"""Architecture Engine.

Generates system architecture based on stack, features, capabilities,
and structured discovery signals.

Generates:
- components: system components with technology and role
- decisions: architectural decisions
- communication: contracts between components (protocol, pattern, auth)
- boundaries: responsibility split between frontend, backend, shared

Key change: public-site related decisions (CDN, SSR/ISR, public traffic
caching) are only generated when public-site is actually in capabilities.
"""


GENERIC_COMPONENT_TECHNOLOGIES = {
    "background-worker",
}

# -------------------------------------------------------------------
# Node ecosystem detection (for deriving communication patterns)
# -------------------------------------------------------------------

_PAYLOAD_BACKENDS = {"payload", "payload-cms"}
_DJANGO_BACKENDS = {"django"}
_FASTAPI_BACKENDS = {"fastapi", "flask", "litestar"}
_GO_BACKENDS = {"go", "golang", "gin", "echo", "fiber"}


def _unique(values):
    items = []
    for value in values:
        if value not in items:
            items.append(value)
    return items


def _clone_architecture(existing_architecture):
    architecture = dict(existing_architecture)
    architecture["components"] = [
        dict(component) for component in existing_architecture.get("components", [])
    ]
    architecture["decisions"] = list(existing_architecture.get("decisions", []))
    return architecture


def _merge_component(existing_component, incoming_component):
    merged = dict(existing_component)

    for key, value in incoming_component.items():
        if key == "name" or value in (None, "", []):
            continue

        existing_value = merged.get(key)
        if not existing_value:
            merged[key] = value
            continue

        if existing_value == value:
            continue

        chosen_value = existing_value
        alternate_value = value

        if key == "technology" and existing_value in GENERIC_COMPONENT_TECHNOLOGIES:
            chosen_value = value
            alternate_value = existing_value

        merged[key] = chosen_value
        alternatives_key = f"{key}_alternatives"
        alternatives = _unique(list(merged.get(alternatives_key, [])) + [alternate_value])
        merged[alternatives_key] = alternatives

    return merged


def _get_decision_signals(spec):
    discovery = spec.get("discovery", {})
    if not isinstance(discovery, dict):
        return {}
    signals = discovery.get("decision_signals", {})
    if not isinstance(signals, dict):
        return {}
    return signals


def _core_features(signals):
    value = signals.get("core_work_features", [])
    if not isinstance(value, list):
        return []

    items = []
    for item in value:
        if isinstance(item, str):
            text = item.strip().lower()
            if text and text not in items:
                items.append(text)
    return items


def _has_public_site(capabilities):
    return "public-site" in capabilities


# -------------------------------------------------------------------
# Communication contracts
# -------------------------------------------------------------------

def _generate_communication(stack, features, capabilities, component_names):
    """Generate communication contracts between components."""
    frontend = (stack.get("frontend") or "").lower().strip()
    backend = (stack.get("backend") or "").lower().strip()
    database = (stack.get("database") or "").lower().strip()

    contracts = []

    def add(source, target, protocol, pattern, auth=None):
        if source not in component_names or target not in component_names:
            return
        entry = {
            "from": source,
            "to": target,
            "protocol": protocol,
            "pattern": pattern,
        }
        if auth:
            entry["auth"] = auth
        contracts.append(entry)

    # --- Frontend → API ---
    if "frontend" in component_names and "api" in component_names:
        if backend in _PAYLOAD_BACKENDS:
            add("frontend", "api", "http",
                "REST via Payload auto-generated API + custom endpoints",
                "JWT bearer token or session cookie (Payload built-in)")
        elif backend in _DJANGO_BACKENDS:
            add("frontend", "api", "http",
                "Django REST Framework or Django views",
                "Session cookie or token authentication")
        elif backend in _FASTAPI_BACKENDS:
            add("frontend", "api", "http",
                f"REST API via {backend}",
                "JWT bearer token in Authorization header")
        elif backend in _GO_BACKENDS:
            add("frontend", "api", "http",
                f"REST API via {backend} HTTP handlers",
                "JWT bearer token in Authorization header")
        else:
            add("frontend", "api", "http",
                "REST API",
                "JWT bearer token or session cookie")

    # --- API → Database ---
    if "api" in component_names and "database" in component_names:
        if backend in _PAYLOAD_BACKENDS:
            orm = "Drizzle ORM (Payload built-in)"
        elif backend in _DJANGO_BACKENDS:
            orm = "Django ORM"
        elif backend in _FASTAPI_BACKENDS:
            orm = "SQLAlchemy or equivalent"
        elif backend in _GO_BACKENDS:
            orm = "sqlx, GORM, or raw SQL"
        else:
            orm = "ORM or query builder"

        add("api", "database", "tcp",
            f"{orm} over {database} connection pool")

    # --- API → Object Storage ---
    if "api" in component_names and "object-storage" in component_names:
        add("api", "object-storage", "http",
            "S3-compatible API for media upload and retrieval",
            "Access key / IAM role")

    # --- Worker → Database ---
    if "worker" in component_names and "database" in component_names:
        add("worker", "database", "tcp",
            f"Direct {database} connection for job execution")

    # --- Worker → API (if jobs need to trigger API actions) ---
    # Only add if both exist and there are features that imply worker→api
    if "worker" in component_names and "api" in component_names:
        if "notifications" in features:
            add("worker", "api", "http",
                "Internal HTTP call for notification delivery or webhook triggers")

    # --- CDN → Frontend ---
    if "cdn" in component_names and "frontend" in component_names:
        add("cdn", "frontend", "http",
            "Edge cache proxying static assets and SSR/ISR responses")

    return contracts


# -------------------------------------------------------------------
# Boundaries
# -------------------------------------------------------------------

def _generate_boundaries(stack, features, capabilities):
    """Generate responsibility boundaries between layers."""
    backend = (stack.get("backend") or "").lower().strip()
    frontend = (stack.get("frontend") or "").lower().strip()

    frontend_resp = [
        "Rendering pages and UI components",
        "Client-side routing and navigation",
        "Form validation (client-side)",
        "Client-side state management",
    ]

    backend_resp = [
        "Business logic and domain rules",
        "Authentication and session management",
        "Authorization and permission enforcement",
        "Data persistence and queries",
        "Input validation (server-side, authoritative)",
    ]

    shared = []

    if backend in _PAYLOAD_BACKENDS:
        backend_resp.append("Content model definition via Payload collections")
        backend_resp.append("Media upload handling and storage")
        shared.append("TypeScript types auto-generated by Payload")
    elif backend in _DJANGO_BACKENDS:
        backend_resp.append("Template rendering (if using Django templates)")
        backend_resp.append("Database migrations via Django ORM")
        shared.append("API contract defined by serializers / OpenAPI schema")
    elif backend in _FASTAPI_BACKENDS:
        backend_resp.append("Request/response validation via Pydantic schemas")
        backend_resp.append("Database migrations via Alembic")
        shared.append("API contract defined by Pydantic models / OpenAPI schema")
    elif backend in _GO_BACKENDS:
        backend_resp.append("Request/response structs and validation")
        backend_resp.append("Database migrations via migration tool")
        shared.append("API contract defined by struct types or OpenAPI spec")
    else:
        shared.append("Shared types or API contract between frontend and backend")

    if "media-library" in features:
        backend_resp.append("Media asset management and storage orchestration")

    if "scheduled-jobs" in capabilities:
        backend_resp.append("Background job scheduling and execution")

    if "public-site" in capabilities:
        frontend_resp.append("Public page rendering (SSR/ISR) for SEO")
        frontend_resp.append("CDN-compatible caching headers")

    if "i18n" in capabilities:
        frontend_resp.append("Locale-aware rendering and text formatting")
        backend_resp.append("Locale-aware data storage and API responses")

    return {
        "frontend": frontend_resp,
        "backend": backend_resp,
        "shared": shared,
    }


# -------------------------------------------------------------------
# Main generator
# -------------------------------------------------------------------

def generate_architecture(spec):
    stack = spec.get("stack", {})
    features = spec.get("features", [])
    capabilities = spec.get("capabilities", [])
    existing_architecture = spec.get("architecture") or {}
    signals = _get_decision_signals(spec)

    frontend = stack.get("frontend")
    backend = stack.get("backend")
    database = stack.get("database")

    needs_cms = signals.get("needs_cms")
    needs_i18n = signals.get("needs_i18n")
    needs_scheduled_jobs = signals.get("needs_scheduled_jobs")
    primary_audience = signals.get("primary_audience")
    app_shape = signals.get("app_shape")
    core_work_features = _core_features(signals)

    has_public = _has_public_site(capabilities)

    architecture = _clone_architecture(existing_architecture)
    components = architecture["components"]
    decisions = architecture["decisions"]

    def add_component(component):
        name = component.get("name")
        if name:
            for index, existing_component in enumerate(components):
                if existing_component.get("name") == name:
                    components[index] = _merge_component(existing_component, component)
                    return

        if component not in components:
            components.append(dict(component))

    def add_decision(decision):
        if decision not in decisions:
            decisions.append(decision)

    if frontend:
        add_component(
            {
                "name": "frontend",
                "technology": frontend,
                "role": "user interface",
            }
        )

    if backend:
        add_component(
            {
                "name": "api",
                "technology": backend,
                "role": "application logic",
            }
        )

    if database:
        add_component(
            {
                "name": "database",
                "technology": database,
                "role": "persistent storage",
            }
        )

    if "media-library" in features:
        add_component(
            {
                "name": "object-storage",
                "technology": "s3-compatible",
                "role": "media storage",
            }
        )
        add_decision("Media assets stored in object storage.")

    if "scheduled-publishing" in features or "scheduled-jobs" in capabilities or needs_scheduled_jobs is True:
        add_component(
            {
                "name": "worker",
                "technology": backend or "background-worker",
                "role": "background processing",
            }
        )
        add_decision("Background worker processes scheduled jobs.")

    if "authentication" in features:
        add_decision("Authentication handled via secure session or JWT.")

    if "roles" in features:
        add_decision("Authorization must enforce role and permission boundaries.")

    if has_public:
        add_decision("Public-facing pages should use caching and delivery strategies appropriate for anonymous traffic.")
        add_decision("SEO-sensitive public pages should use rendering strategies such as SSR or ISR when beneficial.")

    if needs_i18n is True:
        if needs_cms is True:
            add_decision("Content models must support locale-aware fields and fallback rules.")
        else:
            add_decision("Application UI and APIs must support locale-aware text, formatting, and translation resources.")

    if needs_scheduled_jobs is True:
        add_decision("Automation workflows require a background worker and durable job execution strategy.")

    if app_shape == "internal-work-organizer":
        add_decision("Model work items, deadlines, ownership, and progress explicitly in the application domain.")
        add_decision("Prioritize internal workflow clarity and fast task-oriented interactions.")

    if primary_audience == "internal_teams" and not has_public:
        add_decision("Prioritize internal dashboard and workflow ergonomics over public-site delivery concerns.")

    if "deadlines" in core_work_features:
        add_decision("Work items should support due dates, deadline validation, and overdue detection.")

    if "progress-tracking" in core_work_features:
        add_decision("Work items should support explicit status progression and progress visibility.")

    if "task-assignment" in core_work_features:
        add_decision("Ownership and assignment must be modeled for teams and individual users.")

    if "reminders" in core_work_features:
        add_decision("Reminder workflows should be driven by scheduled jobs and configurable trigger rules.")

    if "report-generation" in core_work_features:
        add_decision("Operational reporting should be generated from durable domain data and background jobs when needed.")

    add_decision("Implement structured logging.")
    add_decision("Add health check endpoints.")
    add_decision("Use connection pooling.")
    add_decision("Add automated database backups.")

    if has_public:
        add_decision("Introduce caching for frequently accessed public content.")
    else:
        add_decision("Introduce caching for frequently accessed application data where beneficial.")

    # --- Assemble final architecture ---

    architecture["style"] = existing_architecture.get("style", "service-oriented")
    architecture["components"] = components
    architecture["decisions"] = decisions

    # Communication contracts (C-ARCH-01)
    component_names = {c.get("name") for c in components if c.get("name")}
    architecture["communication"] = existing_architecture.get("communication") or _generate_communication(
        stack, features, capabilities, component_names,
    )

    # Boundaries (C-ARCH-01)
    architecture["boundaries"] = existing_architecture.get("boundaries") or _generate_boundaries(
        stack, features, capabilities,
    )

    return architecture