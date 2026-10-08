# Digital Alarm Clock

A digital alarm clock built with basic Python and tkinter, with a matching web version you can host on GitHub Pages. The whole project uses a muted green theme.

## Features

- Live digital clock and date, in 12-hour or 24-hour format
- Add as many alarms as you like, each with a label
- Turn alarms on or off, or delete them
- Alarms are saved to `alarms.json` and come back the next time you open the app
- When you set an alarm, a short default sound plays and a message confirms the time and how long until it rings
- When an alarm goes off, it plays the default alarm sound, and the website also sends a system notification
- Ringing window with **Stop** and **Snooze (5 minutes)**
- Web version in `docs/` that works in any browser, including on a phone
- **World time** tab on the website: live clocks for cities around the world, with the day and the time difference from you. Add or remove cities, and your list is remembered

## Project structure

```
digital-alarm-clock/
├── main.py              # Python desktop app (tkinter)
├── requirements.txt     # No packages needed
├── README.md            # You are here
├── HOSTING.md           # Step-by-step GitHub Pages guide
├── CHANGELOG.md         # Version history
├── CONTRIBUTING.md      # How to suggest changes
├── LICENSE              # MIT license
├── .gitignore
├── .vscode/
│   ├── launch.json      # Press F5 to run in VS Code
│   └── settings.json
└── docs/                # Web version (this is what GitHub Pages serves)
    ├── index.html
    ├── style.css
    └── script.js
```

## Run the Python app in VS Code

1. Install [Python 3.8 or newer](https://www.python.org/downloads/). On Windows, tick **Add Python to PATH** during setup.
2. Install the **Python** extension in VS Code.
3. Unzip the project, then use **File > Open Folder** and choose `digital-alarm-clock`.
4. Open `main.py` and press **F5** (or click the Run button at the top right).

You can also run it from the VS Code terminal:

```bash
python main.py
```

On macOS or Linux, use `python3 main.py`. tkinter ships with Python on Windows and macOS. On some Linux systems install it first: `sudo apt install python3-tk`.

## Run the web version locally

Open `docs/index.html` in your browser. For live reload, install the **Live Server** extension in VS Code, right-click `docs/index.html` and choose **Open with Live Server**.

## Host it on GitHub Pages (github.io)

Short version:

1. Create a new repository on GitHub and push this project.
2. Open **Settings > Pages**.
3. Under **Build and deployment**, set Source to **Deploy from a branch**, branch **main**, folder **/docs**, then save.
4. After a minute your site is live at `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`.

The full walkthrough is in [HOSTING.md](HOSTING.md).

> GitHub Pages only serves static files, so it cannot run `main.py`. The Python app is the desktop version, and the files in `docs/` are the same clock rewritten for the browser.

## How it works

- `tick()` runs twice a second, updates the clock, and once per minute checks whether any active alarm matches the current `HH:MM`.
- Alarms are stored in 24-hour form (`"07:30"`) and converted to 12-hour form only for display.
- When an alarm matches, a window opens and a beep repeats until you press Stop or Snooze.
- Snooze creates a temporary alarm 5 minutes ahead that deletes itself after it rings.

## World time (web version)

Open the **World time** tab on the site to see the current time in other cities. Each row shows the local time there, whether it is today, tomorrow or yesterday for you, and how far ahead or behind you it is. Pick a city from the list and press **Add city**, or press **Remove** to drop one. The list is saved in your browser.

To offer more cities, add an entry to the `CITIES` list near the bottom of `docs/script.js`, using a name and an [IANA time zone](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) such as `Europe/Rome`.

## Notes

- Sound uses `winsound` on Windows and the system bell on macOS and Linux. If you hear nothing on macOS or Linux, check that the system alert sound is on.
- Keep the app window open for alarms to ring. The web version needs its browser tab open too.
- In the web version, the browser only allows sound after you click something, so add an alarm once after opening the page.
- The first time you add an alarm on the website, the browser asks to allow notifications. Choose **Allow** to get a pop-up when the alarm rings. Sound and the on-page alert work even if you say no.

## License

MIT. See [LICENSE](LICENSE).
