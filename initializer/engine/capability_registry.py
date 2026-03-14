from initializer.capabilities.cms import apply_cms
from initializer.capabilities.public_site import apply_public_site
from initializer.capabilities.scheduled_jobs import apply_scheduled_jobs
from initializer.capabilities.i18n import apply_i18n


CAPABILITY_REGISTRY = {
    "cms": apply_cms,
    "public-site": apply_public_site,
    "scheduled-jobs": apply_scheduled_jobs,
    "i18n": apply_i18n,
}