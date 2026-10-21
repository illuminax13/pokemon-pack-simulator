const {test, expect} = require('@playwright/test');
const H = require('./helpers');
// Playwright's Linux WebKit build has no accelerated compositing and flattens preserve-3d, so the 3D shots are taken in Chromium at iPhone size
test.use({viewport: {width: 390, height: 844}, deviceScaleFactor: 3, isMobile: true, hasTouch: true});
test('3d box screenshots', async ({page}) => {
  test.skip(test.info().project.name !== 'chromium');
  await H.gotoApp(page); await H.chooseSet(page, 12);
  await page.locator('#sbox').click(); await page.locator('#bx3d .bxscene').waitFor(); await page.waitForTimeout(1500);
  await page.screenshot({path: 'screenshot-box-closed.png'});
  await H.tearWrap(page); await page.waitForTimeout(300); await page.screenshot({path: '/tmp/box-torn.png'});
  await H.openLid(page); await page.waitForTimeout(800);
  await page.screenshot({path: 'screenshot-box-open.png'});
  await expect(page.locator('#bxall')).toBeEnabled();
});
