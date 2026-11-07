# Wanderlens - Coastal Pass (Final Project)

Multi-page responsive travel website for coastal and island trips. The final version continues the midterm and endterm
project (same topic, same team, same pages) and turns it into a client-side web application with **live API data**,
**object-oriented JavaScript**, **persistent localStorage data**, a **CRUD feature**, **search / filter / sort** and a
**statistics dashboard**. All earlier HTML, CSS, Bootstrap, JavaScript, DOM, validation and jQuery features still work.


## Group members (Team "AI love")
| Member | Contribution (edit this table to match your real work) |
|---|---|
| Balnur | Live Coast page: `api.js`, `live.js`, `CoastalSpot` class, loading/error/empty states, statistics tiles |
| Ayazhan | My Trips page: `Trip` / `TripManager` classes, `trips.js` (CRUD), localStorage, chart, text-size control, README |

## Pages (10, all connected through the navbar)
Home, Discover, Attractions, Experiences, **Live Coast (new)**, Plan Your Trip, About, Contact, Get Pass,
**My Trips (new, suitcase icon in the navbar)**.

## Technologies
HTML5, CSS3, Bootstrap 5.3 (grid, navbar, offcanvas, modal, toasts, spinner), Font Awesome, Google Fonts,
JavaScript ES6 (classes, async/await, Promises, `fetch`), jQuery 3.7, localStorage, Open-Meteo API.

## API information
* **Service:** [Open-Meteo](https://open-meteo.com/) forecast API - free, public, **no API key** (so no secret is stored in the code).
* **Endpoint:** `GET https://api.open-meteo.com/v1/forecast?latitude=...&longitude=...&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto`
* One request returns the data for all 12 coastal destinations (a JSON array, one item per destination).
* **Where it is used:** `js/api.js` (class `WeatherApi`) and `js/live.js` (page logic), shown on `live.html`.
* **UI states:** *loading* (spinner), *success* (cards, statistics), *empty* (no data returned / nothing matches the filter),
  *error* (network error, timeout after 10 s, HTTP error, invalid JSON) with a **Try again** button.
  If the request fails but an earlier answer was saved, that saved copy is shown together with a warning.

## Final-stage features (added after the endterm)
| # | Feature | Type | Where |
|---|---|---|---|
| 1 | **API integration** - live weather for 12 destinations with loading / success / empty / error states | **Mandatory** | Live Coast |
| 2 | **OOP** - classes `Trip`, `TripManager`, `CoastalSpot`, `WeatherApi`, `JsonStore`, `TextSizeControl` | **Mandatory** | `js/models.js`, `api.js`, `storage.js`, `a11y.js` |
| 3 | **localStorage** - saved trips, live-page preferences (unit, search, region, sort), last API answer, text size; restored on reload; can be edited, deleted or cleared | **Mandatory** | My Trips, Live Coast, all pages |
| 4 | **CRUD** - create, read, update, delete trips; delete / clear-all confirmation in a Bootstrap modal; "Save to My Trips" button on Plan Your Trip | Additional | My Trips, Plan Your Trip |
| 5 | **Search, filter and sort** - live search + region filter + 5 sort modes + °C/°F switch; trips: search + 5 sort modes | Additional | Live Coast, My Trips |
| 6 | **Dashboard / statistics** - tiles (spots shown, average temperature, warmest, best beach day) and a bar chart of trip costs built from saved data | Additional | Live Coast, My Trips |
| 7 | **Accessibility** - A- / A+ text-size controls (saved), aria-live status messages, visible focus outlines, labelled buttons | Additional | navbar on every page |

## OOP overview
| Class | Responsibility |
|---|---|
| `Trip` | One saved trip: constructor, properties, getters (`total`, `endDate`, `activities`), `itinerary()`, `validate()`, `toJSON()` / `fromJSON()` |
| `TripManager` | Many `Trip` objects: `add`, `update`, `remove`, `clear`, `search`, `stats`; saves through `JsonStore` |
| `CoastalSpot` | One destination: `applyWeather()`, `condition`, `tempIn()`, `beachScore`, `scoreLabel` (12 objects are created from `coastalSpots`) |
| `WeatherApi` | Builds the URL and calls `fetch` with a timeout and readable error messages |
| `JsonStore` | Safe `localStorage` wrapper (JSON, fallback for missing / broken data, returns success flag) |
| `TextSizeControl` | Text-size buttons and saved preference |

Earlier functions are reused (not copied): `calculateTotal` (main.js), `buildItinerary`, `checkRequired`, `checkEmail`,
`checkRange`, `checkFutureDate`, `validateForm` (validation.js).

## Project structure
```
index.html, discover.html, attractions.html, experiences.html, plan-trip.html,
pass.html, about.html, contact.html, live.html (new), my-trips.html (new)
css/style.css            design tokens, light/dark theme, components, final-stage styles at the end
js/data.js               project data arrays (+ coastalSpots for the API page)
js/main.js               endterm: rendering, filters, favorites, theme, price calculator
js/validation.js         endterm: custom form validation, itinerary
js/jquery-effects.js     endterm: jQuery selectors, traversal, events, effects
js/utils.js              NEW: createEl, formatDate, formatMoney, formatTime
js/storage.js            NEW: JsonStore (localStorage wrapper)
js/models.js             NEW: Trip, TripManager, CoastalSpot classes
js/api.js                NEW: WeatherApi (fetch + async/await)
js/a11y.js               NEW: text-size control
js/live.js               NEW: Live Coast page (UI + events)
js/trips.js              NEW: My Trips page (CRUD UI), save button, navbar badge
```
Scripts are plain (classic) files loaded in dependency order, so the site also works when `index.html` is simply
opened from the disk (ES modules would be blocked by the browser on `file://`). Data, models, API and interface code
are in separate files.

## How to test
1. **Live Coast** (needs internet): open *Live Coast* - spinner, then 12 weather cards and 4 statistic tiles.
   Type `croatia` (list shrinks, `Esc` clears), click a region button, change *Sort by*, click the **°C** button to switch to °F,
   press **Refresh**. Reload the page: unit, search, region and sort are restored.
   *Error state:* in DevTools -> Network choose **Offline**, press Refresh (with no saved copy you see the error + Try again;
   after one successful load you see the saved copy with a warning).
   *Empty state:* search for `zzz` -> "No destinations match" + Reset filters.
2. **My Trips - Create:** fill the form and press *Add trip*; submit an empty form to see validation messages.
3. **Read / Search / Sort:** the list shows each trip (price, dates, activities, itinerary under "Show itinerary");
   use the search box and the sort list.
4. **Update:** press *Edit*, change a value, press *Save changes*. **Delete:** press *Delete* and confirm in the modal;
   *Clear all* removes everything.
5. **Persistence:** reload the page (or close the browser) - trips are still there. The suitcase icon in the navbar shows the count.
6. **Dashboard:** statistic tiles and the bar chart change after every add / edit / delete.
7. **Plan Your Trip:** generate an itinerary, then press **Save to My Trips**.
8. **Text size:** press **A+** / **A-** in the navbar; the size is kept after reload.
9. **Earlier features:** favorites (heart), dark mode (moon), attractions/experiences search and filters, price calculator,
   contact form validation, jQuery accordion / slide / counters - all unchanged.

## Run locally
Open the folder in VS Code and run `index.html` with Live Server (or open it in a browser). Internet is required for
the CDN files, images and the weather API.

## Deployment (GitHub Pages)
Repository -> *Settings* -> *Pages* -> Source: `main` branch, `/ (root)` -> Save. Paste the generated link at the top of this README.

---
&copy; 2026 Wanderlens. All rights reserved.
