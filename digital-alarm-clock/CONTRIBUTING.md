# Contributing

Thanks for taking a look at this project. Suggestions and fixes are welcome.

## Suggest a change

1. Fork the repository.
2. Create a branch: `git checkout -b my-change`.
3. Make your change and test it (see below).
4. Commit with a clear message and open a pull request.

## Test before you submit

- Run `python main.py`, add an alarm one minute ahead, and check that it rings, stops, and snoozes.
- Open `docs/index.html` and repeat the same checks.
- Add an alarm and check that you hear the chime and see the confirmation message.
- Open the World time tab, add and remove a city, and switch the 24-hour option.

## Style

- Keep the Python code simple and use basic features. Short functions with a docstring are preferred.
- Keep the green palette. Colors are defined at the top of `main.py` and in `:root` in `docs/style.css`.

## Ideas for future work

- Repeat days (weekdays only, weekends)
- Choose from several alarm sounds
- Countdown timer and stopwatch tabs
- Search box and more cities for world time
