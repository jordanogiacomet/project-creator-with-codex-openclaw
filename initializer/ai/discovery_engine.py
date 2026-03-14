# initializer/ai/discovery_engine.py

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any

from initializer.ai.client import AIClient, AIClientConfig


@dataclass(slots=True)
class AssistedDiscoveryResult:
    """
    Structured output from the AI-assisted discovery pass.

    Important:
    - this result does NOT directly replace the canonical spec
    - callers should merge these fields deliberately and conservatively
    """

    additional_questions: list[str] = field(default_factory=list)
    answer_updates: dict[str, Any] = field(default_factory=dict)
    capability_candidates: list[str] = field(default_factory=list)
    assumptions: list[str] = field(default_factory=list)
    open_questions: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "additional_questions": self.additional_questions,
            "answer_updates": self.answer_updates,
            "capability_candidates": self.capability_candidates,
            "assumptions": self.assumptions,
            "open_questions": self.open_questions,
        }


def build_discovery_payload(spec: dict[str, Any]) -> dict[str, Any]:
    """
    Build a reduced, explicit payload for the AI discovery pass.

    We intentionally send only the fields needed for clarification and
    enrichment. The model should not be treated as the source of truth
    for the full canonical spec.
    """
    return {
        "prompt": spec.get("prompt"),
        "archetype": spec.get("archetype"),
        "archetype_data": {
            "id": spec.get("archetype_data", {}).get("id"),
            "name": spec.get("archetype_data", {}).get("name"),
            "features": spec.get("archetype_data", {}).get("features", []),
            "capabilities": spec.get("archetype_data", {}).get("capabilities", []),
            "stack": spec.get("archetype_data", {}).get("stack", {}),
        },
        "stack": spec.get("stack", {}),
        "features": spec.get("features", []),
        "capabilities": spec.get("capabilities", []),
        "answers": spec.get("answers", {}),
    }


def build_discovery_instructions() -> str:
    return (
        "You are assisting a PRD-driven project initializer.\n"
        "\n"
        "Your job is to enrich discovery safely without replacing the canonical spec.\n"
        "\n"
        "Rules:\n"
        "- Keep archetype, features, capabilities, and answers conceptually separate.\n"
        "- Do not rewrite the archetype.\n"
        "- Do not invent implementation details without evidence.\n"
        "- Prefer explicit uncertainty over confident guessing.\n"
        "- Only propose answer_updates when they are strongly implied by the input.\n"
        "- capability_candidates must be short canonical IDs when possible.\n"
        "- additional_questions should be high-value clarifying questions only.\n"
        "- Return at most 5 additional questions.\n"
        "- Return JSON only.\n"
        "\n"
        "Expected JSON object keys:\n"
        "- additional_questions: string[]\n"
        "- answer_updates: object\n"
        "- capability_candidates: string[]\n"
        "- assumptions: string[]\n"
        "- open_questions: string[]\n"
    )


def _normalize_string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []

    normalized: list[str] = []
    for item in value:
        if isinstance(item, str):
            text = item.strip()
            if text and text not in normalized:
                normalized.append(text)
    return normalized


def _normalize_answer_updates(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        return {}

    normalized: dict[str, Any] = {}
    for key, item in value.items():
        if not isinstance(key, str):
            continue

        key_text = key.strip()
        if not key_text:
            continue

        normalized[key_text] = item

    return normalized


def normalize_discovery_result(data: dict[str, Any]) -> AssistedDiscoveryResult:
    return AssistedDiscoveryResult(
        additional_questions=_normalize_string_list(data.get("additional_questions")),
        answer_updates=_normalize_answer_updates(data.get("answer_updates")),
        capability_candidates=_normalize_string_list(data.get("capability_candidates")),
        assumptions=_normalize_string_list(data.get("assumptions")),
        open_questions=_normalize_string_list(data.get("open_questions")),
    )


def run_assisted_discovery(
    spec: dict[str, Any],
    *,
    client: AIClient | None = None,
) -> AssistedDiscoveryResult:
    """
    Run the AI-assisted discovery pass.

    This uses gpt-4.1-mini intentionally for the discovery layer,
    keeping this pass cheaper/lighter than the core deterministic pipeline.
    """
    ai_client = client or AIClient(
        AIClientConfig(model="gpt-4.1-mini")
    )

    payload = build_discovery_payload(spec)
    instructions = build_discovery_instructions()

    response_data = ai_client.generate_json(
        instructions=instructions,
        input_text=json.dumps(payload, indent=2, sort_keys=True),
    )

    return normalize_discovery_result(response_data)