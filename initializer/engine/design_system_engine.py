"""Design System Engine.

Generates design-system guidance from product shape and structured discovery signals.

Updates:
- Concrete token values with full spacing scale, color palette, and Tailwind mapping
- Component specs with purpose and variant info
- Public-site components only when public-site is in reconciled capabilities
"""


def _get_decision_signals(spec):
    discovery = spec.get("discovery", {})
    if not isinstance(discovery, dict):
        return {}
    signals = discovery.get("decision_signals", {})
    if not isinstance(signals, dict):
        return {}
    return signals


def _append_unique(target, value):
    if value not in target:
        target.append(value)


def _append_unique_component(target, component):
    """Append a component dict, deduplicating by name."""
    name = component["name"] if isinstance(component, dict) else component
    for existing in target:
        existing_name = existing["name"] if isinstance(existing, dict) else existing
        if existing_name == name:
            return
    target.append(component)


def _has_public_site(capabilities):
    return "public-site" in capabilities


# -------------------------------------------------------------------
# Concrete token palettes
# -------------------------------------------------------------------

def _base_tokens():
    """Base design tokens applicable to all project shapes."""
    return {
        "spacing": {
            "xs": "4px",
            "sm": "8px",
            "md": "16px",
            "lg": "24px",
            "xl": "32px",
            "2xl": "48px",
        },
        "border_radius": {
            "sm": "4px",
            "md": "6px",
            "lg": "12px",
            "full": "9999px",
        },
        "font": {
            "primary": "Inter",
            "secondary": "system-ui",
            "mono": "JetBrains Mono, monospace",
        },
        "font_size": {
            "xs": "12px",
            "sm": "14px",
            "base": "16px",
            "lg": "18px",
            "xl": "20px",
            "2xl": "24px",
            "3xl": "30px",
        },
        "line_height": {
            "tight": "1.25",
            "normal": "1.5",
            "relaxed": "1.75",
        },
        "shadow": {
            "sm": "0 1px 2px rgba(0,0,0,0.05)",
            "md": "0 4px 6px rgba(0,0,0,0.07)",
            "lg": "0 10px 15px rgba(0,0,0,0.1)",
        },
        "transition": {
            "fast": "150ms ease",
            "normal": "200ms ease",
            "slow": "300ms ease",
        },
        "tailwind_mapping": "Use Tailwind utility classes directly. Only use custom CSS for complex animations or layouts not expressible with utilities.",
    }


def _operational_colors():
    """Color palette for internal/operational apps (backoffice, work organizer)."""
    return {
        "primary": "blue-600",
        "primary_hover": "blue-700",
        "background": "gray-50",
        "surface": "white",
        "text": "gray-900",
        "text_secondary": "gray-600",
        "muted": "gray-500",
        "border": "gray-200",
        "border_strong": "gray-300",
        "destructive": "red-600",
        "success": "green-600",
        "warning": "amber-500",
        "info": "blue-500",
        "focus_ring": "blue-500/50",
    }


def _editorial_colors():
    """Color palette for editorial/content platforms."""
    return {
        "primary": "indigo-600",
        "primary_hover": "indigo-700",
        "background": "gray-50",
        "surface": "white",
        "text": "gray-900",
        "text_secondary": "gray-600",
        "muted": "gray-400",
        "border": "gray-200",
        "border_strong": "gray-300",
        "destructive": "red-600",
        "success": "emerald-600",
        "warning": "amber-500",
        "info": "sky-500",
        "draft": "gray-400",
        "in_review": "amber-500",
        "published": "emerald-600",
        "archived": "gray-500",
        "focus_ring": "indigo-500/50",
    }


def _marketplace_colors():
    """Color palette for marketplace / e-commerce."""
    return {
        "primary": "violet-600",
        "primary_hover": "violet-700",
        "background": "gray-50",
        "surface": "white",
        "text": "gray-900",
        "text_secondary": "gray-600",
        "muted": "gray-500",
        "border": "gray-200",
        "destructive": "red-600",
        "success": "green-600",
        "warning": "amber-500",
        "info": "blue-500",
        "accent": "orange-500",
        "focus_ring": "violet-500/50",
    }


def _default_colors():
    """Neutral color palette for generic or unknown shapes."""
    return {
        "primary": "blue-600",
        "primary_hover": "blue-700",
        "background": "white",
        "surface": "white",
        "text": "gray-900",
        "text_secondary": "gray-600",
        "muted": "gray-500",
        "border": "gray-200",
        "destructive": "red-600",
        "success": "green-600",
        "warning": "amber-500",
        "info": "blue-500",
        "focus_ring": "blue-500/50",
    }


# -------------------------------------------------------------------
# Component helpers
# -------------------------------------------------------------------

def _component(name, purpose, variants=None):
    entry = {"name": name, "purpose": purpose}
    if variants:
        entry["variants"] = variants
    return entry


# -------------------------------------------------------------------
# Main generator
# -------------------------------------------------------------------

