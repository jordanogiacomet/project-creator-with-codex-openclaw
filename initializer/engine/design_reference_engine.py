"""Design Reference Engine.

Analyzes design reference images via OpenAI Vision API and extracts
design tokens: colors, layout patterns, typography hints, and
detected components.

Usage:
    from initializer.engine.design_reference_engine import analyze_design_references
    result = analyze_design_references("/path/to/reference-images/")

The result is a dict with:
- colors: extracted color palette mapped to Tailwind values
- layout: detected layout patterns (sidebar, topbar, grid, etc.)
- typography: font and size observations
- components: detected UI component types
- raw_analysis: the full AI analysis text for debugging

This engine requires OPENAI_API_KEY in the environment.
"""

from __future__ import annotations

import base64
import json
import os
from pathlib import Path
from typing import Any

SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}

EXTRACTION_PROMPT = """You are a design system analyst. You will receive one or more screenshots or mockups of a web application design.

Analyze the images and extract the following design tokens. Return ONLY valid JSON, no markdown fences.

{
  "colors": {
    "primary": "<tailwind color class or hex, e.g. blue-600 or #2563EB>",
    "primary_hover": "<slightly darker shade>",
    "background": "<page background color>",
    "surface": "<card/panel background>",
    "text": "<primary text color>",
    "text_secondary": "<secondary/muted text color>",
    "muted": "<disabled/placeholder color>",
    "border": "<border color>",
    "destructive": "<error/delete color>",
    "success": "<success/positive color>",
    "warning": "<warning color>",
    "info": "<info/link color>",
    "accent": "<accent color if visible, otherwise omit>",
    "focus_ring": "<focus ring color with opacity, e.g. blue-500/50>"
  },
  "layout": {
    "pattern": "<sidebar-nav | topbar-only | sidebar-plus-topbar | dashboard-grid | landing-page | other>",
    "sidebar_width": "<estimated width in px if sidebar present, e.g. 240px>",
    "content_max_width": "<estimated content max-width, e.g. 1200px>",
    "grid_columns": <number of columns in main content grid if visible, e.g. 3>,
    "card_style": "<rounded | sharp | elevated | flat>",
    "density": "<compact | default | spacious>",
    "observations": ["<any other layout observations>"]
  },
  "typography": {
    "primary_font": "<detected or closest match font name, e.g. Inter>",
    "heading_style": "<bold | semibold | medium>",
    "heading_sizes": {
      "h1": "<estimated size, e.g. 30px>",
      "h2": "<estimated size, e.g. 24px>",
      "h3": "<estimated size, e.g. 20px>"
    },
    "body_size": "<estimated body text size, e.g. 14px or 16px>",
    "monospace_visible": <true or false>,
    "observations": ["<any other typography observations>"]
  },
  "components": [
    "<list of UI components visibly present, e.g. DataTable, StatusBadge, SidebarNav, TopBar, Card, Modal, FilterBar, Avatar, Breadcrumbs, Tabs, etc.>"
  ],
  "overall_style": "<a 1-sentence description of the overall visual style, e.g. 'Clean, minimal enterprise dashboard with subtle blue accents and compact data tables'>"
}

Rules:
- Use Tailwind color names when possible (e.g., blue-600, gray-50, slate-900). Fall back to hex if the color doesn't match a standard Tailwind shade.
- For fonts, name the closest well-known web font (Inter, Roboto, SF Pro, Poppins, etc.).
- For layout, describe what you actually see, not what you imagine.
- For components, only list components you can clearly see in the images.
- If multiple images show different pages, combine the analysis into one unified design system.
- If you cannot determine a value, omit that key rather than guessing wildly.
"""


def _load_images(reference_path: str | Path) -> list[dict[str, Any]]:
    """Load all supported images from a directory or single file path.

    Returns a list of dicts with:
    - path: str
    - base64: str (base64-encoded image data)
    - media_type: str (e.g., image/png)
    """
    path = Path(reference_path).expanduser()
    images: list[dict[str, Any]] = []

    if path.is_file():
        files = [path]
    elif path.is_dir():
        files = sorted(
            f for f in path.iterdir()
            if f.is_file() and f.suffix.lower() in SUPPORTED_EXTENSIONS
        )
    else:
        return images

    for file in files:
        try:
            data = file.read_bytes()
            b64 = base64.standard_b64encode(data).decode("ascii")

            suffix = file.suffix.lower()
            media_types = {
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".webp": "image/webp",
                ".gif": "image/gif",
            }
            media_type = media_types.get(suffix, "image/png")

            images.append({
                "path": str(file),
                "base64": b64,
                "media_type": media_type,
            })
        except Exception as exc:
            print(f"  Warning: could not load {file}: {exc}")

    return images


