def apply_cms(architecture, stories):

    architecture["decisions"].append(
        "Payload CMS will manage editorial content."
    )

    return architecture, stories