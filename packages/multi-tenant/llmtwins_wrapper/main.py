# llmtwins_wrapper/main.py
"""
LLMTwins Tenant Wrapper

A lightweight proxy that adds multi-tenant support to LLMTwins
without modifying the original source code.

Features:
- Extracts tenant from X-Tenant-ID header
- Rewrites session_id with tenant prefix
- Proxies all requests to LLMTwins
- Supports streaming responses
"""

import httpx
import json
import logging
from typing import Optional
from fastapi import FastAPI, Request, HTTPException, Header
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from config import config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="LLMTwins Tenant Wrapper",
    description="Multi-tenant proxy for LLMTwins",
    version="0.1.0",
)

# CORS - mirror LLMTwins settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_tenant(tenant_header: Optional[str]) -> str:
    """Extract and validate tenant ID"""
    tenant = (tenant_header or "").strip()

    if not tenant:
        tenant = config.default_tenant

    # Validate tenant if whitelist is configured
    if config.valid_tenants and tenant not in config.valid_tenants:
        raise HTTPException(
            status_code=403,
            detail=f"Invalid tenant: {tenant}"
        )

    return tenant


def rewrite_session_id(session_id: str, tenant: str) -> str:
    """Add tenant prefix to session_id"""
    if not session_id:
        return session_id

    # Already has tenant prefix?
    if session_id.startswith(f"{tenant}{config.tenant_separator}"):
        return session_id

    return f"{tenant}{config.tenant_separator}{session_id}"


def extract_original_session_id(prefixed_session_id: str, tenant: str) -> str:
    """Remove tenant prefix from session_id"""
    prefix = f"{tenant}{config.tenant_separator}"
    if prefixed_session_id.startswith(prefix):
        return prefixed_session_id[len(prefix):]
    return prefixed_session_id


async def proxy_request(
    request: Request,
    tenant: str,
    path: str,
    rewrite_body: bool = True,
    rewrite_response: bool = True,
):
    """Proxy request to LLMTwins with tenant session rewriting"""

    # Build upstream URL
    upstream_url = f"{config.llmtwins_base_url}{path}"

    # Get query params and rewrite session_id if present
    query_params = dict(request.query_params)
    if "session_id" in query_params:
        query_params["session_id"] = rewrite_session_id(
            query_params["session_id"], tenant
        )

    # Get body and rewrite session fields
    body = None
    if request.method in ("POST", "PUT", "PATCH"):
        try:
            body = await request.json()
            if rewrite_body and isinstance(body, dict):
                # Rewrite common session ID fields
                for field in ("session_id", "sessionId", "sid"):
                    if field in body and body[field]:
                        body[field] = rewrite_session_id(body[field], tenant)
        except json.JSONDecodeError:
            body = await request.body()

    # Prepare headers (forward most, add tenant info)
    headers = {}
    for key, value in request.headers.items():
        key_lower = key.lower()
        if key_lower not in ("host", "content-length"):
            headers[key] = value

    # Add tenant header for downstream (in case LLMTwins wants it)
    headers[config.tenant_header] = tenant
    headers["X-Tenant-Wrapper"] = "true"

    logger.info(f"[{tenant}] Proxying {request.method} {path}")

    # Check if streaming is requested
    is_streaming = False
    if isinstance(body, dict):
        is_streaming = body.get("stream", False)

    if is_streaming:
        # Important: the StreamingResponse iterator runs after this function returns.
        # Don't use an httpx client context manager that would close before iteration.
        async def stream_generator():
            async with httpx.AsyncClient(timeout=config.upstream_timeout) as client:
                async with client.stream(
                    request.method,
                    upstream_url,
                    params=query_params,
                    json=body if isinstance(body, dict) else None,
                    content=body if isinstance(body, bytes) else None,
                    headers=headers,
                ) as response:
                    async for chunk in response.aiter_bytes():
                        if rewrite_response:
                            chunk = rewrite_response_session(chunk, tenant)
                        yield chunk

        return StreamingResponse(stream_generator(), media_type="application/x-ndjson")

    # Non-streaming response
    async with httpx.AsyncClient(timeout=config.upstream_timeout) as client:
        response = await client.request(
            request.method,
            upstream_url,
            params=query_params,
            json=body if isinstance(body, dict) else None,
            content=body if isinstance(body, bytes) else None,
            headers=headers,
        )

    # Parse and optionally rewrite response
    try:
        resp_data = response.json()
        if rewrite_response and isinstance(resp_data, dict):
            resp_data = rewrite_response_data(resp_data, tenant)
        return JSONResponse(content=resp_data, status_code=response.status_code)
    except json.JSONDecodeError:
        return JSONResponse(content=response.text, status_code=response.status_code)


