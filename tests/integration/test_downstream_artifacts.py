"""Integration tests for derive_downstream_artifacts.

Updated to validate project_structure and domain_model
are populated alongside existing downstream sections.
"""

from initializer.flow.new_project import derive_downstream_artifacts


def _make_editorial_spec():
    return {
        "prompt": "Editorial CMS with admin panel and public website",
        "archetype": "editorial-cms",
        "archetype_data": {
            "id": "editorial-cms",
            "name": "editorial-cms",
            "stack": {
                "frontend": "nextjs",
                "backend": "payload",
                "database": "postgres",
            },
            "features": [
                "authentication",
                "roles",
                "media-library",
                "preview",
                "scheduled-publishing",
            ],
            "capabilities": ["cms"],
        },
        "stack": {
            "frontend": "nextjs",
            "backend": "payload",
            "database": "postgres",
        },
        "features": [
            "authentication",
            "roles",
            "media-library",
            "preview",
            "scheduled-publishing",
        ],
        "capabilities": ["cms", "public-site"],
        "architecture": {
            "components": [
                {"name": "cdn", "technology": "edge-cache", "role": "static delivery"},
                {"name": "frontend", "technology": "nextjs", "role": "web ui"},
                {"name": "api", "technology": "payload", "role": "application backend"},
                {"name": "database", "technology": "postgres", "role": "data storage"},
                {
                    "name": "object-storage",
                    "technology": "s3",
                    "role": "media storage",
                },
                {"name": "worker", "technology": "payload", "role": "background jobs"},
            ],
            "decisions": [
                "Authentication handled via secure session or JWT.",
                "Media assets stored in object storage.",
                "Background worker processes scheduled jobs.",
            ],
        },
        "stories": [
            {
                "id": "ST-001",
                "title": "Implement CMS content management",
                "description": "Implement cms content management workflows.",
            },
            {
                "id": "ST-002",
                "title": "Implement public website",
                "description": "Implement public-site content delivery flows.",
            },
        ],
        "answers": {
            "project_name": "Downstream Test",
            "project_slug": "downstream-test",
            "summary": "Downstream artifact integration test",
            "surface": "admin_plus_public_site",
            "deploy_target": "docker",
        },
    }


def test_derive_downstream_artifacts_populates_all_expected_sections():
    spec = _make_editorial_spec()
    result = derive_downstream_artifacts(spec)

    # Original sections
    assert "constraints" in result
    assert "design_system" in result
    assert "risks" in result
    assert "diagram" in result

    assert result["constraints"]
    assert result["design_system"]
    assert result["risks"]
    assert result["diagram"]

    assert "nodes" in result["diagram"]
    assert "edges" in result["diagram"]
    assert ("frontend", "api") in result["diagram"]["edges"]
    assert ("api", "database") in result["diagram"]["edges"]
    assert ("api", "object_storage") in result["diagram"]["edges"]
    assert ("worker", "database") in result["diagram"]["edges"]
    assert ("cdn", "frontend") in result["diagram"]["edges"]

    # New sections
    assert "project_structure" in result
    assert "domain_model" in result


def test_derive_downstream_project_structure_has_expected_shape():
    spec = _make_editorial_spec()
    result = derive_downstream_artifacts(spec)

    ps = result["project_structure"]
    assert "root_type" in ps
    assert "ecosystem" in ps
    assert "directories" in ps
    assert "root_files" in ps

    assert ps["ecosystem"] == "node"
    assert isinstance(ps["directories"], list)
    assert len(ps["directories"]) > 0

    paths = [d["path"] for d in ps["directories"]]
    assert "src/collections" in paths  # Payload-specific


def test_derive_downstream_domain_model_has_expected_shape():
    spec = _make_editorial_spec()
    result = derive_downstream_artifacts(spec)

    dm = result["domain_model"]
    assert "entities" in dm
    assert "roles" in dm
    assert "auth_model" in dm
    assert "business_rules" in dm

    entity_names = [e["name"] for e in dm["entities"]]
    assert "User" in entity_names
    assert "Article" in entity_names

    role_names = [r["name"] for r in dm["roles"]]
    assert "admin" in role_names
    assert "editor" in role_names
    assert "reviewer" in role_names

    assert dm["auth_model"]["strategy"] == "email_password"
    assert len(dm["business_rules"]) > 0


def test_derive_downstream_domain_model_for_backoffice():
    spec = _make_editorial_spec()
    spec["archetype"] = "backoffice"
    spec["discovery"] = {
        "decision_signals": {
            "app_shape": "backoffice",
            "primary_audience": "internal_teams",
            "core_work_features": ["deadlines", "approvals"],
        },
    }

    result = derive_downstream_artifacts(spec)
    dm = result["domain_model"]

    entity_names = [e["name"] for e in dm["entities"]]
    assert "Record" in entity_names

    record = next(e for e in dm["entities"] if e["name"] == "Record")
    assert "pending_approval" in record["states"]
    assert "due_date" in record["fields"]

    role_names = [r["name"] for r in dm["roles"]]
    assert "operator" in role_names
    assert "manager" in role_names


def test_derive_downstream_project_structure_for_python_stack():
    spec = _make_editorial_spec()
    spec["stack"] = {
        "frontend": "",
        "backend": "django",
        "database": "postgres",
    }

    result = derive_downstream_artifacts(spec)
    ps = result["project_structure"]

    assert ps["ecosystem"] == "python"
    paths = [d["path"] for d in ps["directories"]]
    assert "config" in paths
    assert "apps/core" in paths