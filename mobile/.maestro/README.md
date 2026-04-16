# Maestro Flows

These flows are starter integration tests for the mobile app.

## Prerequisites

- Install Maestro CLI: `curl -Ls "https://get.maestro.mobile.dev" | bash`
- Start the Expo app on a device or emulator
- Open the app in Expo Go or your dev client

## Recommended test accounts

- `shop account`: an account that already owns a shop
- `regular account`: an account without a shop

## Run a single flow

```bash
maestro test mobile/.maestro/flows/profile-saved-posts.yaml -e APP_ID=host.exp.Exponent -e MOBILE_NUMBER=09xxxxxxxx -e OTP_CODE=123456
```

## Included flows

- `login-by-otp.yaml`: signs in if the app is currently on the login screen
- `profile-saved-posts.yaml`: opens saved posts from profile
- `profile-shop-manage-posts.yaml`: opens My Shop, then Manage My Posts
- `profile-shop-open-create-post.yaml`: opens My Shop, then Create New Post

## Notes

- The shop flows require an account that already has a shop.
- The OTP flow requires a valid OTP from your backend.
- These flows currently focus on navigation and screen-level integration.
- Image picking is intentionally not automated here because it is less stable than the core app-navigation flows.
