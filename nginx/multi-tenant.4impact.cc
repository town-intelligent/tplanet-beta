# Multi-tenant Beta Test Configuration
#
# Installation:
#   1. Copy to /etc/nginx/sites-available/multi-tenant.4impact.cc
#   2. Create symlink: ln -s /etc/nginx/sites-available/multi-tenant.4impact.cc /etc/nginx/sites-enabled/
#   3. Get SSL cert: certbot --nginx -d multi-tenant.4impact.cc -d nantou.multi-tenant.4impact.cc
#   4. Reload nginx: systemctl reload nginx

# Default tenant
server {
    listen 80;
    server_name multi-tenant.4impact.cc;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name multi-tenant.4impact.cc;

    ssl_certificate     /etc/letsencrypt/live/multi-tenant.4impact.cc/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/multi-tenant.4impact.cc/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    client_max_body_size 100M;

    set $tenant_id "default";

    # Backend API — direct path matching
    location ~ ^/(accounts|projects|llm|tasks|NFT|portal|mockup|news|dashboard|weight|admin|tenant)/ {
        proxy_pass http://localhost:5580;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Tenant-ID $tenant_id;
    }

    # Backend API — /api/ prefix (frontend uses /api/tenant/config etc.)
    # Strips /api/ prefix: /api/tenant/config -> /tenant/config
    location ~ ^/api/(accounts|projects|llm|tasks|NFT|portal|mockup|news|dashboard|weight|admin|tenant)/ {
        rewrite ^/api/(.*)$ /$1 break;
        proxy_pass http://localhost:5580;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Tenant-ID $tenant_id;
    }

    # LLMTwins API -> Wrapper (multi-tenant session isolation)
    # Handles /api/* paths that don't match backend routes above
    location /api/ {
        proxy_pass http://localhost:8004;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Tenant-ID $tenant_id;

        # Long timeout for AI responses
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
        proxy_connect_timeout 60s;

        # SSE/streaming support
        proxy_buffering off;
        proxy_request_buffering off;
        chunked_transfer_encoding off;
        proxy_set_header Connection '';
        proxy_set_header Cache-Control no-cache;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:6176;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Nantou tenant subdomain
server {
    listen 80;
    server_name nantou.multi-tenant.4impact.cc;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name nantou.multi-tenant.4impact.cc;

    ssl_certificate     /etc/letsencrypt/live/multi-tenant.4impact.cc/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/multi-tenant.4impact.cc/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    client_max_body_size 100M;

    set $tenant_id "nantou-gov";

    # Backend API — direct path matching
    location ~ ^/(accounts|projects|llm|tasks|NFT|portal|mockup|news|dashboard|weight|admin|tenant)/ {
        proxy_pass http://localhost:5580;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Tenant-ID $tenant_id;
    }

    # Backend API — /api/ prefix (frontend uses /api/tenant/config etc.)
    # Strips /api/ prefix: /api/tenant/config -> /tenant/config
    location ~ ^/api/(accounts|projects|llm|tasks|NFT|portal|mockup|news|dashboard|weight|admin|tenant)/ {
        rewrite ^/api/(.*)$ /$1 break;
        proxy_pass http://localhost:5580;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Tenant-ID $tenant_id;
    }

    # LLMTwins API -> Wrapper (multi-tenant session isolation)
    # Handles /api/* paths that don't match backend routes above
    location /api/ {
        proxy_pass http://localhost:8004;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Tenant-ID $tenant_id;

        # Long timeout for AI responses
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
        proxy_connect_timeout 60s;

        # SSE/streaming support
        proxy_buffering off;
        proxy_request_buffering off;
        chunked_transfer_encoding off;
        proxy_set_header Connection '';
        proxy_set_header Cache-Control no-cache;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:6176;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
