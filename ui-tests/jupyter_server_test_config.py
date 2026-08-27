"""Server configuration for integration tests.

!! Never use this configuration in production because it
opens the server to the world and provide access to JupyterLab
JavaScript objects through the global window variable.
"""
import os

from jupyterlab.galata import configure_jupyter_server

configure_jupyter_server(c)

# configure_jupyter_server pins port 8888 with port_retries = 0, so the test
# server dies rather than move when a developer already has a lab on 8888.
# `or`, not a get() default: an exported-but-empty JUPYTER_TEST_PORT would
# raise ValueError here while Playwright waited happily on 8888.
c.ServerApp.port = int(os.environ.get("JUPYTER_TEST_PORT") or "8888")

# Uncomment to set server log level to debug level
# c.ServerApp.log_level = "DEBUG"
