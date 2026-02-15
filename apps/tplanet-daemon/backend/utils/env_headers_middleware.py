import os
import socket


class EnvHeadersMiddleware:
    """
    Adds debug headers to every response so we can see which environment/backend
    actually served a request (useful when traffic routing is ambiguous).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        env = os.getenv("TPLANET_ENV", "unknown")
        backend_name = os.getenv("TPLANET_BACKEND_NAME", "")
        settings_module = os.getenv("DJANGO_SETTINGS_MODULE", "")

        tenant_id = ""
        try:
            t = getattr(request, "tenant", None)
            if t is not None:
                tenant_id = getattr(t, "tenant_id", "") or ""
        except Exception:
            tenant_id = ""

        response["X-TPlanet-Env"] = env
        if backend_name:
            response["X-TPlanet-Backend"] = backend_name
        if settings_module:
            response["X-TPlanet-Settings"] = settings_module
        response["X-TPlanet-Hostname"] = socket.gethostname()
        if tenant_id:
            response["X-TPlanet-Tenant"] = tenant_id

        # Request routing diagnostics (helps verify Worker -> origin -> backend propagation).
        try:
            response["X-TPlanet-Req-Host"] = request.get_host()
        except Exception:
            pass
        original_host = request.META.get("HTTP_X_TPLANET_ORIGINAL_HOST", "")
        if original_host:
            response["X-TPlanet-Original-Host"] = original_host

        return response
