"""Playwright + Vite renderer for widget screenshots.

Uses Playwright's synchronous API so the renderer can be called from
both async (data generation) and sync (reward function) contexts.
"""

import json
import logging
import subprocess
import time
from pathlib import Path
from urllib.request import urlopen
from urllib.error import URLError

from playwright.sync_api import sync_playwright, Browser, Page

from .config import RendererConfig

logger = logging.getLogger(__name__)

HARNESS_DIR = Path(__file__).parent.parent / "harness"
APP_TSX_PATH = HARNESS_DIR / "src" / "App.tsx"
RESPONSE_JSON_PATH = HARNESS_DIR / "src" / "response.json"


class WidgetRenderer:
    """Renders widget code to screenshots using a Vite dev server and Playwright (sync)."""

    def __init__(self, config: RendererConfig | None = None):
        self.config = config or RendererConfig()
        self._vite_process: subprocess.Popen | None = None
        self._browser: Browser | None = None
        self._page: Page | None = None
        self._playwright = None

    def start(self) -> None:
        """Start the Vite dev server and launch headless Chromium."""
        env = {**subprocess.os.environ, "VITE_PORT": str(self.config.vite_port)}
        self._vite_process = subprocess.Popen(
            ["npx", "vite", "--port", str(self.config.vite_port)],
            cwd=str(HARNESS_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
        )
        self._wait_for_vite()

        self._playwright = sync_playwright().start()
        self._browser = self._playwright.chromium.launch(headless=True)
        self._page = self._browser.new_page(viewport={"width": 800, "height": 600})
        logger.info("Renderer started: Vite on port %d, Chromium headless", self.config.vite_port)

    def _wait_for_vite(self, timeout: float = 30.0) -> None:
        """Wait until the Vite dev server is responding."""
        url = f"http://localhost:{self.config.vite_port}"
        start = time.monotonic()
        while time.monotonic() - start < timeout:
            try:
                with urlopen(url, timeout=2) as resp:
                    if resp.status == 200:
                        return
            except (URLError, OSError):
                pass
            time.sleep(0.5)
        raise TimeoutError(f"Vite dev server did not start within {timeout}s")

    def _restart_vite(self) -> None:
        """Restart the Vite dev server if it crashed."""
        if self._vite_process:
            try:
                self._vite_process.kill()
            except Exception:
                pass
        env = {**subprocess.os.environ, "VITE_PORT": str(self.config.vite_port)}
        self._vite_process = subprocess.Popen(
            ["npx", "vite", "--port", str(self.config.vite_port)],
            cwd=str(HARNESS_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
        )
        self._wait_for_vite()
        logger.info("Vite restarted on port %d", self.config.vite_port)

    def stop(self) -> None:
        """Stop the browser and Vite dev server."""
        if self._page:
            self._page.close()
            self._page = None
        if self._browser:
            self._browser.close()
            self._browser = None
        if self._playwright:
            self._playwright.stop()
            self._playwright = None
        if self._vite_process:
            self._vite_process.terminate()
            self._vite_process.wait(timeout=10)
            self._vite_process = None
        logger.info("Renderer stopped")

    def render(
        self,
        code: str,
        mock_data: dict,
        output_path: str | Path,
    ) -> bool:
        """Render widget code to a screenshot.

        Overwrites App.tsx and response.json, reloads the page, waits for
        __RENDER_COMPLETE__, then takes a screenshot.

        Returns True if rendering succeeded, False otherwise.
        """
        if not self._page:
            raise RuntimeError("Renderer not started. Call start() first.")

        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        for attempt in range(2):
            try:
                # Write widget code and mock data to harness
                APP_TSX_PATH.write_text(code)
                RESPONSE_JSON_PATH.write_text(json.dumps(mock_data, indent=2))

                # Small delay to let Vite detect file changes
                time.sleep(0.5)

                # Check if Vite is still alive, restart if needed
                if self._vite_process and self._vite_process.poll() is not None:
                    logger.warning("Vite process died (exit=%s), restarting...", self._vite_process.returncode)
                    self._restart_vite()

                # Also verify Vite is actually responding
                try:
                    with urlopen(f"http://localhost:{self.config.vite_port}", timeout=5) as resp:
                        pass
                except (URLError, OSError):
                    logger.warning("Vite not responding, restarting...")
                    self._restart_vite()

                # Navigate fresh
                url = f"http://localhost:{self.config.vite_port}"
                self._page.goto(url, wait_until="load", timeout=15000)

                # Wait for __RENDER_COMPLETE__ flag (set by main.tsx after 2s delay)
                self._page.wait_for_function(
                    "window.__RENDER_COMPLETE__ === true",
                    timeout=self.config.render_complete_timeout,
                )

                # Extra settle time for MUI animations/charts
                time.sleep(0.5)

                # Screenshot the full widget content, avoiding white space
                # First try to find the actual widget content inside #root
                widget = self._page.query_selector("#root > *")
                if widget:
                    # Get the full scrollable content size
                    bbox = widget.bounding_box()
                    if bbox and bbox["height"] > 10:
                        # Use full_page screenshot with clip to capture entire widget
                        scroll_height = self._page.evaluate(
                            "document.querySelector('#root').scrollHeight"
                        )
                        clip_height = max(bbox["height"], scroll_height)
                        self._page.set_viewport_size({
                            "width": 800,
                            "height": int(clip_height) + 20,
                        })
                        time.sleep(0.3)
                        widget.screenshot(path=str(output_path))
                        # Reset viewport
                        self._page.set_viewport_size({"width": 800, "height": 600})
                    else:
                        self._page.screenshot(path=str(output_path))
                else:
                    self._page.screenshot(path=str(output_path))

                logger.debug("Screenshot saved: %s", output_path)
                return True

            except Exception as e:
                error_msg = str(e)
                if attempt == 0 and ("Timeout" in error_msg or "goto" in error_msg.lower()):
                    logger.warning("Render attempt %d failed with timeout, restarting Vite: %s", attempt + 1, e)
                    self._restart_vite()
                    continue
                try:
                    error_text = self._page.evaluate(
                        "document.querySelector('#root')?.innerText || 'no content'"
                    )
                    logger.warning("Render failed: %s | Page content: %s", e, error_text[:200])
                except Exception:
                    logger.warning("Render failed: %s", e)
                return False
        return False

    def render_batch(
        self,
        items: list[dict],
        output_dir: str | Path,
    ) -> list[bool]:
        """Render multiple widgets sequentially.

        Each item should have keys: 'code', 'mock_data', 'name'.
        Screenshots are saved as {output_dir}/{name}.png.
        """
        output_dir = Path(output_dir)
        results = []
        for item in items:
            output_path = output_dir / f"{item['name']}.png"
            success = self.render(item["code"], item["mock_data"], output_path)
            results.append(success)
        return results
