# Hardik & Vaidehi RSVP app

This project is now set up as a Next.js app for Vercel with Supabase as the RSVP backend.

## Environment variables

Add these in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Database

The app expects a `public.guests` table with these columns:

- `id`
- `Party (Optional)`
- `Last Name`
- `First Name`
- `attending`
- `created_at`
- `updated_at`

## RSVP flow

- guest searches by name
- matching party is shown together
- each guest gets `Attending` or `Not attending`
- submit updates the `attending` column in Supabase

## Important

Make sure your guest CSV has been imported into Supabase before testing search and RSVP updates.
