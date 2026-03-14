from initializer.risks.registry import RISK_REGISTRY


def analyze_risks(spec):

    capabilities = spec.get("capabilities", [])

    risks = []

    for capability in capabilities:

        if capability not in RISK_REGISTRY:
            continue

        provider = RISK_REGISTRY[capability]

        risks.extend(provider())

    return risks