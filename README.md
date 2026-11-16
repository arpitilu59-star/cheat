# Public Media Library (PDF + Video)

A beginner-friendly starter project with two separate interfaces:

1. **Local Admin Panel** — run on your own Windows PC with `npm run admin`, then open http://localhost:8787. Upload/delete PDFs and videos.
2. **Public Website** — Next.js site deployed to Vercel. Visitors need no account. They can search, preview and download media.

Media files and `catalog.json` live in Cloudflare R2. GitHub stores only the website/admin source code. This avoids committing large PDFs/videos to Git.

## Important reality checks

- Google indexing is not instant or guaranteed. Connect your domain to Google Search Console and submit `/sitemap.xml`.
- Google search requires internet. Offline viewing means saving the media on each device beforehand.
- PDFs can be embedded in the browser. Videos can be streamed when online and downloaded for offline playback.
- This starter uses a public R2 bucket URL for public media. Anyone with the URL can access public files. Do not upload private/copyright-infringing material.
- The local admin panel binds to `127.0.0.1` only. Do not expose it to the public internet.
- The admin panel password protects the local upload screen, but your R2 API keys must remain in `admin/.env` and must never be committed to GitHub.

## Architecture

- `admin/`: local Express upload dashboard; uploads media to R2 and updates `catalog.json`.
- `site/`: Next.js public library; server-renders media detail pages for search engines.
- Cloudflare R2: media files and public catalogue.
- Vercel: public Next.js website.

## Step 1 — Create Cloudflare R2 bucket

1. Create/sign in to Cloudflare.
2. Open **R2 Object Storage** and create a bucket, e.g. `public-media-library`.
3. In bucket settings, enable public access using an `r2.dev` URL for initial testing, or connect a custom domain for production.
4. Copy the public bucket base URL. It looks like `https://pub-xxxxxxxx.r2.dev` (do not add a trailing slash).
5. Create an R2 API token with **Object Read & Write** permission restricted to this bucket.
6. Copy the Account ID, Access Key ID and Secret Access Key. Keep the secret private.

Cloudflare docs:
- Public buckets: https://developers.cloudflare.com/r2/buckets/public-buckets/
- S3 API: https://developers.cloudflare.com/r2/get-started/s3/

For browser preview and offline fetch, configure bucket CORS to allow GET/HEAD from your Vercel website origin. Example CORS policy:
```json
[
  {
    "AllowedOrigins": ["https://YOUR-PROJECT.vercel.app"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Range", "Accept-Ranges"],
    "MaxAgeSeconds": 3600
  }
]
```
You can temporarily use `*` for AllowedOrigins while testing, then restrict it to your site.

## Step 2 — Configure and run the local Admin Panel

1. Install Node.js LTS: https://nodejs.org/
2. Open a terminal in this project folder.
3. Run:
   ```bash
   cd admin
   npm install
   ```
4. Copy `.env.example` to `.env` and fill in your R2 credentials and public URL.
5. Set a strong `ADMIN_PASSWORD`.
6. Start the admin panel:
   ```bash
   npm run admin
   ```
7. Open http://localhost:8787 and sign in.
8. Upload a PDF or MP4/WebM video. The catalogue updates automatically.

The admin app only listens on your own computer. Keep the terminal window open while uploading.

## Step 3 — Configure the public website

1. Open `site/`.
2. Create `.env.local` using `.env.example`.
3. Set `NEXT_PUBLIC_MEDIA_BASE_URL` to the same R2 public base URL.
4. Test locally:
   ```bash
   cd site
   npm install
   npm run dev
   ```
5. Open http://localhost:3000.

## Step 4 — Push to GitHub

Create a new **private or public** GitHub repository. Public website content is public either way; keeping source private is optional.

From the project root, do not upload `.env` or `.env.local`. The `.gitignore` files already exclude them.

You can use GitHub Desktop:
- Add this project folder as a repository.
- Commit and publish.
- Push changes when you update the website code.

## Step 5 — Deploy `site/` to Vercel

1. Import the GitHub repository into Vercel.
2. Set **Root Directory** to `site`.
3. Add environment variable:
   - `NEXT_PUBLIC_MEDIA_BASE_URL` = your R2 public base URL
4. Deploy.

After deployment, add your Vercel domain in R2 CORS AllowedOrigins.

## Step 6 — Google indexing

1. Open Google Search Console: https://search.google.com/search-console
2. Add and verify your Vercel domain (a custom domain is better).
3. Submit `https://YOUR-DOMAIN/sitemap.xml`.
4. Use URL Inspection to request indexing for important pages.

Google may take days/weeks and does not guarantee every page will be indexed. Each media item has its own server-rendered `/media/ID` page with a title and description.

## Offline use

- On each phone/laptop, open the public site while online.
- Open a media detail page.
- Use **Download for offline** to save a local copy.
- A downloaded PDF/video can be opened without internet using the device's Files/Downloads app.
- A brand-new device with no internet cannot fetch files it has never downloaded.
- Browser storage and PWA caching vary by browser/device; this starter uses reliable file downloads rather than promising unlimited browser cache.

## Updating or deleting media

Use the local Admin Panel. It updates the R2 catalogue; the public website refreshes the catalogue every 60 seconds.

## Limits / cautions

- Public R2 bucket means files are publicly accessible. Never store sensitive documents.
- R2 storage/operations and any custom domain may have costs beyond free allowances. Check current Cloudflare pricing.
- Large video streaming, bandwidth and browser compatibility should be tested with your real files.
- This starter is a basic first version, not a full content-management system. Add backups and moderation before inviting public uploads.
