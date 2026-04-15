"""
Hermes Automa Client - Python

A high-level Python client for Hermes Agent to interact with the
Automa Agent Bridge server over HTTP (REST) and WebSocket (events).

This is the primary client that the Hermes RPA engine imports.

Usage:
    from hermes_automa_client import AutomaClient

    client = AutomaClient()
    client.connect("http://localhost:8528")

    workflows = client.list_workflows()
    client.execute_workflow("workflow-id", variables={"url": "https://example.com"})

    # Subscribe to events
    def on_event(event):
        print("Event:", event)

    unsub = client.subscribe_events(on_event)
    # ... later ...
    unsub()

Requirements:
    pip install requests websocket-client
"""

from __future__ import annotations

import json
import threading
import time
from typing import Any, Callable, Dict, List, Optional
from urllib.parse import quote as url_quote

import requests
import websocket


class AutomaClientError(Exception):
    """Raised when the bridge server returns an error."""
    pass


class AutomaClient:
    """
    Client for communicating with the Automa Agent Bridge server.

    Provides methods matching the bridge REST API, plus WebSocket
    event subscription for real-time workflow progress/logs.
    """

    def __init__(
        self,
        base_url: str = "http://localhost:8528",
        timeout: float = 30.0,
    ):
        self.base_url: str = base_url.rstrip("/")
        self.ws_url: str = self.base_url.replace("http", "ws", 1)
        self.timeout: float = timeout
        self._session: requests.Session = requests.Session()
        self._session.headers.update({"Content-Type": "application/json"})
        self._ws: Optional[websocket.WebSocketApp] = None
        self._ws_thread: Optional[threading.Thread] = None
        self._event_handlers: list[Callable[[Any], None]] = []
        self._ws_lock = threading.Lock()
        self._connected = False

    def connect(self, url: Optional[str] = None) -> "AutomaClient":
        """
        Set the bridge server URL and verify connectivity.

        Args:
            url: Base HTTP URL (e.g. http://localhost:8528).
                 If None, uses the URL from __init__.

        Returns:
            self (for chaining)
        """
        if url:
            self.base_url = url.rstrip("/")
            self.ws_url = self.base_url.replace("http", "ws", 1)

        self._connected = True
        return self

    # ------------------------------------------------------------------
    # Internal HTTP helpers
    # ------------------------------------------------------------------

    def _request(
        self,
        method: str,
        path: str,
        body: Optional[Dict[str, Any]] = None,
    ) -> Any:
        """Send an HTTP request and return the parsed data field."""
        url = f"{self.base_url}{path}"

        try:
            if method.upper() == "GET":
                resp = self._session.get(url, timeout=self.timeout)
            else:
                resp = self._session.post(
                    url,
                    data=json.dumps(body) if body else "{}",
                    timeout=self.timeout,
                )
        except requests.Timeout:
            raise AutomaClientError(
                f"Request timed out after {self.timeout}s: {method} {path}"
            )
        except requests.ConnectionError as e:
            raise AutomaClientError(
                f"Connection failed to {url}: {e}"
            )

        if not resp.ok:
            raise AutomaClientError(
                f"HTTP {resp.status_code}: {resp.text[:500]}"
            )

        result = resp.json()

        # /api/health returns a direct JSON object without ok/data wrapper
        if path == "/api/health":
            return result

        if not result.get("ok"):
            raise AutomaClientError(result.get("error", "Unknown bridge error"))

        return result.get("data")

    def _post(self, path: str, body: Optional[Dict[str, Any]] = None) -> Any:
        return self._request("POST", path, body)

    def _get(self, path: str) -> Any:
        return self._request("GET", path)

    # ------------------------------------------------------------------
    # Workflow API
    # ------------------------------------------------------------------

    def list_workflows(self) -> List[Any]:
        """List all workflows available in the Automa extension."""
        return self._post("/api/workflow/list") or []

    def execute_workflow(
        self,
        workflow_id: str,
        variables: Optional[Dict[str, Any]] = None,
    ) -> Any:
        """
        Execute a workflow by ID with optional input variables.

        Args:
            workflow_id: The workflow's unique ID.
            variables: Key-value pairs to inject as workflow variables.

        Returns:
            Execution result from the bridge (includes stateId, etc.)
        """
        payload: Dict[str, Any] = {"workflowId": workflow_id}
        if variables:
            payload["variables"] = variables
        return self._post("/api/workflow/execute", payload)

    def stop_workflow(self, state_id: str) -> None:
        """Stop a running workflow by its state ID."""
        self._post("/api/workflow/stop", {"stateId": state_id})

    def get_workflow_status(self, state_id: str) -> Any:
        """Get the execution status of a workflow by state ID."""
        return self._post("/api/workflow/status", {"stateId": state_id})

    def import_workflow(self, workflow: Any) -> Any:
        """
        Import a workflow definition into the Automa extension.

        Args:
            workflow: Workflow definition (dict or JSON-serializable object).

        Returns:
            Import result with the new workflow ID.
        """
        return self._post("/api/workflow/import", {"workflow": workflow})

    def export_workflow(self, workflow_id: str) -> Any:
        """
        Export a workflow definition by its ID.

        Args:
            workflow_id: The workflow's unique ID.

        Returns:
            Full workflow definition as a dict.
        """
        return self._post("/api/workflow/export", {"workflowId": workflow_id})

    # ------------------------------------------------------------------
    # Recording API
    # ------------------------------------------------------------------

    def start_recording(self) -> None:
        """Start recording browser actions."""
        self._post("/api/recording/start")

    def stop_recording(self) -> Any:
        """Stop recording and return the recorded actions/workflow."""
        return self._post("/api/recording/stop")

    # ------------------------------------------------------------------
    # Tab API
    # ------------------------------------------------------------------

    def open_tab(self, url: str) -> Any:
        """
        Open a new browser tab with the given URL.

        Args:
            url: The URL to navigate to.

        Returns:
            Tab info from the bridge.
        """
        return self._post("/api/tab/open", {"url": url})

    def list_tabs(self) -> List[Any]:
        """List all open browser tabs."""
        return self._get("/api/tab/list") or []

    # ------------------------------------------------------------------
    # Data API
    # ------------------------------------------------------------------

    def get_data(self, log_id: str) -> Any:
        """
        Get workflow execution data/logs by log ID.

        Args:
            log_id: The execution log ID.

        Returns:
            Log data from the bridge.
        """
        return self._get(f"/api/data/{url_quote(log_id, safe='')}")

    # ------------------------------------------------------------------
    # Health
    # ------------------------------------------------------------------

    def health(self) -> Dict[str, Any]:
        """
        Check bridge server health.

        Returns:
            Dict with status, version, connected, mode, uptime, timestamp.
        """
        return self._get("/api/health")

    # ------------------------------------------------------------------
    # WebSocket Event Subscription
    # ------------------------------------------------------------------

    def subscribe_events(
        self, handler: Callable[[Any], None]
    ) -> Callable[[], None]:
        """
        Subscribe to real-time events from the bridge via WebSocket.

        The handler is called on a background thread for each event
        received from the bridge (workflow progress, logs, completion, etc.).

        Args:
            handler: Callback invoked with each event dict.

        Returns:
            An unsubscribe function. Call it to remove this handler.

        Example:
            def on_event(event):
                print(event["type"], event.get("data"))

            unsub = client.subscribe_events(on_event)
            # ... do stuff ...
            unsub()
        """
        with self._ws_lock:
            self._event_handlers.append(handler)

            # Lazily start the WebSocket connection
            if self._ws is None or self._ws_thread is None or not self._ws_thread.is_alive():
                self._start_ws()

        def unsubscribe() -> None:
            with self._ws_lock:
                if handler in self._event_handlers:
                    self._event_handlers.remove(handler)

                # Close WebSocket if no more handlers
                if not self._event_handlers and self._ws is not None:
                    self._ws.close()
                    self._ws = None

        return unsubscribe

    def _start_ws(self) -> None:
        """Start the WebSocket connection in a background thread."""
        ws_full_url = f"{self.ws_url}/ws"

        def on_message(_ws_app: Any, message: str) -> None:
            try:
                data = json.loads(message)
            except (json.JSONDecodeError, TypeError):
                return

            with self._ws_lock:
                handlers = list(self._event_handlers)

            for h in handlers:
                try:
                    h(data)
                except Exception as e:
                    print(f"[AutomaClient] Event handler error: {e}")

        def on_error(_ws_app: Any, error: Any) -> None:
            print(f"[AutomaClient] WebSocket error: {error}")

        def on_close(_ws_app: Any, close_status_code: Any, close_msg: Any) -> None:
            # Auto-reconnect if there are still handlers
            with self._ws_lock:
                if self._event_handlers:
                    time.sleep(3)
                    if self._event_handlers:
                        print("[AutomaClient] Reconnecting WebSocket...")
                        self._start_ws()

        def on_open(_ws_app: Any) -> None:
            pass

        self._ws = websocket.WebSocketApp(
            ws_full_url,
            on_message=on_message,
            on_error=on_error,
            on_close=on_close,
            on_open=on_open,
        )

        self._ws_thread = threading.Thread(
            target=self._ws.run_forever,
            daemon=True,
            name="automa-ws-events",
        )
        self._ws_thread.start()

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def disconnect(self) -> None:
        """Disconnect all connections and clean up."""
        self._connected = False

        with self._ws_lock:
            self._event_handlers.clear()

        if self._ws is not None:
            self._ws.close()
            self._ws = None

        self._session.close()

    def __enter__(self) -> "AutomaClient":
        return self

    def __exit__(self, *args: Any) -> None:
        self.disconnect()

    def __repr__(self) -> str:
        return f"AutomaClient(base_url={self.base_url!r}, timeout={self.timeout})"


# ---------------------------------------------------------------------------
# Convenience: module-level quick-start
# ---------------------------------------------------------------------------

def create_client(
    url: str = "http://localhost:8528",
    timeout: float = 30.0,
) -> AutomaClient:
    """
    Create and connect an AutomaClient.

    Args:
        url: Bridge server base URL.
        timeout: Request timeout in seconds.

    Returns:
        Connected AutomaClient instance.
    """
    client = AutomaClient(base_url=url, timeout=timeout)
    client.connect()
    return client


# Quick test when run directly
if __name__ == "__main__":
    import sys

    url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8528"
    client = create_client(url)

    print(f"Connected to {url}")
    try:
        h = client.health()
        print(f"Health: {h}")
    except AutomaClientError as e:
        print(f"Health check failed: {e}")
        sys.exit(1)

    try:
        workflows = client.list_workflows()
        print(f"Workflows: {len(workflows)} found")
        for wf in workflows[:5]:
            name = wf.get("name", wf.get("id", "unknown"))
            print(f"  - {name}")
    except AutomaClientError as e:
        print(f"List workflows failed: {e}")

    client.disconnect()
    print("Done.")
