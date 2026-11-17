# Storefront home themes

Each visual preset owns its standalone Angular component and SCSS in its own folder. Theme components project the same home content; product fetching, section order, navigation, and checkout remain shared.

## Add a theme

1. Add a `HomeThemeId` value in `home-theme-frame.component.ts` and create a folder with a standalone wrapper component and its SCSS.
2. Import that component in the frame and add a `@case` that projects `<ng-content />` into it.
3. Add an option and preview in `AdminSettingsComponent.homeThemeOptions`.
4. Add the identifier to `StoreLayout.homeTheme` in the frontend and to the backend allowlist in `AppDAL/Entities/StoreLayout.cs`.
5. Document the new option in the backend `wwwroot/docs/store-seeding-guide-ar.txt` and the root `STORE_SEEDING_GUIDE_AR.md`.

Avoid product/data requests in a theme component. Keep each theme focused on its visual structure and responsive styles.
