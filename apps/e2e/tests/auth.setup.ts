import { test as setup } from "@playwright/test";
import { MEMBER, OWNER, signUp } from "./helpers.js";

// Each person signs in once through the real email-code flow; later specs reuse the session.
for (const person of [OWNER, MEMBER]) {
  setup(`sign up ${person.email}`, async ({ page }) => {
    await signUp(page, person.email, person.name);
    await page.context().storageState({ path: person.state });
  });
}
