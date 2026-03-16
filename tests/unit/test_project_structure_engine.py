"""Tests for the project structure engine."""

from initializer.engine.project_structure_engine import generate_project_structure


def _make_spec(stack=None, features=None, capabilities=None):
    return {
        "stack": stack or {"frontend": "nextjs", "backend": "payload", "database": "postgres"},
        "features": features or ["authentication"],
        "capabilities": capabilities or [],
        "answers": {"deploy_target": "docker"},
    }


# -------------------------------------------------------------------
# Ecosystem detection
# -------------------------------------------------------------------

class TestEcosystemDetection:
    def test_nextjs_payload_is_node(self):
        ps = generate_project_structure(_make_spec(
            stack={"frontend": "nextjs", "backend": "payload", "database": "postgres"},
        ))
        assert ps["ecosystem"] == "node"

    def test_django_is_python(self):
        ps = generate_project_structure(_make_spec(
            stack={"frontend": "", "backend": "django", "database": "postgres"},
        ))
        assert ps["ecosystem"] == "python"

    def test_fastapi_is_python(self):
        ps = generate_project_structure(_make_spec(
            stack={"frontend": "react", "backend": "fastapi", "database": "postgres"},
        ))
        assert ps["ecosystem"] == "python"

    def test_gin_is_go(self):
        ps = generate_project_structure(_make_spec(
            stack={"frontend": "", "backend": "gin", "database": "postgres"},
        ))
        assert ps["ecosystem"] == "go"

    def test_unknown_stack_is_unknown(self):
        ps = generate_project_structure(_make_spec(
            stack={"frontend": "", "backend": "", "database": ""},
        ))
        assert ps["ecosystem"] == "unknown"


# -------------------------------------------------------------------
# Node.js structures
# -------------------------------------------------------------------

class TestNodeStructures:
    def test_nextjs_payload_has_collections_dir(self):
        ps = generate_project_structure(_make_spec(
            stack={"frontend": "nextjs", "backend": "payload", "database": "postgres"},
        ))
        paths = [d["path"] for d in ps["directories"]]
        assert "src/collections" in paths
        assert "src/app" in paths

    def test_nextjs_node_api_has_models_dir(self):
        ps = generate_project_structure(_make_spec(
            stack={"frontend": "nextjs", "backend": "node-api", "database": "postgres"},
        ))
        paths = [d["path"] for d in ps["directories"]]
        assert "src/models" in paths
        assert "src/middleware" in paths

    def test_public_site_adds_public_route_group(self):
        ps = generate_project_structure(_make_spec(
            stack={"frontend": "nextjs", "backend": "payload", "database": "postgres"},
            capabilities=["public-site"],
        ))
        paths = [d["path"] for d in ps["directories"]]
        assert "src/app/(public)" in paths

    def test_no_public_route_without_capability(self):
        ps = generate_project_structure(_make_spec(
            stack={"frontend": "nextjs", "backend": "payload", "database": "postgres"},
            capabilities=[],
        ))
        paths = [d["path"] for d in ps["directories"]]
        assert "src/app/(public)" not in paths

    def test_scheduled_jobs_adds_jobs_dir(self):
        ps = generate_project_structure(_make_spec(
            capabilities=["scheduled-jobs"],
        ))
        paths = [d["path"] for d in ps["directories"]]
        assert "src/jobs" in paths

    def test_auth_feature_adds_auth_routes(self):
        ps = generate_project_structure(_make_spec(
            features=["authentication"],
        ))
        paths = [d["path"] for d in ps["directories"]]
        assert "src/app/(auth)" in paths

    def test_root_files_include_package_json(self):
        ps = generate_project_structure(_make_spec())
        root_paths = [f["path"] for f in ps["root_files"]]
        assert "package.json" in root_paths
        assert "tsconfig.json" in root_paths
        assert ".env.example" in root_paths

    def test_spa_backend_has_client_server_split(self):
        ps = generate_project_structure(_make_spec(
            stack={"frontend": "react", "backend": "express", "database": "postgres"},
        ))
        paths = [d["path"] for d in ps["directories"]]
        assert "src/client" in paths
        assert "src/server" in paths
        assert "src/shared" in paths


# -------------------------------------------------------------------
# Python structures
# -------------------------------------------------------------------

class TestPythonStructures:
    def test_django_has_apps_and_config(self):
        ps = generate_project_structure(_make_spec(
            stack={"frontend": "", "backend": "django", "database": "postgres"},
        ))
        paths = [d["path"] for d in ps["directories"]]
        assert "config" in paths
        assert "apps/core" in paths
        assert "apps/accounts" in paths

    def test_fastapi_has_app_and_migrations(self):
        ps = generate_project_structure(_make_spec(
            stack={"frontend": "", "backend": "fastapi", "database": "postgres"},
        ))
        paths = [d["path"] for d in ps["directories"]]
        assert "app" in paths
        assert "app/api" in paths
        assert "migrations" in paths

    def test_python_root_files_include_requirements(self):
        ps = generate_project_structure(_make_spec(
            stack={"frontend": "", "backend": "django", "database": "postgres"},
        ))
        root_paths = [f["path"] for f in ps["root_files"]]
        assert "requirements.txt" in root_paths


# -------------------------------------------------------------------
# Go structures
# -------------------------------------------------------------------

class TestGoStructures:
    def test_go_has_cmd_and_internal(self):
        ps = generate_project_structure(_make_spec(
            stack={"frontend": "", "backend": "gin", "database": "postgres"},
        ))
        paths = [d["path"] for d in ps["directories"]]
        assert "cmd/server" in paths
        assert "internal/handler" in paths
        assert "internal/repository" in paths

    def test_go_scheduled_jobs_adds_worker(self):
        ps = generate_project_structure(_make_spec(
            stack={"frontend": "", "backend": "gin", "database": "postgres"},
            capabilities=["scheduled-jobs"],
        ))
        paths = [d["path"] for d in ps["directories"]]
        assert "cmd/worker" in paths
        assert "internal/jobs" in paths

    def test_go_root_files_include_go_mod(self):
        ps = generate_project_structure(_make_spec(
            stack={"frontend": "", "backend": "gin", "database": "postgres"},
        ))
        root_paths = [f["path"] for f in ps["root_files"]]
        assert "go.mod" in root_paths
        assert "Makefile" in root_paths


# -------------------------------------------------------------------
# Output structure
# -------------------------------------------------------------------

class TestOutputStructure:
    def test_output_has_required_keys(self):
        ps = generate_project_structure(_make_spec())
        assert "root_type" in ps
        assert "ecosystem" in ps
        assert "directories" in ps
        assert "root_files" in ps

    def test_directories_have_path_and_purpose(self):
        ps = generate_project_structure(_make_spec())
        for d in ps["directories"]:
            assert "path" in d
            assert "purpose" in d
            assert isinstance(d["path"], str)
            assert isinstance(d["purpose"], str)

    def test_all_structures_include_stories_dir(self):
        """Every ecosystem should include docs/stories for agent execution."""
        for stack in [
            {"frontend": "nextjs", "backend": "payload", "database": "postgres"},
            {"frontend": "", "backend": "django", "database": "postgres"},
            {"frontend": "", "backend": "gin", "database": "postgres"},
            {"frontend": "", "backend": "", "database": ""},
        ]:
            ps = generate_project_structure(_make_spec(stack=stack))
            paths = [d["path"] for d in ps["directories"]]
            assert "docs/stories" in paths, f"Missing docs/stories for stack {stack}"