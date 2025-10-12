# GPG Commit Signing Setup

This guide explains how to set up GPG signing for automated release commits.

## Why Sign Commits?

Signed commits provide:

- **Verification**: Proves the commit came from an authorized source
- **Security**: Prevents commit spoofing
- **Trust**: GitHub shows "Verified" badge on signed commits

## Setup Instructions

### Step 1: Generate a GPG Key

```bash
# Generate a new GPG key
gpg --full-generate-key

# Select:
# - RSA and RSA (default)
# - 4096 bits
# - Key doesn't expire (or set expiration)
# - Enter your name (e.g., "ManagerOS Release Bot")
# - Enter email: github-actions[bot]@users.noreply.github.com
# - Enter a secure passphrase
```

### Step 2: Export the GPG Key

```bash
# List your GPG keys
gpg --list-secret-keys --keyid-format=long

# You'll see output like:
# sec   rsa4096/ABC123DEF456 2024-01-01 [SC]
# The key ID is: ABC123DEF456

# Export the private key (replace ABC123DEF456 with your key ID)
gpg --armor --export-secret-keys ABC123DEF456 > gpg-private-key.asc

# Export the public key
gpg --armor --export ABC123DEF456 > gpg-public-key.asc
```

### Step 3: Add Keys to GitHub

#### Add to Repository Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add two secrets:
   - **Name**: `GPG_PRIVATE_KEY`
     - **Value**: Paste the entire content of `gpg-private-key.asc`
   - **Name**: `GPG_PASSPHRASE`
     - **Value**: The passphrase you set when creating the key

#### Add Public Key to GitHub Account

1. Copy the content of `gpg-public-key.asc`
2. Go to GitHub **Settings** → **SSH and GPG keys**
3. Click **New GPG key**
4. Paste the public key content
5. Click **Add GPG key**

### Step 4: Clean Up

```bash
# IMPORTANT: Delete the exported key files
rm gpg-private-key.asc gpg-public-key.asc

# Optionally, delete the key from your local machine
gpg --delete-secret-keys ABC123DEF456
gpg --delete-keys ABC123DEF456
```

## Verification

After setup, when a PR is merged:

1. The workflow will use the GPG key to sign the release commit
2. The commit will show as "Verified" on GitHub
3. The GitHub release will be properly signed

## Alternative: Using Your Personal GPG Key

If you want to use your personal GPG key instead:

```bash
# Export your existing key (replace with your key ID)
gpg --armor --export-secret-keys YOUR_KEY_ID > gpg-private-key.asc

# Follow Step 3 above to add to GitHub secrets
```

**Note**: Make sure the email in your GPG key matches the git config email in the workflow.

## Troubleshooting

### "gpg: signing failed: Inappropriate ioctl for device"

This shouldn't happen in GitHub Actions, but if you see this error locally:

```bash
export GPG_TTY=$(tty)
```

### "gpg: signing failed: No secret key"

- Verify the `GPG_PRIVATE_KEY` secret is set correctly
- Ensure the full key content is copied, including headers:

  ```
  -----BEGIN PGP PRIVATE KEY BLOCK-----
  ...
  -----END PGP PRIVATE KEY BLOCK-----
  ```

### Commits Not Showing as Verified

- Ensure the public key is added to your GitHub account
- Verify the email in the GPG key matches the git config email
- Check that the key hasn't expired

## Security Notes

- ✅ Keep your private key and passphrase secure
- ✅ Store them only in GitHub Secrets (encrypted)
- ✅ Never commit GPG keys to the repository
- ✅ Delete local copies of exported keys immediately
- ✅ Set an expiration date on keys (recommended: 1-2 years)
- ✅ Rotate keys periodically

## Resources

- [GitHub: Managing commit signature verification](https://docs.github.com/en/authentication/managing-commit-signature-verification)
- [GitHub Actions: crazy-max/ghaction-import-gpg](https://github.com/crazy-max/ghaction-import-gpg)
