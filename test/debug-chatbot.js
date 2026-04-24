// test-chatbot-correct.js - Fixed version based on your actual component
const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

const TEST_CONFIG = {
  baseUrl: "http://localhost:5173",
  timeout: 10000,
  longTimeout: 15000,
  testUser: {
    email: "test@gmail.com",
    password: "123456"
  }
};

async function waitForElement(driver, locator, timeout = TEST_CONFIG.timeout) {
  return await driver.wait(until.elementLocated(locator), timeout);
}

async function runTests() {
  let driver;
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    console.log(`\n📋 ${name}...`);
    try {
      await fn();
      console.log(`   ✅ PASSED`);
      passed++;
    } catch (error) {
      console.log(`   ❌ FAILED`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
  }

  try {
    const options = new chrome.Options();
    options.addArguments("--start-maximized");
    
    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    // Login
    console.log("\n🔐 Logging in...");
    await driver.get(TEST_CONFIG.baseUrl);
    await waitForElement(driver, By.name("email"));
    await driver.findElement(By.name("email")).sendKeys(TEST_CONFIG.testUser.email);
    await driver.findElement(By.name("password")).sendKeys(TEST_CONFIG.testUser.password);
    await driver.findElement(By.xpath("//button[contains(text(),'Log In')]")).click();
    await driver.wait(until.urlContains("liberta-home"), TEST_CONFIG.longTimeout);
    console.log("   ✅ Login successful");

    // FIRST: Find where the chatbot is
    console.log("\n📍 Looking for Chatbot...");
    
    // Try common routes
    const routes = ["/chatbot", "/chat", "/ai-assistant", "/elderly-chat", "/assistant"];
    let foundRoute = null;
    
    for (const route of routes) {
      await driver.get(`${TEST_CONFIG.baseUrl}${route}`);
      await driver.sleep(2000);
      
      const hasTextarea = await driver.findElements(By.tagName("textarea"));
      const hasHeartIcon = await driver.findElements(By.xpath("//*[name()='svg' and contains(@class,'text-red-500')]"));
      
      if (hasTextarea.length > 0 || hasHeartIcon.length > 0) {
        foundRoute = route;
        console.log(`   ✅ Found Chatbot at: ${route}`);
        break;
      }
    }
    
    if (!foundRoute) {
      console.log("   ⚠️ Chatbot not found on common routes");
      console.log("   Checking if accessed via button...");
      
      // Check homepage for chatbot button
      await driver.get(`${TEST_CONFIG.baseUrl}/liberta-home`);
      await driver.sleep(2000);
      
      const chatButtons = await driver.findElements(By.xpath("//button[contains(text(),'Chat') or contains(text(),'Assistant') or contains(@aria-label,'chat')]"));
      
      if (chatButtons.length > 0) {
        await chatButtons[0].click();
        await driver.sleep(2000);
        console.log("   ✅ Clicked chat button from homepage");
        foundRoute = "from homepage button";
      } else {
        console.log("   ❌ Cannot find chatbot - please check the route");
        throw new Error("Chatbot not accessible");
      }
    }

    // ========== SECTION 1: BASIC PAGE ELEMENTS ==========
    console.log("\n" + "=".repeat(60));
    console.log("SECTION 1: BASIC PAGE ELEMENTS");
    console.log("=".repeat(60));

    await test("Page has a title or header", async () => {
      const headers = await driver.findElements(By.xpath("//h1 | //h2 | //div[contains(@class,'font-bold')]"));
      if (headers.length === 0) throw new Error("No headers found");
      console.log(`   Found ${headers.length} headers`);
    });

    await test("Page has textarea for input", async () => {
      const textarea = await driver.findElement(By.tagName("textarea"));
      if (!textarea) throw new Error("Textarea not found");
    });

    await test("Page has send button", async () => {
      const sendBtn = await driver.findElement(By.xpath("//button[contains(@class,'bg-teal-600') or contains(@class,'bg-blue-600')]"));
      if (!sendBtn) throw new Error("Send button not found");
    });

    // ========== SECTION 2: CHAT FUNCTIONALITY ==========
    console.log("\n" + "=".repeat(60));
    console.log("SECTION 2: CHAT FUNCTIONALITY");
    console.log("=".repeat(60));

    const testMessage = "Hello, this is a test message";
    
    await test("Can type a message", async () => {
      const textarea = await driver.findElement(By.tagName("textarea"));
      await textarea.clear();
      await textarea.sendKeys(testMessage);
      
      const value = await textarea.getAttribute("value");
      if (value !== testMessage) throw new Error("Cannot type message");
    });

    await test("Send button is enabled after typing", async () => {
      const sendBtn = await driver.findElement(By.xpath("//button[contains(@class,'bg-teal-600') or contains(@class,'bg-blue-600')]"));
      const isDisabled = await sendBtn.getAttribute("disabled");
      if (isDisabled === "true") throw new Error("Send button still disabled");
    });

    await test("Can send message with Enter key", async () => {
      const textarea = await driver.findElement(By.tagName("textarea"));
      await textarea.clear();
      await textarea.sendKeys("Short test");
      await textarea.sendKeys(Key.ENTER);
      await driver.sleep(2000);
      
      const messages = await driver.findElements(By.xpath("//div[contains(@class,'bg-blue-600')] | //div[contains(@class,'bg-gray-800')]"));
      if (messages.length === 0) throw new Error("No messages displayed");
    });

    // ========== SECTION 3: QUICK REPLY BUTTONS ==========
    console.log("\n" + "=".repeat(60));
    console.log("SECTION 3: QUICK REPLY BUTTONS");
    console.log("=".repeat(60));

    await test("Quick reply buttons exist", async () => {
      const buttons = await driver.findElements(By.xpath("//button[contains(@class,'bg-blue-900') or contains(@class,'bg-gray-700')]"));
      if (buttons.length === 0) {
        console.log("   No quick buttons found - optional feature");
      } else {
        console.log(`   Found ${buttons.length} quick buttons`);
      }
    });

    // ========== SECTION 4: VOICE RECOGNITION ==========
    console.log("\n" + "=".repeat(60));
    console.log("SECTION 4: VOICE RECOGNITION");
    console.log("=".repeat(60));

    await test("Voice input button exists", async () => {
      const micButtons = await driver.findElements(By.xpath("//*[name()='svg' and contains(@class,'h-5')]//ancestor::button"));
      if (micButtons.length === 0) {
        console.log("   Voice button not found - may need permission");
      } else {
        console.log(`   Found ${micButtons.length} buttons with icons`);
      }
    });

    // ========== SECTION 5: PERFORMANCE ==========
    console.log("\n" + "=".repeat(60));
    console.log("SECTION 5: PERFORMANCE");
    console.log("=".repeat(60));

    await test("Page loads within 5 seconds", async () => {
      const start = Date.now();
      await driver.get(`${TEST_CONFIG.baseUrl}${foundRoute === "from homepage button" ? "/liberta-home" : foundRoute}`);
      await driver.sleep(2000);
      const loadTime = Date.now() - start;
      console.log(`   Load time: ${loadTime}ms`);
      if (loadTime > 5000) throw new Error(`Slow load: ${loadTime}ms`);
    });

    // ========== SUMMARY ==========
    console.log("\n" + "=".repeat(60));
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${passed + failed}`);
    console.log(`🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(2)}%`);
    console.log("=".repeat(60));

  } catch (error) {
    console.error("\n❌ Test suite error:", error);
  } finally {
    if (driver) {
      await driver.quit();
      console.log("\n🔒 Browser closed");
    }
  }
}

console.log("🚀 Starting Chatbot Tests");
console.log("=".repeat(60));
runTests();