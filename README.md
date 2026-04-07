# Engagement site + static-friendly RSVP

This branch converts the repository into a polished engagement party website that works well on GitHub Pages and uses a lightweight RSVP flow.

## What is included

- `index.html` — main landing page
- `style.css` — full site styling
- `app.js` — invite lookup + RSVP logic
- `data/guests.csv` — guest lookup data
- `apps-script/Code.gs` — Google Apps Script receiver for RSVP submissions
- `.nojekyll` — prevents GitHub Pages from processing the site with Jekyll

## Important architecture note

This site is static on the front end. The guest list is looked up from `data/guests.csv`, which is public once deployed to GitHub Pages. Do not put private mailing addresses or anything sensitive in that file.

For live RSVP saving, the site posts RSVP payloads to a Google Apps Script web app that writes rows into a Google Sheet.

## Setup steps

### 1. Update the guest list

Edit `data/guests.csv`.

Columns:

- `invite_code`
- `party_name`
- `guest_name`
- `email`
- `allowed_plus_ones`
- `max_party_size`
- `meal_options`

Example meal options format:

`Vegetarian|Chicken|Fish`

Guests in the same party should share the same `invite_code` and `party_name`.

### 2. Create the Google Sheet

Create a Google Sheet with a tab named:

`RSVP Responses`

Add this header row:

`timestamp, inviteCode, partyName, guestNames, attendance, guestCount, mealChoice, email, phone, songRequest, notes, submittedAt`

### 3. Create the Apps Script receiver

- Open Google Apps Script
- Create a new project
- Paste in the contents of `apps-script/Code.gs`
- Replace `PASTE_YOUR_GOOGLE_SHEET_ID_HERE` with your actual Google Sheet ID
- Deploy as a web app
- Access: Anyone with the link
- Copy the deployed web app URL

### 4. Connect the site to the receiver

Open `app.js` and replace:

`PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE`

with your deployed Apps Script URL.

### 5. Publish with GitHub Pages

After merging this branch:

- Go to repo Settings
- Open Pages
- Set the source to deploy from the `main` branch root
- Save

## Current limitations

- Since the guest file is static and public, invite codes are only lightly private, not secure
- This is intentionally lightweight, not a fully authenticated wedding platform
- If the Apps Script URL is not configured yet, the site falls back to downloading the RSVP payload as a JSON file for testing

## Suggested next improvements

- Replace placeholder event details with your real venue, address, and hotel block
- Add your photos
- Add a registry section if needed
- Add a custom domain later
