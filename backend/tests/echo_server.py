from mcp.server.fastmcp import FastMCP


server = FastMCP("Test MCP Server")


@server.tool()
def echo(text: str) -> str:
    """Echo a text string."""
    return f"echo:{text}"


@server.tool()
def get_weather(city: str) -> str:
    """Get the current weather forecast for a city."""
    return f"Weather for {city}: sunny"


server.run(transport="stdio")
