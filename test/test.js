const { Builder, By, until } = require("selenium-webdriver");

async function loginTest() {
  let driver = await new Builder().forBrowser("chrome").build();

  try {
    // 🔹 open app (Vite dev server)
    await driver.get("http://localhost:5173");

    // 🔹 wait until email input loads
    await driver.wait(until.elementLocated(By.name("email")), 5000);

    // 🔹 enter email
    await driver.findElement(By.name("email")).sendKeys("test@gmail.com");

    // 🔹 enter password
    await driver.findElement(By.name("password")).sendKeys("123456");

    // 🔹 click login
    await driver.findElement(By.xpath("//button[contains(text(),'Log In')]")).click();

    // 🔹 wait for redirect (example: /liberta-home)
  await driver.wait(until.urlContains("liberta-home"), 15000);

    console.log("✅ Login Test Passed");

  } catch (err) {
    console.log("❌ Login Test Failed");
    console.error(err);
  } finally {
    await driver.quit();
  }
}

loginTest();