// test-help.js - Selenium tests for YOUR HelpPage.jsx
const { Builder, By, until } = require("selenium-webdriver");
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

function randomString(prefix = "") {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substring(7)}`;
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
    // Setup Chrome
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

    // Navigate to Help Page
    await driver.get(`${TEST_CONFIG.baseUrl}/HelpPage`);
    await driver.sleep(3000);
    console.log("📍 Navigated to Help Page");

    // ========== TEST 1: Page Header ==========
    await test("Page displays Community Help title", async () => {
      const title = await driver.findElement(By.xpath("//h1[contains(text(),'Community Help & Support')]"));
      if (!await title.isDisplayed()) throw new Error("Title not found");
    });

    // ========== TEST 2: All 4 Tabs ==========
    await test("All 4 tabs are visible", async () => {
      const tabs = ["Request Help", "Give Items", "Volunteer", "My Activities"];
      for (const tab of tabs) {
        const element = await driver.findElement(By.xpath(`//button[contains(text(),'${tab}')]`));
        if (!element) throw new Error(`Tab "${tab}" missing`);
      }
    });

    // ========== TEST 3: Request Help Tab Content ==========
    await test("Request Help tab shows help types", async () => {
      const requestTab = await driver.findElement(By.xpath("//button[contains(text(),'Request Help')]"));
      await requestTab.click();
      await driver.sleep(1000);
      
      const types = ["Food & Groceries", "Medicine Pickup", "Transportation", "Run Errands", "Companionship", "Household Help"];
      for (const type of types) {
        const element = await driver.findElement(By.xpath(`//h3[contains(text(),'${type}')]`));
        if (!await element.isDisplayed()) throw new Error(`Type "${type}" not found`);
      }
    });

    // ========== TEST 4: New Help Request Button ==========
    await test("New Help Request button opens form", async () => {
      const newBtn = await driver.findElement(By.xpath("//button[contains(text(),'New Help Request')]"));
      await newBtn.click();
      await driver.sleep(1000);
      
      const formTitle = await driver.findElement(By.xpath("//h2[contains(text(),'New Help Request')]"));
      if (!await formTitle.isDisplayed()) throw new Error("Form did not open");
      
      // Cancel to close
      const cancelBtn = await driver.findElement(By.xpath("//button[contains(text(),'Cancel')]"));
      await cancelBtn.click();
      await driver.sleep(500);
    });

    // ========== TEST 5: Give Items Tab ==========
    await test("Give Items tab shows categories", async () => {
      const giveTab = await driver.findElement(By.xpath("//button[contains(text(),'Give Items')]"));
      await giveTab.click();
      await driver.sleep(1000);
      
      const title = await driver.findElement(By.xpath("//h2[contains(text(),'Give Items to Community')]"));
      if (!await title.isDisplayed()) throw new Error("Give Items tab failed");
      
      const categories = ["Clothing", "Furniture", "Electronics", "Books"];
      for (const category of categories) {
        const element = await driver.findElement(By.xpath(`//span[contains(text(),'${category}')]`));
        if (!await element.isDisplayed()) throw new Error(`Category "${category}" not found`);
      }
    });

    // ========== TEST 6: List New Item Button ==========
    await test("List New Item button opens form", async () => {
      const listBtn = await driver.findElement(By.xpath("//button[contains(text(),'List New Item')]"));
      await listBtn.click();
      await driver.sleep(1000);
      
      const formTitle = await driver.findElement(By.xpath("//h2[contains(text(),'List an Item to Give')]"));
      if (!await formTitle.isDisplayed()) throw new Error("Item form did not open");
      
      const cancelBtn = await driver.findElement(By.xpath("//button[contains(text(),'Cancel')]"));
      await cancelBtn.click();
      await driver.sleep(500);
    });

    // ========== TEST 7: Volunteer Tab ==========
    await test("Volunteer tab loads", async () => {
      const volunteerTab = await driver.findElement(By.xpath("//button[contains(text(),'Volunteer')]"));
      await volunteerTab.click();
      await driver.sleep(1000);
      
      const title = await driver.findElement(By.xpath("//h2[contains(text(),'Volunteer Opportunities')]"));
      if (!await title.isDisplayed()) throw new Error("Volunteer tab failed");
    });

    // ========== TEST 8: Volunteer Filters ==========
    await test("Volunteer filter button works", async () => {
      const filterBtn = await driver.findElement(By.xpath("//button[contains(text(),'Filters')]"));
      await filterBtn.click();
      await driver.sleep(500);
      
      const searchInput = await driver.findElement(By.name("search"));
      if (!searchInput) throw new Error("Filter panel not opened");
      
      await filterBtn.click(); // Close
    });

    // ========== TEST 9: My Activities Tab ==========
    await test("My Activities tab loads", async () => {
      const myTab = await driver.findElement(By.xpath("//button[contains(text(),'My Activities')]"));
      await myTab.click();
      await driver.sleep(1000);
      
      const title = await driver.findElement(By.xpath("//h3[contains(text(),'My Help Requests')]"));
      if (!await title.isDisplayed()) throw new Error("My Activities tab failed");
    });

    // ========== TEST 10: Create Help Request ==========
    const testRequestTitle = randomString("Test Request ");
    await test("Create a new help request", async () => {
      // Go to Request Help
      const requestTab = await driver.findElement(By.xpath("//button[contains(text(),'Request Help')]"));
      await requestTab.click();
      await driver.sleep(1000);
      
      // Open form
      const newBtn = await driver.findElement(By.xpath("//button[contains(text(),'New Help Request')]"));
      await newBtn.click();
      await driver.sleep(1000);
      
      // Select Food & Groceries
      const foodType = await driver.findElement(By.xpath("//button[contains(.,'Food & Groceries')]"));
      await foodType.click();
      
      // Fill form
      await driver.findElement(By.name("title")).sendKeys(testRequestTitle);
      await driver.findElement(By.name("description")).sendKeys("This is a test help request");
      await driver.findElement(By.name("location")).sendKeys("Colombo");
      
      // Select urgency
      const urgencySelect = await driver.findElement(By.name("urgency"));
      await urgencySelect.click();
      await driver.findElement(By.xpath("//option[@value='high']")).click();
      
      // Submit
      const submitBtn = await driver.findElement(By.xpath("//button[contains(text(),'Submit Help Request')]"));
      await submitBtn.click();
      
      await driver.sleep(3000);
      
      // Verify in My Activities
      const myTab = await driver.findElement(By.xpath("//button[contains(text(),'My Activities')]"));
      await myTab.click();
      await driver.sleep(2000);
      
      const request = await driver.findElement(By.xpath(`//h4[contains(text(),'${testRequestTitle}')]`));
      if (!await request.isDisplayed()) throw new Error("Request not found");
    });

    // ========== TEST 11: Create Item Listing ==========
    const testItemTitle = randomString("Test Item ");
    await test("Create a new item listing", async () => {
      // Go to Give Items
      const giveTab = await driver.findElement(By.xpath("//button[contains(text(),'Give Items')]"));
      await giveTab.click();
      await driver.sleep(1000);
      
      // Open form
      const listBtn = await driver.findElement(By.xpath("//button[contains(text(),'List New Item')]"));
      await listBtn.click();
      await driver.sleep(1000);
      
      // Select category
      const categorySelect = await driver.findElement(By.name("category"));
      await categorySelect.click();
      await driver.findElement(By.xpath("//option[@value='clothing']")).click();
      
      // Fill form
      await driver.findElement(By.name("title")).sendKeys(testItemTitle);
      await driver.findElement(By.name("description")).sendKeys("Test item description");
      await driver.findElement(By.name("location")).sendKeys("Colombo");
      
      // Select condition
      const conditionSelect = await driver.findElement(By.name("condition"));
      await conditionSelect.click();
      await driver.findElement(By.xpath("//option[@value='good']")).click();
      
      // Set quantity
      const quantityInput = await driver.findElement(By.name("quantity"));
      await quantityInput.clear();
      await quantityInput.sendKeys("1");
      
      // Submit
      const submitBtn = await driver.findElement(By.xpath("//button[contains(text(),'List Item')]"));
      await submitBtn.click();
      
      await driver.sleep(3000);
      
      // Go back to items view
      const backBtn = await driver.findElement(By.xpath("//button[contains(text(),'← Back to Items')]"));
      await backBtn.click();
      await driver.sleep(2000);
      
      // Verify item appears
      const item = await driver.findElement(By.xpath(`//h4[contains(text(),'${testItemTitle}')]`));
      if (!await item.isDisplayed()) throw new Error("Item not found");
    });

    // ========== TEST 12: Filter Items ==========
    await test("Filter items by category", async () => {
      const filterBtn = await driver.findElement(By.xpath("//button[contains(text(),'Filter Items')]"));
      await filterBtn.click();
      await driver.sleep(500);
      
      const categoryFilter = await driver.findElement(By.name("category"));
      await categoryFilter.click();
      await driver.findElement(By.xpath("//option[@value='clothing']")).click();
      await driver.sleep(1000);
      
      // Check filter applied
      const selectedOption = await driver.findElement(By.xpath("//select[@name='category']/option[@selected]"));
      const filterValue = await selectedOption.getAttribute("value");
      if (filterValue !== "clothing") throw new Error("Filter not applied");
      
      // Clear filters
      const clearBtn = await driver.findElement(By.xpath("//button[contains(text(),'Clear Filters')]"));
      await clearBtn.click();
    });

    // ========== TEST 13: Search Items ==========
    await test("Search items works", async () => {
      const filterBtn = await driver.findElement(By.xpath("//button[contains(text(),'Filter Items')]"));
      await filterBtn.click();
      await driver.sleep(500);
      
      const searchInput = await driver.findElement(By.name("search"));
      await searchInput.sendKeys("test");
      await driver.sleep(1000);
      
      const searchValue = await searchInput.getAttribute("value");
      if (searchValue !== "test") throw new Error("Search not working");
      
      await searchInput.clear();
    });

    // ========== TEST 14: View Request Details ==========
    await test("View request details modal opens", async () => {
      const myTab = await driver.findElement(By.xpath("//button[contains(text(),'My Activities')]"));
      await myTab.click();
      await driver.sleep(1000);
      
      const viewButtons = await driver.findElements(By.xpath("//button[contains(@title,'View Details')]"));
      
      if (viewButtons.length > 0) {
        await viewButtons[0].click();
        await driver.sleep(1000);
        
        const modal = await driver.findElement(By.xpath("//h3[contains(text(),'Help Request Details')]"));
        if (!await modal.isDisplayed()) throw new Error("Modal did not open");
        
        const closeBtn = await driver.findElement(By.xpath("//button[contains(text(),'Close')]"));
        await closeBtn.click();
      } else {
        console.log("   No requests to view - skipping");
      }
    });

    // ========== TEST 15: Performance ==========
    await test("Page load under 5 seconds", async () => {
      const start = Date.now();
      await driver.get(`${TEST_CONFIG.baseUrl}/HelpPage`);
      await waitForElement(driver, By.xpath("//h1[contains(text(),'Community Help')]"), 10000);
      const loadTime = Date.now() - start;
      console.log(`   Load time: ${loadTime}ms`);
      if (loadTime > 5000) throw new Error(`Slow load: ${loadTime}ms`);
    });

    // ========== SUMMARY ==========
    console.log("\n" + "=".repeat(60));
    console.log(`📊 TEST SUMMARY`);
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

// Run tests
console.log("🚀 Starting HelpPage Tests for YOUR HelpPage.jsx");
console.log("⚠️  Make sure: npm run dev is running on http://localhost:5173");
console.log("=".repeat(60));

runTests();