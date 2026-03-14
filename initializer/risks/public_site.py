def risks_public_site():

    return [
        {
            "title": "Traffic spikes",
            "risk": "Public sites may experience sudden traffic increases.",
            "impact": "Application may become unavailable.",
            "mitigation": "Use CDN caching and edge delivery.",
        },
        {
            "title": "API coupling",
            "risk": "Frontend tightly coupled to CMS API.",
            "impact": "CMS downtime affects public site.",
            "mitigation": "Introduce caching layer or static generation.",
        },
    ]