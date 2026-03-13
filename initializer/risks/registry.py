from initializer.risks.scheduled_jobs import risks_scheduled_jobs
from initializer.risks.public_site import risks_public_site
from initializer.risks.i18n import risks_i18n
from initializer.risks.cms import risks_cms


RISK_REGISTRY = {
    "scheduled-jobs": risks_scheduled_jobs,
    "public-site": risks_public_site,
    "i18n": risks_i18n,
    "cms": risks_cms,
}