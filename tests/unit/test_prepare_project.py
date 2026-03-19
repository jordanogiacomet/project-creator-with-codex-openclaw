import json
from unittest.mock import patch

from initializer.flow.prepare_project import _detect_commands, run_prepare_project


def _make_spec() -> dict:
    return {
        "answers": {
            "project_name": "Prepared Project",
            "project_slug": "prepared-project",
            "summary": "Test project for prepare flow.",
            "surface": "admin_plus_public_site",
            "deploy_target": "docker",
        },
        "stack": {
            "frontend": "nextjs",
            "backend": "payload",
            "database": "postgres",
        },
        "capabilities": ["cms", "public-site"],
        "features": ["authentication"],
        "architecture": {
            "components": [
                {"name": "frontend", "technology": "nextjs"},
                {"name": "api", "technology": "payload"},
                {"name": "database", "technology": "postgres"},
            ],
            "decisions": ["Use Payload for content workflows."],
        },
        "stories": [
            {
                "id": "ST-001",
                "story_key": "bootstrap.repository",
                "title": "Initialize repository",
            }
        ],
    }


def _write_project_files(project_dir, spec: dict) -> None:
    (project_dir / "docs" / "stories").mkdir(parents=True)
    (project_dir / "spec.json").write_text(
        json.dumps(spec, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    for filename in ("PRD.md", "architecture.md", "decisions.md", "progress.txt"):
        (project_dir / filename).write_text("placeholder\n", encoding="utf-8")


def test_detect_commands_returns_wrapped_structure_for_package_json(tmp_path):
    spec = _make_spec()
    _write_project_files(tmp_path, spec)
    (tmp_path / "package.json").write_text(
        json.dumps(
            {
                "scripts": {
                    "test": "vitest",
                    "lint": "eslint .",
                    "build": "next build",
                    "dev": "next dev",
                }
            }
        ),
        encoding="utf-8",
    )

    result = _detect_commands(tmp_path, spec)

    assert result == {
        "commands": {
            "test": "npm test",
            "lint": "npm run lint",
            "build": "npm run build",
            "dev": "npm run dev",
        },
        "notes": ["Commands detected from project files."],
    }


def test_prepare_preserves_detected_commands_after_bundle_regeneration(tmp_path):
    spec = _make_spec()
    _write_project_files(tmp_path, spec)
    (tmp_path / "package.json").write_text(
        json.dumps(
            {
                "scripts": {
                    "test": "vitest",
                    "lint": "eslint .",
                    "build": "next build",
                    "dev": "next dev",
                }
            }
        ),
        encoding="utf-8",
    )

    def fake_write_openclaw_bundle(output_dir, _spec):
        openclaw_dir = output_dir / ".openclaw"
        openclaw_dir.mkdir(parents=True, exist_ok=True)
        (openclaw_dir / "commands.json").write_text(
            json.dumps(
                {
                    "commands": {
                        "test": "stale-command",
                        "lint": "stale-command",
                        "build": "stale-command",
                        "dev": "stale-command",
                    },
                    "notes": ["stale data"],
                },
                indent=2,
            ) + "\n",
            encoding="utf-8",
        )

    with patch(
        "initializer.flow.prepare_project.write_openclaw_bundle",
        side_effect=fake_write_openclaw_bundle,
    ), patch(
        "initializer.flow.prepare_project.write_codex_bundle",
    ), patch(
        "initializer.flow.prepare_project._print_execution_preview",
    ):
        exit_code = run_prepare_project(str(tmp_path))

    commands = json.loads((tmp_path / ".openclaw" / "commands.json").read_text(encoding="utf-8"))

    assert exit_code == 0
    assert commands == {
        "commands": {
            "test": "npm test",
            "lint": "npm run lint",
            "build": "npm run build",
            "dev": "npm run dev",
        },
        "notes": ["Commands detected from project files."],
    }
