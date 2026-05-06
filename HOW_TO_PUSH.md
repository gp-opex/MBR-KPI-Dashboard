# How to push the dashboard to GitHub

The dashboard data refreshes automatically 3x a day (00:00 / 08:00 / 16:00 Brisbane).
Pushing the refreshed file to GitHub is a manual step — about 60 seconds.

You don't need git, a terminal, or a Personal Access Token.
You just need to be signed in to GitHub in your browser.

---

## One-time push (or every refresh — your choice how often)

1. Open the file on GitHub:
   https://github.com/gp-opex/MBR-KPI-Dashboard/blob/main/dashboard.html

2. Click the **pencil icon** (top-right corner of the file view, near the "Raw" / "Blame" buttons).

3. The file opens in an editor. **Don't** paste content here — there's an easier way.

4. Press **Ctrl + A** to select everything, then **Delete** to clear it.

5. Open a second browser tab and go to:
   https://github.com/gp-opex/MBR-KPI-Dashboard/upload/main

6. **Drag and drop** the file:
   `C:\Users\andrew.jones\OneDrive - GroundProbe Pty Ltd\Desktop\Operations excellence\AI\MBR and KPI dashboard\Dashboard\dashboard.html`
   onto the upload box.

7. At the bottom, in the commit message, type something like:
   `Refresh dashboard data YYYY-MM-DD`

8. Make sure **"Commit directly to the main branch"** is selected.

9. Click **Commit changes**.

That's it. The file on GitHub is now updated.

---

## Step 5 alternative (just edit-in-place)

If you'd rather not use the upload page:

1. Open Notepad and open the local `Dashboard\dashboard.html`.
2. Press **Ctrl + A**, then **Ctrl + C** (select all + copy).
3. On the GitHub edit page (step 3 above), paste with **Ctrl + V**.
4. Scroll down, type the commit message, click **Commit changes**.

---

## How often should I push?

Whenever you want the GitHub copy to match the local copy. Some options:

- **After every scheduled refresh** (3x a day) — most up-to-date for anyone reading the GitHub copy.
- **Once a day** at the start of your day — simplest habit.
- **Before MBR meetings only** — least effort, GitHub copy lags between meetings.

The local file always has the freshest data (auto-updated by the scheduled task either way).

---

## If you want auto-push later

Auto-push needs a Personal Access Token (PAT) saved on the machine.
We tried setting that up but ran into OneDrive sync trouble with the `.gh-token` file.
Two cleaner ways to revisit later:

1. **Ask IT for a deploy key** scoped to this repo — most "enterprise correct" approach,
   no expiry, no manual token rotation.
2. **GitHub Desktop** — free Microsoft tool. Sign in once, then `git push` works
   without ever managing tokens manually. Install from https://desktop.github.com/.

When you're ready to revisit, ping QMS / Cowork and we can wire up either option.