def _build_vision_messages(images: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Build OpenAI vision API messages with image content."""
    content: list[dict[str, Any]] = []

    content.append({
        "type": "text",
        "text": f"Analyze these {len(images)} design reference image(s) and extract the design system tokens.",
    })

    for img in images:
        content.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:{img['media_type']};base64,{img['base64']}",
                "detail": "high",
            },
        })

    return [{"role": "user", "content": content}]


def _call_vision_api(messages: list[dict[str, Any]], model: str = "gpt-4.1-mini") -> str:
    """Call OpenAI vision API and return the response text."""
    from openai import OpenAI

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is required for design reference analysis. "
            "Set it in your environment."
        )

    client = OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": EXTRACTION_PROMPT},
            *messages,
        ],
        max_tokens=4096,
    )

    return response.choices[0].message.content.strip()


def _parse_extraction(raw_text: str) -> dict[str, Any]:
    """Parse the AI extraction response into a structured dict."""
    # Strip markdown fences if present
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        # Remove first and last lines (fences)
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        return {
            "colors": {},
            "layout": {},
            "typography": {},
            "components": [],
            "overall_style": "",
            "parse_error": True,
            "raw_text": raw_text,
        }

    return data


def analyze_design_references(
    reference_path: str | Path,
    model: str = "gpt-4.1-mini",
) -> dict[str, Any]:
    """Analyze design reference images and extract design tokens.

    Args:
        reference_path: Path to a directory of images or a single image file.
        model: OpenAI model to use for vision analysis.

    Returns:
        Dict with colors, layout, typography, components, overall_style.
    """
    images = _load_images(reference_path)

    if not images:
        print(f"  No supported images found in {reference_path}")
        print(f"  Supported formats: {', '.join(sorted(SUPPORTED_EXTENSIONS))}")
        return {}

    print(f"  Analyzing {len(images)} design reference(s)...")
    for img in images:
        print(f"    - {Path(img['path']).name}")

    messages = _build_vision_messages(images)
    raw_text = _call_vision_api(messages, model=model)
    result = _parse_extraction(raw_text)
    result["raw_analysis"] = raw_text
    result["source_images"] = [img["path"] for img in images]

    return result


def merge_reference_into_design_system(
    design_system: dict[str, Any],
    reference: dict[str, Any],
) -> dict[str, Any]:
    """Merge extracted design reference tokens into the existing design system.

    Reference values override generated defaults.
    """
    if not reference:
        return design_system

    tokens = design_system.setdefault("tokens", {})

    # --- Colors ---
    ref_colors = reference.get("colors", {})
    if ref_colors:
        existing_colors = tokens.setdefault("colors", {})
        for key, value in ref_colors.items():
            if value:  # Only override with non-empty values
                existing_colors[key] = value
        tokens["colors"] = existing_colors

    # --- Typography ---
    ref_typography = reference.get("typography", {})
    if ref_typography:
        font = tokens.setdefault("font", {})
        font_size = tokens.setdefault("font_size", {})

        primary_font = ref_typography.get("primary_font")
        if primary_font:
            font["primary"] = primary_font

        heading_sizes = ref_typography.get("heading_sizes", {})
        if heading_sizes:
            for key, value in heading_sizes.items():
                if key == "h1":
                    font_size["3xl"] = value
                elif key == "h2":
                    font_size["2xl"] = value
                elif key == "h3":
                    font_size["xl"] = value

        body_size = ref_typography.get("body_size")
        if body_size:
            font_size["base"] = body_size

    # --- Layout (stored as design_system.layout, not in tokens) ---
    ref_layout = reference.get("layout", {})
    if ref_layout:
        design_system["layout"] = ref_layout

    # --- Components ---
    ref_components = reference.get("components", [])
    if ref_components:
        existing_components = design_system.get("components", [])
        existing_names = set()
        for comp in existing_components:
            if isinstance(comp, dict):
                existing_names.add(comp.get("name", ""))
            else:
                existing_names.add(comp)

        for comp_name in ref_components:
            if comp_name not in existing_names:
                existing_components.append({
                    "name": comp_name,
                    "purpose": f"Detected in design reference",
                })
                existing_names.add(comp_name)

        design_system["components"] = existing_components

    # --- Overall style ---
    overall_style = reference.get("overall_style")
    if overall_style:
        design_system["reference_style"] = overall_style

    # --- Store source metadata ---
    design_system["design_reference"] = {
        "source_images": reference.get("source_images", []),
        "overall_style": overall_style or "",
        "extracted_layout": ref_layout,
    }

    return design_system