# Storefront themes

HomeComponent dispatches by StoreLayout.homeTheme. Each theme owns a standalone component and styles. Editorial and discovery also own their HTML templates and inherit the shared data/actions from HomeSectionsComponent. Classic and cards retain HomeContentComponent.

Active content lives in StoreLayout.sections. Admin switching snapshots sections/useCustomHome into homeProfiles keyed by theme, and restores the target profile. Identity colors and fonts are shared. Backend validates profile content and includes it in package reference remapping.

To add a theme: create its folder/component, register it in home.component.ts, add its ID to the frontend model and backend allowlists, and add an admin option/default content. Keep catalog access and product interactions shared; keep presentation in theme files.