def generate_design_system(spec):
    capabilities = spec.get("capabilities", [])
    features = spec.get("features", [])
    signals = _get_decision_signals(spec)

    needs_cms = signals.get("needs_cms")
    primary_audience = signals.get("primary_audience")
    app_shape = signals.get("app_shape")

    has_public = _has_public_site(capabilities)

    philosophy: list[str] = []
    components: list = []
    patterns: list[str] = []
    recommendations: list[str] = []

    # --- Tokens ---
    tokens = _base_tokens()

    if app_shape in ("internal-work-organizer", "backoffice") or primary_audience == "internal_teams":
        tokens["colors"] = _operational_colors()
    elif app_shape == "content-platform" or needs_cms is True:
        tokens["colors"] = _editorial_colors()
    elif app_shape in ("marketplace", "ecommerce"):
        tokens["colors"] = _marketplace_colors()
    else:
        tokens["colors"] = _default_colors()

    # --- Philosophy & Components by shape ---

    if app_shape == "internal-work-organizer" or primary_audience == "internal_teams":
        _append_unique(philosophy, "Favor workflow clarity and fast task-oriented navigation.")
        _append_unique(philosophy, "Optimize for dense, readable operational interfaces.")
        _append_unique(philosophy, "Reduce cognitive load for recurring internal workflows.")

        for comp in [
            _component("AppShell", "Main application layout with sidebar and content area", ["collapsed-sidebar", "expanded-sidebar"]),
            _component("SidebarNav", "Primary navigation sidebar with sections and links", ["collapsed", "expanded"]),
            _component("TopBar", "Top navigation bar with breadcrumbs and user menu"),
            _component("Button", "Primary action trigger", ["primary", "secondary", "destructive", "ghost", "icon-only"]),
            _component("Input", "Text input field", ["default", "error", "disabled"]),
            _component("Textarea", "Multi-line text input"),
            _component("Select", "Dropdown selection", ["single", "multi", "searchable"]),
            _component("Modal", "Overlay dialog for confirmations and forms", ["sm", "md", "lg"]),
            _component("Toast", "Transient notification message", ["success", "error", "warning", "info"]),
            _component("Dropdown", "Action menu triggered by click"),
            _component("DataTable", "Tabular data display with sorting, filtering, pagination", ["compact", "default", "expanded"]),
            _component("FilterBar", "Horizontal filter controls for data views"),
            _component("StatusBadge", "Visual status indicator", ["draft", "active", "completed", "blocked", "overdue"]),
            _component("WorkItemCard", "Compact card for work item in list or board view"),
            _component("DetailDrawer", "Slide-out panel for item details without leaving context"),
            _component("DatePicker", "Date/time selection input"),
            _component("AssigneeSelect", "User selection for assignment with avatar"),
        ]:
            _append_unique_component(components, comp)

        _append_unique(patterns, "Use clear status states and visible progress markers.")
        _append_unique(patterns, "Keep common actions close to work-item context.")
        _append_unique(patterns, "Use optimistic UI carefully for low-risk edits.")
        _append_unique(patterns, "Support keyboard-friendly workflows where practical.")

    else:
        _append_unique(philosophy, "Favor clarity and content-first layout.")
        _append_unique(philosophy, "Use consistent spacing scale and typography hierarchy.")
        _append_unique(philosophy, "Minimize cognitive load across the application experience.")

        for comp in [
            _component("Button", "Primary action trigger", ["primary", "secondary", "destructive", "ghost"]),
            _component("Input", "Text input field", ["default", "error", "disabled"]),
            _component("Textarea", "Multi-line text input"),
            _component("Select", "Dropdown selection"),
            _component("Modal", "Overlay dialog", ["sm", "md", "lg"]),
            _component("Toast", "Transient notification", ["success", "error", "warning", "info"]),
            _component("Dropdown", "Action menu"),
            _component("NavigationBar", "Primary navigation bar"),
            _component("ContentCard", "Card for displaying content items in lists"),
        ]:
            _append_unique_component(components, comp)

        _append_unique(patterns, "Provide clear status indicators for important workflow states.")
        _append_unique(patterns, "Use progressive disclosure for advanced options.")

    if needs_cms is True:
        for comp in [
            _component("RichTextEditor", "Block-based rich text editing for content"),
            _component("MediaPicker", "Media selection and upload dialog"),
            _component("ContentList", "Filterable list of content items with status"),
            _component("ContentStatusBadge", "Visual indicator for content workflow state", ["draft", "in_review", "published", "archived"]),
            _component("PublishControls", "Publish, schedule, and unpublish action group"),
        ]:
            _append_unique_component(components, comp)

        _append_unique(patterns, "Preview mode should match rendered output closely.")
        _append_unique(patterns, "Use explicit draft and publish states for editorial workflows.")

    if has_public:
        for comp in [
            _component("NavigationBar", "Site-wide navigation bar for public pages"),
            _component("HeroBlock", "Full-width hero section for landing pages"),
            _component("Footer", "Site-wide footer with links and metadata"),
        ]:
            _append_unique_component(components, comp)

    if "i18n" in capabilities or signals.get("needs_i18n") is True:
        _append_unique(patterns, "Design text containers to handle locale expansion gracefully.")
        _append_unique(patterns, "Ensure locale switching is easy to find and clearly reflected in the UI.")

    if "notifications" in features:
        _append_unique_component(components, _component(
            "NotificationCenter", "Notification inbox with read/unread state and actions",
        ))
        _append_unique(patterns, "Use notifications for meaningful events, not routine noise.")

    _append_unique(recommendations, "Use Tailwind CSS for styling — map tokens to Tailwind config or utility classes directly.")
    _append_unique(recommendations, "Maintain a shared component library in src/components/ui/.")
    _append_unique(recommendations, "Document component usage with prop types and examples.")
    _append_unique(recommendations, "Follow WAI-ARIA patterns for interactive components (modals, dropdowns, tabs).")

    return {
        "philosophy": philosophy,
        "tokens": tokens,
        "components": components,
        "patterns": patterns,
        "recommendations": recommendations,
    }