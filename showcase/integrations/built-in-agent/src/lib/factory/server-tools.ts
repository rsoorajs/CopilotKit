import { z } from "zod";
import { toolDefinition } from "@tanstack/ai";

// @region[weather-tool-backend]
export const weatherTool = toolDefinition({
  name: "weather",
  description: "Get current weather for a city",
  inputSchema: z.object({
    city: z.string(),
  }),
}).server(async ({ city }) => ({
  city,
  tempF: 72,
  condition: "Partly cloudy",
  humidity: 0.45,
}));
// @endregion[weather-tool-backend]

export const haikuTool = toolDefinition({
  name: "haiku",
  description: "Generate a haiku about a topic",
  inputSchema: z.object({
    topic: z.string(),
  }),
}).server(async ({ topic }) => ({
  topic,
  lines: [
    "Lines on a topic",
    `Eight syllables, on ${topic}`,
    "Then five at the close",
  ],
}));

// Mock travel-and-lifestyle tools used by the tool-rendering demos
// (default-catchall, custom-catchall). They return fake data so the LLM
// can chain them liberally to surface multiple tool-call cards per turn.

export const getWeatherTool = toolDefinition({
  name: "get_weather",
  description:
    "Get the current weather for a given location. Pairs naturally " +
    "with search_flights — when a city is mentioned, also consider " +
    "looking up flights there.",
  inputSchema: z.object({
    location: z.string(),
  }),
}).server(async ({ location }) => ({
  city: location,
  temperature: 68,
  humidity: 55,
  wind_speed: 10,
  conditions: "Sunny",
}));

export const searchFlightsTool = toolDefinition({
  name: "search_flights",
  description:
    "Search mock flights from an origin airport to a destination " +
    "airport. When the user mentions a city without a matching origin, " +
    "default the origin to 'SFO'.",
  inputSchema: z.object({
    origin: z.string(),
    destination: z.string(),
  }),
}).server(async ({ origin, destination }) => ({
  origin,
  destination,
  flights: [
    {
      airline: "United",
      flight: "UA231",
      depart: "08:15",
      arrive: "16:45",
      price_usd: 348,
    },
    {
      airline: "Delta",
      flight: "DL412",
      depart: "11:20",
      arrive: "19:55",
      price_usd: 312,
    },
    {
      airline: "JetBlue",
      flight: "B6722",
      depart: "17:05",
      arrive: "01:30",
      price_usd: 289,
    },
  ],
}));

export const getStockPriceTool = toolDefinition({
  name: "get_stock_price",
  description:
    "Get a mock current price for a stock ticker. Consider also " +
    "pulling a related ticker for comparison context.",
  inputSchema: z.object({
    ticker: z.string(),
  }),
}).server(async ({ ticker }) => {
  const price = Math.round((100 + Math.random() * 400) * 100) / 100;
  const change = Math.round((Math.random() * 6 - 3) * 100) / 100;
  return {
    ticker: ticker.toUpperCase(),
    price_usd: price,
    change_pct: change,
  };
});

export const rollDiceTool = toolDefinition({
  name: "roll_dice",
  description: "Roll a single die with the given number of sides.",
  inputSchema: z.object({
    sides: z.number().int().min(2).default(6),
  }),
}).server(async ({ sides }) => ({
  sides,
  result: Math.floor(Math.random() * Math.max(2, sides)) + 1,
}));

export const baseServerTools = [
  weatherTool,
  haikuTool,
  getWeatherTool,
  searchFlightsTool,
  getStockPriceTool,
  rollDiceTool,
] as const;