def rewrite_response_session(chunk: bytes, tenant: str) -> bytes:
    """Rewrite session_id in streaming response chunks"""
    # For NDJSON, try to parse and rewrite each line
    try:
        text = chunk.decode("utf-8")
        lines = text.split("\n")
        rewritten_lines = []
        for line in lines:
            if line.strip():
                try:
                    data = json.loads(line)
                    data = rewrite_response_data(data, tenant)
                    rewritten_lines.append(json.dumps(data, ensure_ascii=False))
                except json.JSONDecodeError:
                    rewritten_lines.append(line)
            else:
                rewritten_lines.append(line)
        return "\n".join(rewritten_lines).encode("utf-8")
    except Exception:
        return chunk


def rewrite_response_data(data: dict, tenant: str) -> dict:
    """Remove tenant prefix from session_id in response"""
    if not isinstance(data, dict):
        return data

    for field in ("session_id", "sessionId", "sid"):
        if field in data and data[field]:
            data[field] = extract_original_session_id(data[field], tenant)

    return data


# ============ Health Check ============

@app.get("/")
async def health():
    return {"status": "ok", "service": "llmtwins-tenant-wrapper"}


@app.get("/health")
async def health_check():
    # Check upstream
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{config.llmtwins_base_url}/")
            upstream_ok = resp.status_code == 200
    except Exception:
        upstream_ok = False

    return {
        "status": "ok" if upstream_ok else "degraded",
        "upstream": config.llmtwins_base_url,
        "upstream_ok": upstream_ok,
    }


# ============ Sessions API ============

@app.post("/api/sessions")
async def create_session(
    request: Request,
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
):
    tenant = get_tenant(x_tenant_id)
    return await proxy_request(request, tenant, "/api/sessions")


@app.get("/api/sessions/{session_id}/state")
async def get_session_state(
    session_id: str,
    request: Request,
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
):
    tenant = get_tenant(x_tenant_id)
    rewritten_sid = rewrite_session_id(session_id, tenant)
    return await proxy_request(
        request, tenant, f"/api/sessions/{rewritten_sid}/state"
    )


@app.post("/api/sessions/{session_id}/upload")
async def upload_to_session(
    session_id: str,
    request: Request,
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
):
    tenant = get_tenant(x_tenant_id)
    rewritten_sid = rewrite_session_id(session_id, tenant)

    # For file upload, we need to forward the raw request
    upstream_url = f"{config.llmtwins_base_url}/api/sessions/{rewritten_sid}/upload"

    # Forward query params
    query_params = dict(request.query_params)

    # Get raw body for multipart
    body = await request.body()

    headers = {}
    for key, value in request.headers.items():
        key_lower = key.lower()
        if key_lower not in ("host", "content-length"):
            headers[key] = value
    headers[config.tenant_header] = tenant

    async with httpx.AsyncClient(timeout=config.upstream_timeout) as client:
        response = await client.post(
            upstream_url,
            params=query_params,
            content=body,
            headers=headers,
        )

        try:
            resp_data = response.json()
            resp_data = rewrite_response_data(resp_data, tenant)
            return JSONResponse(content=resp_data, status_code=response.status_code)
        except json.JSONDecodeError:
            return JSONResponse(content=response.text, status_code=response.status_code)


# ============ Chat API ============

@app.post("/api/chat")
async def chat(
    request: Request,
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
):
    tenant = get_tenant(x_tenant_id)
    return await proxy_request(request, tenant, "/api/chat")


@app.post("/api/mapping")
async def mapping(
    request: Request,
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
):
    tenant = get_tenant(x_tenant_id)
    return await proxy_request(request, tenant, "/api/mapping")


@app.post("/api/mapping/update")
async def mapping_update(
    request: Request,
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
):
    tenant = get_tenant(x_tenant_id)
    return await proxy_request(request, tenant, "/api/mapping/update")


@app.post("/api/mapping/revise")
async def mapping_revise(
    request: Request,
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
):
    tenant = get_tenant(x_tenant_id)
    return await proxy_request(request, tenant, "/api/mapping/revise")


# ============ Pipeline API ============

@app.post("/api/sessions/{session_id}/pipeline/one_click")
async def pipeline_one_click(
    session_id: str,
    request: Request,
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
):
    tenant = get_tenant(x_tenant_id)
    rewritten_sid = rewrite_session_id(session_id, tenant)
    return await proxy_request(
        request, tenant, f"/api/sessions/{rewritten_sid}/pipeline/one_click"
    )


# ============ Planning API ============

@app.post("/api/planning")
async def planning(
    request: Request,
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
):
    tenant = get_tenant(x_tenant_id)
    return await proxy_request(request, tenant, "/api/planning")


# ============ Catch-all for other endpoints ============

@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def catch_all(
    path: str,
    request: Request,
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
):
    tenant = get_tenant(x_tenant_id)
    return await proxy_request(request, tenant, f"/{path}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=config.host, port=config.port)
