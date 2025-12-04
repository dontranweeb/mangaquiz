# Manga Page Quiz

A quiz game where players guess manga titles from random page previews using the MangaDex API.

## ACKNOWLEDGEMENT

Grateful to Mangadex for providing this API allowing us to play "quiz" like gameplay for users to guess and recognize mangas they have read.

## Project Structure

- **`client/`** - Next.js React application (main application)
  - Full-featured quiz game with timer, scoring, and multiple choice options
  - Direct API integration with MangaDex

- **`archive/`** - Prototype scripts (deprecated, kept for reference)
  - Initial JavaScript and Python scripts used to explore the API

## Current Status

✅ Frontend implemented and functional
✅ Game logic complete with rounds, scoring, and timer
✅ Multiple choice quiz format
✅ Currently using CORS for mangaPage loading since local host...
🔄 Chat feature and multiplayer (coming soon)

## Future implementations

🔄 During deployment phase, switch from CORS to Next.JS API route proxy (/api/manga-image/route.ts) since MangaDex API does not support CORS for external domains.
