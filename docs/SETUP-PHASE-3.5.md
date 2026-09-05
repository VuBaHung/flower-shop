# Phase 3.5 — creating the accounts

Everything in Phases 3 and 3B is built and runs against an empty `.env`. This is the
checklist for switching it to live data. PLAN.md §3A.7.

## 1. MongoDB Atlas (free M0)

1. Create an account → new **free M0** cluster (pick the Singapore region — closest to HCMC)
2. **Database Access** → add a user with a strong generated password
3. **Network Access** → allow the admin host's IP, plus `0.0.0.0/0` if the host has no
   static IP (Render and Netlify free tiers do not)
4. Copy the connection string

```
MONGODB_URI=mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=flower_shop
```

Seed the twelve fixture products so there's something to edit:

```bash
MONGODB_URI='...' MONGODB_DB=flower_shop npm run seed
```

## 2. Cloudinary (free)

1. Create an account, note the **cloud name**
2. **Settings → Upload → Upload presets** → add an **unsigned** preset
3. On that preset set:
   - Folder: `flower-shop`
   - Incoming transformation: `f_webp,q_auto:good,w_1200,c_limit`
   - Max file size: 150 KB

That transformation is where PLAN.md §2's ≤150KB rule is actually enforced — the admin
never resizes anything by hand.

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=flower-shop-unsigned
```

## 3. Admin credentials

```bash
cd admin
npm run hash-password -- 'a-long-password-you-choose'
```

Paste its output verbatim into `admin/.env`, **including the backslashes**. bcrypt hashes
contain `$`, which dotenv expands as a variable — unescaped, the hash is silently
truncated and the login fails with a confusing error. The script emits the escaped form.

```
ADMIN_USERNAME=chushop
ADMIN_PASSWORD_HASH=\$2b\$12\$...
SESSION_SECRET=<generated>
```

## 4. Publish button

1. GitHub → **Settings → Developer settings → Fine-grained tokens**
2. New token, this repo only, **Contents: read and write**

```
GITHUB_DISPATCH_TOKEN=github_pat_...
GITHUB_REPO=your-username/flower-shop
```

## 5. Storefront build secrets

In the repo: **Settings → Secrets and variables → Actions**

- Secret `MONGODB_URI`, secret `MONGODB_DB`
- Variable `DATA_SOURCE` = `mongo`

Until `DATA_SOURCE` is set, the site keeps building from fixtures — so this is the single
switch that takes the storefront live on real data.

## 6. Deploy the admin app

`admin/` is a separate deployment and needs a Node server (PLAN.md §3A.6). Vercel Hobby is
ruled out by §2's commercial-use constraint. Verify current free-tier terms before
committing — they move.

Set every `admin/.env` value in the host's environment settings. Never commit `.env`.

## 7. Before launch — test a restore

PLAN.md §12 requires this, and it is the one step people skip:

```bash
npm run snapshot                       # writes data/snapshots/<date>.json
# then confirm you can mongoimport that file back into a scratch database
```

MongoDB M0 has no automated backup. An untested backup is not a backup.
