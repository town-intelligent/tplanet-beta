"""Tenant detection middleware for Django."""
import logging
from typing import Callable, Dict, Optional

from django.conf import settings
from django.http import HttpRequest, HttpResponse

from django_multi_tenant.config.loader import TenantConfigLoader
from django_multi_tenant.middleware.tenant_context import TenantInfo, set_current_tenant

logger = logging.getLogger(__name__)


class TenantMiddleware:
    """Middleware that identifies the current tenant and sets it in the context."""

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]):
        self.get_response = get_response
        self.config_loader = TenantConfigLoader()
        self._load_config()

    def _load_config(self) -> None:
        """Load tenant configuration from settings."""
        multi_tenant_settings = getattr(settings, "MULTI_TENANT", {})
        config_path = multi_tenant_settings.get("CONFIG_PATH")
        if config_path:
            self.config_loader.load_from_file(config_path)

        self.default_tenant_id = multi_tenant_settings.get("DEFAULT_TENANT", "default")
        self.header_name = multi_tenant_settings.get("HEADER_NAME", "X-Tenant-ID")
        self._build_lookup_tables()

    def _build_lookup_tables(self) -> None:
        """Build domain and subdomain lookup tables."""
        self.domain_to_tenant: Dict[str, str] = {}
        self.subdomain_to_tenant: Dict[str, str] = {}

        for tenant_id, config in self.config_loader.tenants.items():
            for domain in config.get("domains", []):
                self.domain_to_tenant[domain.lower()] = tenant_id
                parts = domain.split(".")
                if len(parts) >= 2:
                    subdomain = parts[0].lower()
                    if subdomain not in ("www", "api"):
                        self.subdomain_to_tenant[subdomain] = tenant_id

    def __call__(self, request: HttpRequest) -> HttpResponse:
        tenant_info = self._resolve_tenant(request)
        set_current_tenant(tenant_info)
        request.tenant = tenant_info

        try:
            response = self.get_response(request)
        finally:
            set_current_tenant(None)
        return response

    def _resolve_tenant(self, request: HttpRequest) -> Optional[TenantInfo]:
        """Resolve tenant from request (header → domain → subdomain → DB → default)."""
        host = request.get_host().split(":")[0].lower()

        # If routed through the Cloudflare Worker, we may be hitting an origin hostname
        # (dev.4impact.cc / stable.4impact.cc) while the original tenant host is
        # {tenantId}.sechome.cc. Trust the original host only when the current host is
        # an origin host to avoid letting arbitrary clients spoof tenants via headers.
        original_host = request.META.get("HTTP_X_TPLANET_ORIGINAL_HOST")
        if original_host:
            original_host = original_host.split(":")[0].lower()
            if host.endswith(".4impact.cc") and original_host.endswith(".sechome.cc"):
                host = original_host

        # Header tenant id (can be injected by proxies). For tenant sites under `*.sechome.cc`,
        # ignore a mismatched header and prefer hostname/subdomain resolution.
        header_key = f"HTTP_{self.header_name.upper().replace('-', '_')}"
        tenant_id = request.META.get(header_key)
        if tenant_id:
            tenant_id = str(tenant_id).strip().lower()
            subdomain_hint = host.split(".")[0]
            if host.endswith(".sechome.cc") and tenant_id != subdomain_hint:
                tenant_id = None

        if tenant_id:
            # YAML first
            if tenant_id in self.config_loader.tenants:
                return self._create_tenant_info(tenant_id)
            # DB-only tenants (created via SiteWizard)
            db_tenant = self._resolve_db_tenant(tenant_id)
            if db_tenant:
                return db_tenant

        # Check full domain match
        if host in self.domain_to_tenant:
            return self._create_tenant_info(self.domain_to_tenant[host])

        # Check subdomain
        subdomain = host.split(".")[0]
        if subdomain in self.subdomain_to_tenant:
            return self._create_tenant_info(self.subdomain_to_tenant[subdomain])

        # Check DB-only tenant by subdomain (e.g., dev.sechome.cc -> tenant_id=dev)
        db_tenant = self._resolve_db_tenant(subdomain)
        if db_tenant:
            logger.info(f"Tenant resolved from DB subdomain {subdomain}: {db_tenant.tenant_id}")
            return db_tenant

        # Fall back to default
        if self.default_tenant_id and self.default_tenant_id in self.config_loader.tenants:
            return self._create_tenant_info(self.default_tenant_id)

        logger.warning(f"No tenant found for host: {host}")
        return None

    def _resolve_db_tenant(self, tenant_id: str) -> Optional[TenantInfo]:
        """Resolve a DB-only tenant (not in YAML). Uses default tenant's database."""
        try:
            from django_multi_tenant.models import TenantConfig
            db_config = TenantConfig.objects.filter(
                tenant_id=tenant_id, is_active=True
            ).first()
            if not db_config:
                return None
            # DB-only tenants share the default tenant's database
            default_config = self.config_loader.tenants.get(self.default_tenant_id, {})
            default_db = default_config.get("database", {}).get("alias", self.default_tenant_id)

            # Provide platform-level config for DB-only tenants.
            # Prefer multi-tenant template if present, fall back to default tenant config.
            template_tenant_id = (
                "multi-tenant"
                if "multi-tenant" in self.config_loader.tenants
                else self.default_tenant_id
            )
            template_config = self.config_loader.tenants.get(template_tenant_id, {})
            return TenantInfo(
                tenant_id=tenant_id,
                name=db_config.name,
                database=default_db,
                config={
                    **template_config,
                    "name": db_config.name,
                    "hosters": db_config.hosters or template_config.get("hosters", []),
                },
            )
        except Exception as e:
            logger.warning(f"Failed to resolve DB tenant '{tenant_id}': {e}")
            return None

    def _create_tenant_info(self, tenant_id: str) -> TenantInfo:
        """Create TenantInfo from YAML configuration."""
        config = self.config_loader.tenants.get(tenant_id, {})
        database_config = config.get("database", {})

        return TenantInfo(
            tenant_id=tenant_id,
            name=config.get("name", tenant_id),
            database=database_config.get("alias", tenant_id),
            config=config,
        )
