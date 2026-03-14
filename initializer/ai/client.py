# initializer/ai/client.py

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any

from openai import OpenAI


@dataclass(slots=True)
class AIClientConfig:
    model: str = "gpt-4.1-mini"
    api_key_env: str = "OPENAI_API_KEY"


class AIClient:
    """
    Thin wrapper around the OpenAI Responses API.

    Goals:
    - keep the transport details out of discovery_engine.py
    - centralize model/env configuration
    - return plain text or parsed JSON with predictable errors
    """

    def __init__(
        self,
        config: AIClientConfig | None = None,
        client: OpenAI | None = None,
    ) -> None:
        self.config = config or AIClientConfig()
        self.client = client or self._build_client()

    def _build_client(self) -> OpenAI:
        api_key = os.getenv(self.config.api_key_env)
        if not api_key:
            raise RuntimeError(
                f"Missing API key. Set {self.config.api_key_env} in the environment."
            )

        return OpenAI(api_key=api_key)

    def generate_text(
        self,
        *,
        instructions: str,
        input_text: str,
    ) -> str:
        response = self.client.responses.create(
            model=self.config.model,
            instructions=instructions,
            input=input_text,
        )

        output_text = response.output_text.strip()
        if not output_text:
            raise RuntimeError("AI response was empty.")

        return output_text

    def generate_json(
        self,
        *,
        instructions: str,
        input_text: str,
    ) -> dict[str, Any]:
        """
        Ask the model for JSON and parse it.

        We still validate/normalize the structure in the caller.
        """
        json_instructions = (
            f"{instructions}\n\n"
            "Return JSON only. Do not wrap it in markdown fences."
        )

        output_text = self.generate_text(
            instructions=json_instructions,
            input_text=input_text,
        )

        try:
            data = json.loads(output_text)
        except json.JSONDecodeError as exc:
            raise RuntimeError(
                f"AI returned invalid JSON: {exc}"
            ) from exc

        if not isinstance(data, dict):
            raise RuntimeError("AI JSON response must be an object.")

        return data