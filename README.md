# FZ Say — Global Exchange Rates

> Real-time currency exchange rates. No ads. No registration. ECB data.

**Live demo:** https://xzskainet.github.io/fz-say

---

## Features

- **Live rates** for 30+ currencies, updated daily by the European Central Bank
- **7-day sparklines** with trend direction and range position bar (min/max indicator)
- **Top movers** — biggest gains and losses of the day, clickable for full detail
- **Quick converter** — convert between any two currencies instantly in the hero
- **Region filter** — browse by Americas, Europe, Asia, Oceania, Africa
- **Grid & List view** — toggle between card grid and compact list with mini sparklines
- **Currency comparison** — normalized chart for any two currencies over 7D / 1M / 3M / 1Y
- **Freelancer tracker** — see how income variance affects your earnings over 3/6/12 months
- **Trip planner** — estimate costs for up to 3 destinations
- **Dark mode** — persisted in localStorage
- **Fast** — 4-hour sessionStorage cache, no API key required

## Stack

| Layer | Technology |
|---|---|
| UI | React 18 + Vite |
| Styles | Tailwind CSS v3 |
| Charts | Recharts |
| World map | react-simple-maps |
| Animated numbers | @number-flow/react |
| Flags | flagcdn.com |
| Data | Frankfurter API (ECB) |

## Data source

Rates come from the [European Central Bank](https://www.ecb.europa.eu) via the [Frankfurter API](https://www.frankfurter.dev) — free, no authentication required. Rates update once per day around 16:00 CET. All values are indicative.

## Local development

```bash
npm install
npm run dev
```

## License

MIT
