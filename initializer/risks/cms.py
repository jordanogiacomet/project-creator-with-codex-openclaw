def risks_cms():

    return [
        {
            "title": "Content schema evolution",
            "risk": "Content models may evolve after production launch.",
            "impact": "Database migrations and data compatibility issues.",
            "mitigation": "Introduce schema versioning and migration strategy.",
        },
        {
            "title": "Media storage growth",
            "risk": "Media assets can grow quickly.",
            "impact": "Local storage may become insufficient.",
            "mitigation": "Use S3-compatible storage with lifecycle rules.",
        },
    ]