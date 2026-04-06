# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

A Model Context Protocol (MCP) server that connects Google Ads API to AI assistants (Claude, Cursor). It exposes Google Ads data as MCP tools that AI assistants can invoke to query campaigns, ads, keywords, and assets.

## Commands

### Setup
```bash
# Create virtual environment
uv venv .venv
source .venv/bin/activate  # Mac/Linux
# .venv\Scripts\activate   # Windows

# Install dependencies
uv pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials
```

### Running the Server
```bash
python google_ads_server.py
```
The server runs on stdio transport (for MCP clients).

### Running Tests
```bash
# Test format_customer_id function (no credentials needed)
python format_customer_id_test.py

# Test full MCP tools (requires real credentials in environment)
python test_google_ads_mcp.py

# Test token refresh and authentication
python test_token_refresh.py
```

## Architecture

**Single-file server**: All server logic lives in `google_ads_server.py`. It uses `FastMCP` from the `mcp` package to expose tools via the MCP protocol over stdio.

**Authentication flow** (`get_credentials()`):
- Reads `GOOGLE_ADS_AUTH_TYPE` env var (`"oauth"` or `"service_account"`)
- OAuth path: loads token from `GOOGLE_ADS_CREDENTIALS_PATH`, auto-refreshes if expired, runs browser flow for new auth
- Service account path: loads key file, optionally impersonates a user via `GOOGLE_ADS_IMPERSONATION_EMAIL`

**API calls**: All tools call the Google Ads REST API directly (not the Python client library). The `get_headers()` function builds auth headers including the bearer token and developer token.

**Customer ID handling**: `format_customer_id()` normalizes IDs from various formats (dashes, quotes, braces) to a plain 10-digit string with zero-padding.

### MCP Tools Exposed

| Tool | Purpose |
|------|---------|
| `list_accounts` | List accessible Google Ads accounts |
| `execute_gaql_query` | Run GAQL query, returns table format |
| `get_campaign_performance` | Campaign metrics (wraps execute_gaql_query) |
| `get_ad_performance` | Ad metrics (wraps execute_gaql_query) |
| `run_gaql` | GAQL query with table/JSON/CSV output |
| `get_ad_creatives` | Ad headlines, descriptions, URLs |
| `get_account_currency` | Account currency code |
| `get_image_assets` | Image asset list |
| `download_image_asset` | Download image to local path |
| `get_asset_usage` | Where assets are used |
| `analyze_image_assets` | Asset analysis with usage stats |
| `list_resources` | Valid GAQL FROM clause resources |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_ADS_CREDENTIALS_PATH` | Yes | Path to OAuth client secret or service account key JSON |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Yes | Google Ads API developer token |
| `GOOGLE_ADS_AUTH_TYPE` | No | `"oauth"` (default) or `"service_account"` |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | No | Manager account ID for MCC access |
| `GOOGLE_ADS_CLIENT_ID` | OAuth only | OAuth client ID (alternative to file) |
| `GOOGLE_ADS_CLIENT_SECRET` | OAuth only | OAuth client secret (alternative to file) |
| `GOOGLE_ADS_IMPERSONATION_EMAIL` | Service account | Email to impersonate |

### API Version

The current Google Ads API version is set as `API_VERSION = "v19"` near the top of `google_ads_server.py`. Update this constant when upgrading the API version.

### Cost Values

All cost values from the Google Ads API are in **micros** (millionths of the account currency). 1,000,000 micros = 1 unit of currency (e.g., 1 USD). Use `get_account_currency()` to determine which currency an account uses before interpreting cost data.

### GAQL Notes

Google Ads Query Language (GAQL) is SQL-like but has restrictions: not all fields can be combined in one query (resource compatibility rules). Reference docs are in `docs/gaql-google-ads-query-language.md` and `docs/great-gaql-samples.md`. The `execute_gaql_query` tool uses flat field access (one level of nesting); `run_gaql` handles the same with additional format options.
