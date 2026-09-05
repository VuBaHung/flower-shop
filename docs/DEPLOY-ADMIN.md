# Publishing the admin app

The storefront deploys to GitHub Pages from `.github/workflows/deploy.yml`. The admin app
does **not** — Pages serves static files, and the admin needs a Node server for its login,
session cookie and API routes. It is a separate deployment (PLAN.md §3A.6).

Using **Render** below. Netlify or Railway work the same way; Vercel Hobby is ruled out by
§2's commercial-use constraint.

---

## Before you start

Push your commits first — Render deploys from GitHub, not from your laptop.

```bash
git push origin main
```

---

## Step 1 — Open MongoDB to the host

Render has no fixed IP, so your current "my home IP only" rule will block it.

1. MongoDB Atlas → **Network Access**
2. **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`)
3. Confirm

Safe here: the database password is the actual access control, and it is not public.

---

## Step 2 — Create the Render service

1. <https://render.com> → sign up with GitHub
2. **New +** → **Web Service**
3. Connect `VuBaHung/flower-shop`
4. Fill in:

| Field | Value |
|---|---|
| Name | `flower-shop-admin` |
| Region | Singapore |
| Branch | `main` |
| Root Directory | `admin` |
| Runtime | Node |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Instance Type | Free |

> **Root Directory is the step people miss.** Type exactly `admin` — five letters, no
> quotes, no asterisks, no slashes. Leave it blank and Render builds the storefront
> instead, and the deploy fails in a confusing way.

---

## Step 3 — Environment variables

**Advanced → Add Environment Variable**, once per row. Copy the values from your local
`admin/.env` — that file is git-ignored, so Render cannot see it.

| Key | Where it comes from |
|---|---|
| `MONGODB_URI` | your Atlas connection string |
| `MONGODB_DB` | `flower_shop` |
| `ADMIN_USERNAME` | your local `admin/.env` |
| `ADMIN_PASSWORD_HASH` | your local `admin/.env` |
| `SESSION_SECRET` | your local `admin/.env` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `dan5lrpon` |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | `flower-shop-unsigned` |
| `NODE_VERSION` | `22` |

### The one that will bite you

`ADMIN_PASSWORD_HASH` is stored in `.env` **escaped** (`\$2b\$12\$...`) because dotenv
expands `$`. Render's dashboard is not dotenv — paste the hash **unescaped**:

```
$2b$12$0z05ThDGAhJUdiouhQalNOjxkGoC8E890ieGR3Q9B8gRYN1A.KoRC
```

Remove every backslash. Get this wrong and login fails with "Máy chủ chưa được cấu hình".

Do **not** set `PORT` — Render injects it.

---

## Step 4 — Deploy

**Create Web Service**. First build takes 3–5 minutes. You get:

```
https://flower-shop-admin.onrender.com
```

Open `/login` and sign in.

---

## Step 5 — Wire up the Publish button

Until now the button returns "Chưa cấu hình GITHUB_DISPATCH_TOKEN".

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens**
2. **Generate new token**
   - Repository access: **Only select repositories** → `flower-shop`
   - Permissions → Repository permissions → **Contents: Read and write**
3. Copy the token (shown once)
4. Render → your service → **Environment** → add:

| Key | Value |
|---|---|
| `GITHUB_DISPATCH_TOKEN` | `github_pat_...` |
| `GITHUB_REPO` | `VuBaHung/flower-shop` |

Render redeploys automatically.

---

## Step 6 — Make the storefront read the database

Otherwise the published site is built from `fixtures.json`, not your real products.

GitHub → repo → **Settings → Secrets and variables → Actions**

**Secrets** tab:
- `MONGODB_URI`
- `MONGODB_DB` = `flower_shop`

**Variables** tab:
- `DATA_SOURCE` = `mongo`

---

## Step 7 — Test the whole loop

1. Open the Render admin URL, log in
2. Edit a product name, **Lưu & hiện**
3. **Đăng lên website**
4. GitHub → **Actions** — a "Deploy to GitHub Pages" run should start within seconds
5. After ~2 minutes, the change is live on the storefront

If step 4 shows no run, the token or `GITHUB_REPO` is wrong.

---

## Expected quirks

**First load of the day takes 30–60 seconds.** Render's free tier sleeps after 15 minutes
idle. Normal — wait, don't refresh repeatedly.

**Publishing does not redeploy the admin.** It rebuilds the storefront. The admin only
redeploys when you push code changes to `admin/`.

---

## Before you call it done

- [ ] Rotate the MongoDB password — it was exposed in a chat transcript
- [ ] Rotate the Cloudinary API secret — same
- [ ] Change `admin@123` to something stronger: `cd admin && npm run hash-password -- 'a-longer-passphrase'`, then update the Render env var (unescaped) — the admin login is now reachable from the public internet
- [ ] Test a snapshot restore (PLAN.md §12) — M0 has no automated backup
