from copy import deepcopy
from initializer.engine.capability_registry import CAPABILITY_REGISTRY


def detect_capabilities(spec):

    answers = spec.get("answers", {})

    capabilities = []

    if answers.get("public_site"):
        capabilities.append("public-site")

    if answers.get("scheduled_publishing"):
        capabilities.append("scheduled-jobs")

    if answers.get("localization"):
        capabilities.append("i18n")

    capabilities.append("cms")

    return capabilities


def apply_capabilities(spec):

    capabilities = detect_capabilities(spec)

    architecture = deepcopy(spec["architecture"])
    stories = deepcopy(spec["stories"])

    for capability in capabilities:

        if capability not in CAPABILITY_REGISTRY:
            continue

        handler = CAPABILITY_REGISTRY[capability]

        architecture, stories = handler(architecture, stories)

    return architecture, stories, capabilities