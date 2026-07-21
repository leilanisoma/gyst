import { chromium } from "playwright";
import fs from "node:fs";

const cookieLine = fs.readFileSync("/tmp/gyst_cookies.txt", "utf8")
  .split("\n")
  .find((l) => l.includes("sb-iygdvkgvjtiiyyfqlnfo-auth-token") && !l.startsWith("#"));
const value = cookieLine.split("\t")[6];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addCookies([{
  name: "sb-iygdvkgvjtiiyyfqlnfo-auth-token",
  value,
  domain: "localhost",
  path: "/",
}]);
const page = await context.newPage();
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForTimeout(500);

await page.getByRole("button", { name: "Journal" }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: "/tmp/j1-quick.png" });

await page.getByText("View full inbox").click();
await page.waitForTimeout(200);
await page.screenshot({ path: "/tmp/j2-full.png" });

const info = await page.evaluate(() => ({
  textareaCount: document.querySelectorAll("textarea").length,
  dialogCount: document.querySelectorAll('[data-slot="dialog-content"]').length,
  url: location.pathname,
}));
console.log(JSON.stringify(info));

await page.getByRole("button", { name: "Back" }).click();
await page.waitForTimeout(200);
await page.screenshot({ path: "/tmp/j3-back-to-quick.png" });

await browser.close();
