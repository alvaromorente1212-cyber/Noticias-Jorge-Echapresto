# The Echapresto Brief

Jorge Echapresto's daily top 5 global stories on executive compensation, CEO pay, reward policy & practice, and pay/benefits legislation.

## How it works

- **Data:** table `public.reward_news` in Supabase. RLS on, with no public policies (nobody can read or write it with the public key).
- **API:** Supabase Edge Function `reward-news` (read-only, no key required). `GET ?date=YYYY-MM-DD` returns `{ date, dates, items }`; without `date` it returns the latest edition.
- **Updates:** a Claude scheduled task runs every morning, researches the news and inserts 5 rows for the day.
- **Site:** static HTML/CSS/JS served by GitHub Pages. No build step, no keys.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure |
| `styles.css` | Responsive layout (desktop / tablet / mobile) and dark mode |
| `app.js` | Loads the edition, date navigation, archive, topic filters |
| `config.js` | API endpoint |

## Publish on GitHub Pages

Settings → Pages → Source: *Deploy from a branch* → `main` / root.
