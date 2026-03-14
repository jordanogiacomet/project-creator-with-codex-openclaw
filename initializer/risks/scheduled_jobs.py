def risks_scheduled_jobs():

    return [
        {
            "title": "Background job reliability",
            "risk": "Scheduled publishing depends on reliable job execution.",
            "impact": "Content may not publish at the intended time.",
            "mitigation": "Use a durable queue system (Redis, RabbitMQ, or database-backed jobs).",
        },
        {
            "title": "Clock drift",
            "risk": "Worker and database clocks may diverge.",
            "impact": "Scheduled publishing may trigger too early or too late.",
            "mitigation": "Use UTC timestamps and centralized scheduling.",
        },
    ]