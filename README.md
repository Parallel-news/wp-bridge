# WP-Bridge
Bridging content from WordPress to Arweave network


# Synopsis
the `wp-bridge` allow for WordPress users to archive their blog's database permanently on Arweave without worrying about continious storage costs, data loss, and censorship.

# Install
```bash
npm install -g wp-bridge
```

# Examples

## create a profile & sign in

```bash
wp-bridge sign-up --key-file PATH-TO-YOUR-WALLET.json --wallet-name NAME-LABEL
```

## deploy registry contract

```bash
wp-bridge deploy-contract --blog-name ExampleBlog --blog-url https://your-wp-blog.net
```

## check profile

```bash
wp-bridge profile
```

## fetch content and archive diffs

```bash
wp-bridge fetch-content
```
#### option:
- --dry-run : simulate fetching without uploading to Arweave

## load registry-contract state

```bash
wp-bridge read-registry

```

## signing out

```bash
wp-bridge sign-out
```

## signing in

```bash
wp-bridge sign-in --key-file PATH-TO-YOUR-WALLET.json
```

# License
This project is licensed under the MIT license