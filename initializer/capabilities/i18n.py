def apply_i18n(architecture, stories):

    architecture["decisions"].append(
        "Content model must support locale-aware fields"
    )

    stories.append(
        {
            "id": f"ST-{len(stories)+1:03}",
            "title": "Add locale support",
            "description": "Add locale fields to content models.",
        }
    )

    stories.append(
        {
            "id": f"ST-{len(stories)+1:03}",
            "title": "Implement locale routing",
            "description": "Add locale-aware routing in frontend.",
        }
    )

    return architecture, stories