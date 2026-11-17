# Host RipKit privately

This deployment keeps RipKit always on without exposing its port directly to
the internet. A Cloudflare Tunnel is the only ingress, and Cloudflare Access
requires an email one-time code for the two approved people.

## What to buy

Use a **DigitalOcean Basic Droplet with 2 GB RAM / 50 GB SSD**. It is ample for
two people and leaves room for yt-dlp and FFmpeg to run. The 1 GB plan can work
for a simple site but is too tight for concurrent Node, yt-dlp, and FFmpeg work.
Choose Ubuntu 24.04 and turn on backups if the finished downloads matter.

You also need a domain. Add it to Cloudflare; `rip.example.com` will be the
bookmark both users use.

## First server setup

Create the Droplet with an SSH key, then run the following as `root` using the
DigitalOcean console or SSH. Replace the public key with the deploy key that
GitHub Actions will use.

```sh
apt-get update
apt-get install -y docker.io docker-compose-plugin rsync
adduser --disabled-password --gecos '' deploy
usermod -aG docker deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh /opt/ripkit
```

Add the GitHub Actions public deploy key to `/home/deploy/.ssh/authorized_keys`,
then make the app directory owned by that user:

```sh
chown -R deploy:deploy /opt/ripkit
```

Keep the firewall simple: allow SSH only; do **not** open port 3000. The
Cloudflare Tunnel makes an outbound connection, so it needs no inbound HTTP
port.

## Cloudflare Access

1. In Cloudflare Zero Trust, create a tunnel and install it with the Docker
   connector option.
2. Create public hostname `rip.your-domain.com` and point its service to
   `http://ripkit:3000`.
3. Create a **Self-hosted** Access application for that hostname.
4. Add one Allow policy with only your email address and your friend's email
   address. Use email one-time PIN as the login method and a session duration
   such as 30 days.
5. Copy the tunnel token into `/opt/ripkit/.env` as
   `CLOUDFLARE_TUNNEL_TOKEN=...`.

Do not add an `Everyone` or `All valid emails` Access rule. Those would make
the app reachable by strangers who can authenticate with their own email.

## GitHub automatic deployment

Add these repository secrets under **Settings → Secrets and variables →
Actions**:

| Secret | Value |
| --- | --- |
| `DEPLOY_HOST` | Droplet IPv4 address |
| `DEPLOY_SSH_KEY` | private half of the Actions deploy key |
| `DEPLOY_KNOWN_HOSTS` | exact output of `ssh-keyscan -H YOUR_DROPLET_IP` |

Push to `main`. The deployment workflow copies the app to the server and runs
`docker compose up -d --build`. Persistent downloads and ZIPs live in Docker's
`ripkit_data` volume and survive deploys.

## Backup and updates

DigitalOcean backups are the easiest recovery route. To update application
code, push a commit to `main`; no SSH session is needed. For an emergency
restart, open the Droplet console and run:

```sh
cd /opt/ripkit && docker compose up -d
```
