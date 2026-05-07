"""
LangGraph agent for the CopilotKit Tool Rendering demos.

Backs the three tool-rendering cells:
  - tool-rendering-default-catchall  (no frontend renderers)
  - tool-rendering-custom-catchall   (wildcard renderer on frontend)
  - tool-rendering                   (per-tool + catch-all on frontend)
  - tool-rendering-reasoning-chain   (testing — also streams reasoning)

All cells share this backend — they differ only in how the frontend
renders the same tool calls. Kept separate from `main.py` so the
tool-rendering demo has a tightly-scoped tool set.
"""

from random import choice, randint

from langchain.agents import create_agent
from langchain.tools import tool
from langchain_openai import ChatOpenAI
from copilotkit import CopilotKitMiddleware

# One-tool-per-question prompt.
#
# This backend serves the tool-rendering demos, whose JOB is to show the
# rendering patterns (per-tool, catch-all, default fallback). One tool
# call per user turn is enough to demonstrate them — chained calls just
# clutter the chat and surprise users.
SYSTEM_PROMPT = (
    "You are a helpful travel & lifestyle concierge. You have mock tools "
    "for weather, flights, stock prices, and dice rolls — they all return "
    "fake data.\n\n"
    "Routing rules:\n"
    "  - Weather questions → call `get_weather` with the location.\n"
    "  - Flight questions → call `search_flights` with origin and "
    "destination (default origin to 'SFO' if the user only names a "
    "destination).\n"
    "  - Stock questions → call `get_stock_price` with the ticker.\n"
    "  - Dice rolls → call `roll_dice` with the requested sides.\n"
    "  - Anything else → reply in plain text.\n\n"
    "By default, call exactly ONE tool per user question and do NOT chain "
    "tools or fetch related data the user didn't ask for. The ONLY "
    "exception is when the user explicitly asks you to chain or call "
    "multiple tools in a single turn — then call each tool the user "
    "requested. After tools return, write one short sentence summarizing "
    "the result. Never fabricate data a tool could provide."
)


# @region[weather-tool-backend]
@tool
def get_weather(location: str) -> dict:
    """Get the current weather for a given location."""
    return {
        "city": location,
        "temperature": 68,
        "humidity": 55,
        "wind_speed": 10,
        "conditions": "Sunny",
    }
# @endregion[weather-tool-backend]


@tool
def search_flights(origin: str, destination: str) -> dict:
    """Search mock flights from an origin airport to a destination airport."""
    return {
        "origin": origin,
        "destination": destination,
        "flights": [
            {
                "airline": "United",
                "flight": "UA231",
                "depart": "08:15",
                "arrive": "16:45",
                "price_usd": 348,
            },
            {
                "airline": "Delta",
                "flight": "DL412",
                "depart": "11:20",
                "arrive": "19:55",
                "price_usd": 312,
            },
            {
                "airline": "JetBlue",
                "flight": "B6722",
                "depart": "17:05",
                "arrive": "01:30",
                "price_usd": 289,
            },
        ],
    }


@tool
def get_stock_price(ticker: str) -> dict:
    """Get a mock current price for a stock ticker."""
    return {
        "ticker": ticker.upper(),
        "price_usd": round(100 + randint(0, 400) + randint(0, 99) / 100, 2),
        "change_pct": round(choice([-1, 1]) * (randint(0, 300) / 100), 2),
    }


@tool
def roll_dice(sides: int = 6) -> dict:
    """Roll a single die with the given number of sides."""
    return {"sides": sides, "result": randint(1, max(2, sides))}


model = ChatOpenAI(model="gpt-4o-mini")

graph = create_agent(
    model=model,
    tools=[get_weather, search_flights, get_stock_price, roll_dice],
    middleware=[CopilotKitMiddleware()],
    system_prompt=SYSTEM_PROMPT,
)
