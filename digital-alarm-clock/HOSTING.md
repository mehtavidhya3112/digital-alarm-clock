# Hosting on GitHub Pages

This guide puts the web version of the alarm clock online at `https://YOUR-USERNAME.github.io/digital-alarm-clock/`.

## 1. Install Git

Download it from <https://git-scm.com/downloads> and check it works:

```bash
git --version
```

## 2. Create the repository

1. Sign in at <https://github.com> and click **New repository**.
2. Name it `digital-alarm-clock`, keep it **Public**, and leave "Add a README" unticked.
3. Click **Create repository**.

## 3. Push the project from VS Code

Open the project folder in VS Code, open the terminal (**Ctrl + `**), and run:

```bash
git init
git add .
git commit -m "Add digital alarm clock"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/digital-alarm-clock.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username.

## 4. Turn on GitHub Pages

1. In the repository, open **Settings > Pages**.
2. Under **Build and deployment > Source**, choose **Deploy from a branch**.
3. Pick branch **main** and folder **/docs**, then click **Save**.
4. Wait one to two minutes. The page shows your live link at the top.

## 5. Update the site later

```bash
git add .
git commit -m "Describe your change"
git push
```

The site refreshes by itself after each push.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| 404 page | Check that Pages is set to branch `main` and folder `/docs`, and that `docs/index.html` exists. |
| Page looks unstyled | Make sure `style.css` and `script.js` are in the same folder as `index.html`. |
| No sound | Click **Add alarm** once after opening the page so the browser allows audio. |
| Old version still showing | Hard refresh with **Ctrl + Shift + R**. |
