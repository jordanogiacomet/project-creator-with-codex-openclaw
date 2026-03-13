def apply_scheduled_jobs(architecture, stories):

    architecture["components"].append(
        {
            "name": "worker",
            "technology": "background-worker",
            "role": "process scheduled jobs",
        }
    )

    architecture["decisions"].append(
        "Scheduled publishing requires a background worker"
    )

    stories.append(
        {
            "id": f"ST-{len(stories)+1:03}",
            "title": "Setup job worker",
            "description": "Create worker process responsible for scheduled publishing.",
        }
    )

    stories.append(
        {
            "id": f"ST-{len(stories)+1:03}",
            "title": "Implement publishing scheduler",
            "description": "Create scheduled publishing mechanism.",
        }
    )

    return architecture, stories