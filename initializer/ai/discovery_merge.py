# initializer/ai/discovery_merge.py

from __future__ import annotations

from copy import deepcopy
from typing import Any

from initializer.ai.discovery_engine import AssistedDiscoveryResult
from initializer.engine.capability_registry import CAPABILITY_REGISTRY


DEFAULT_ALLOWED_ANSWER_KEYS = {
    # current canonical onboarding keys
    "project_name",
    "project_slug",
    "summary",
    "surface",
    "deploy_target",
    # safe future discovery-enrichment keys
    "tenant_model",
    "workflow",
    "public_experience",
    "auth_model",
    "roles",
    "requires_i18n",
    "requires_scheduled_jobs",
    "mvp_scope",
    "non_goals",
}


def _normalize_string_list(values: list[str]) -> list[str]:
    normalized: list[str] = []
    for value in values:
        if not isinstance(value, str):
            continue

        text = value.strip()
        if text and text not in normalized:
            normalized.append(text)

    return normalized


def _merge_string_lists(existing: list[str], incoming: list[str]) -> list[str]:
    merged: list[str] = []

    for item in existing + incoming:
        if not isinstance(item, str):
            continue

        text = item.strip()
        if text and text not in merged:
            merged.append(text)

    return merged


def _allowed_answer_keys(spec: dict[str, Any]) -> set[str]:
    existing_answers = spec.get("answers", {})
    if not isinstance(existing_answers, dict):
        existing_answers = {}

    return DEFAULT_ALLOWED_ANSWER_KEYS | set(existing_answers.keys())


def _merge_answer_updates(
    spec: dict[str, Any],
    answer_updates: dict[str, Any],
) -> dict[str, Any]:
    existing_answers = spec.get("answers", {})
    if not isinstance(existing_answers, dict):
        existing_answers = {}

    merged_answers = dict(existing_answers)
    allowed_keys = _allowed_answer_keys(spec)

    for key, value in answer_updates.items():
        if not isinstance(key, str):
            continue

        key_text = key.strip()
        if not key_text or key_text not in allowed_keys:
            continue

        if value is None:
            continue

        merged_answers[key_text] = value

    return merged_answers


def _normalize_capability_candidates(
    candidates: list[str],
) -> list[str]:
    valid_capabilities = set(CAPABILITY_REGISTRY.keys())
    normalized: list[str] = []

    for candidate in candidates:
        if not isinstance(candidate, str):
            continue

        capability = candidate.strip()
        if not capability:
            continue

        if capability not in valid_capabilities:
            continue

        if capability not in normalized:
            normalized.append(capability)

    return normalized


def _merge_capabilities(
    existing_capabilities: list[str],
    capability_candidates: list[str],
) -> list[str]:
    merged: list[str] = []

    for capability in existing_capabilities + capability_candidates:
        if not isinstance(capability, str):
            continue

        capability_id = capability.strip()
        if not capability_id:
            continue

        if capability_id not in CAPABILITY_REGISTRY:
            continue

        if capability_id not in merged:
            merged.append(capability_id)

    return merged


def _merge_discovery_metadata(
    spec: dict[str, Any],
    result: AssistedDiscoveryResult,
) -> dict[str, Any]:
    existing = spec.get("discovery", {})
    if not isinstance(existing, dict):
        existing = {}

    merged = dict(existing)

    merged["assisted"] = True
    merged["assumptions"] = _merge_string_lists(
        existing.get("assumptions", []),
        result.assumptions,
    )
    merged["open_questions"] = _merge_string_lists(
        existing.get("open_questions", []),
        result.open_questions,
    )
    merged["additional_questions"] = _merge_string_lists(
        existing.get("additional_questions", []),
        result.additional_questions,
    )
    merged["capability_candidates"] = _merge_string_lists(
        existing.get("capability_candidates", []),
        result.capability_candidates,
    )

    return merged


def merge_assisted_discovery(
    spec: dict[str, Any],
    result: AssistedDiscoveryResult,
) -> dict[str, Any]:
    """
    Merge AI-assisted discovery output into the canonical spec conservatively.

    Safety rules:
    - do not rewrite archetype
    - do not rewrite archetype_data
    - do not rewrite stack
    - do not rewrite features
    - only enrich answers, capabilities, and discovery metadata
    """
    merged_spec = deepcopy(spec)

    merged_spec.setdefault("answers", {})
    merged_spec.setdefault("capabilities", [])

    merged_spec["answers"] = _merge_answer_updates(
        merged_spec,
        result.answer_updates,
    )

    normalized_candidates = _normalize_capability_candidates(
        result.capability_candidates
    )

    existing_capabilities = merged_spec.get("capabilities", [])
    if not isinstance(existing_capabilities, list):
        existing_capabilities = []

    merged_spec["capabilities"] = _merge_capabilities(
        existing_capabilities,
        normalized_candidates,
    )

    merged_spec["discovery"] = _merge_discovery_metadata(
        merged_spec,
        result,
    )

    return merged_spec