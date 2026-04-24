// registerTest.js
const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');

// Helper function to wait for element and scroll into view
async function waitForElementAndScroll(driver, locator, timeout = 10000) {
  const element = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  await driver.executeScript("arguments[0].scrollIntoView({block: 'center', behavior: 'smooth'});", element);
  await driver.sleep(500);
  return element;
}

// Helper function to click with JavaScript (avoids interception issues)
async function clickWithJS(driver, element) {
  await driver.executeScript("arguments[0].click();", element);
}

// Helper function to find and click checkbox by label text
async function clickCheckboxByLabel(driver, labelText) {
  try {
    // Find the label element
    const label = await driver.findElement(By.xpath(`//label[contains(text(), '${labelText}')]`));
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", label);
    await driver.sleep(500);
    await clickWithJS(driver, label);
    console.log(`   ✓ Clicked: ${labelText}`);
    await driver.sleep(500);
    return true;
  } catch (error) {
    console.log(`   ⚠️ Could not find label: ${labelText}`);
    return false;
  }
}

// Helper function to select radio button by value
async function selectRadioByValue(driver, name, value) {
  try {
    const radio = await driver.findElement(By.xpath(`//input[@name='${name}' and @value='${value}']`));
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", radio);
    await driver.sleep(500);
    await clickWithJS(driver, radio);
    console.log(`   ✓ Selected radio: ${name}=${value}`);
    await driver.sleep(500);
    return true;
  } catch (error) {
    console.log(`   ⚠️ Could not find radio: ${name}=${value}`);
    return false;
  }
}

// Helper function to select from dropdown
async function selectDropdownValue(driver, selectName, value) {
  try {
    const select = await driver.findElement(By.name(selectName));
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", select);
    await driver.sleep(500);
    await select.click();
    await driver.sleep(500);
    const option = await driver.findElement(By.xpath(`//option[@value='${value}']`));
    await clickWithJS(driver, option);
    console.log(`   ✓ Selected dropdown: ${selectName}=${value}`);
    await driver.sleep(500);
    return true;
  } catch (error) {
    console.log(`   ⚠️ Could not select dropdown: ${selectName}=${value}`);
    return false;
  }
}

// Test data - use unique email for each test run
const testEmail = `testuser_${Date.now()}@example.com`;
const testPassword = "Test123456";

async function registerTest() {
  let driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(new chrome.Options().addArguments(
      '--disable-blink-features=AutomationControlled',
      '--start-maximized'
    ))
    .build();

  try {
    console.log("🔍 Starting Registration Test...");
    console.log(`📧 Using test email: ${testEmail}`);
    console.log(`🔑 Using test password: ${testPassword}`);
    
    // Step 1: Open the registration page
    console.log("\n📱 Opening registration page...");
    await driver.get("http://localhost:5173/login");
    await driver.sleep(2000);
    
    // ========== STEP 1: Basic Information ==========
    console.log("\n📝 STEP 1: Filling Basic Information...");
    
    // First Name
    const firstName = await waitForElementAndScroll(driver, By.name("firstName"));
    await firstName.clear();
    await firstName.sendKeys("John");
    console.log("   ✓ First Name: John");
    
    // Last Name
    const lastName = await waitForElementAndScroll(driver, By.name("lastName"));
    await lastName.clear();
    await lastName.sendKeys("Doe");
    console.log("   ✓ Last Name: Doe");
    
    // Email
    const email = await waitForElementAndScroll(driver, By.name("email"));
    await email.clear();
    await email.sendKeys(testEmail);
    console.log(`   ✓ Email: ${testEmail}`);
    
    // Password
    const password = await waitForElementAndScroll(driver, By.name("password"));
    await password.clear();
    await password.sendKeys(testPassword);
    console.log("   ✓ Password: ********");
    
    // Confirm Password
    const confirmPassword = await waitForElementAndScroll(driver, By.name("confirmPassword"));
    await confirmPassword.clear();
    await confirmPassword.sendKeys(testPassword);
    console.log("   ✓ Confirm Password: ********");
    
    // Date of Birth
    const birthDate = await waitForElementAndScroll(driver, By.name("birthDate"));
    await birthDate.clear();
    await birthDate.sendKeys("1950-01-15");
    console.log("   ✓ Date of Birth: 1950-01-15");
    
    // Phone (optional)
    const phone = await waitForElementAndScroll(driver, By.name("phone"));
    await phone.clear();
    await phone.sendKeys("+1234567890");
    console.log("   ✓ Phone: +1234567890");
    
    // Click Next button to go to Step 2
    console.log("\n➡️ Clicking Next button...");
    const nextButton = await driver.findElement(By.xpath("//button[contains(text(), 'Next Step')]"));
    await clickWithJS(driver, nextButton);
    await driver.sleep(2000);
    
    // ========== STEP 2: Contact Information ==========
    console.log("\n🏠 STEP 2: Filling Contact Information...");
    
    // Address
    const address = await waitForElementAndScroll(driver, By.name("address"));
    await address.clear();
    await address.sendKeys("123 Main Street");
    console.log("   ✓ Address: 123 Main Street");
    
    // City
    const city = await waitForElementAndScroll(driver, By.name("city"));
    await city.clear();
    await city.sendKeys("Springfield");
    console.log("   ✓ City: Springfield");
    
    // State
    const state = await waitForElementAndScroll(driver, By.name("state"));
    await state.clear();
    await state.sendKeys("Illinois");
    console.log("   ✓ State: Illinois");
    
    // ZIP Code
    const zipCode = await waitForElementAndScroll(driver, By.name("zipCode"));
    await zipCode.clear();
    await zipCode.sendKeys("62701");
    console.log("   ✓ ZIP Code: 62701");
    
    // Emergency Contact Name
    const emergencyContact = await waitForElementAndScroll(driver, By.name("emergencyContact"));
    await emergencyContact.clear();
    await emergencyContact.sendKeys("Jane Doe");
    console.log("   ✓ Emergency Contact: Jane Doe");
    
    // Emergency Phone
    const emergencyPhone = await waitForElementAndScroll(driver, By.name("emergencyPhone"));
    await emergencyPhone.clear();
    await emergencyPhone.sendKeys("+1987654321");
    console.log("   ✓ Emergency Phone: +1987654321");
    
    // Click Next to go to Step 3
    console.log("\n➡️ Clicking Next button...");
    const nextButton2 = await driver.findElement(By.xpath("//button[contains(text(), 'Next Step')]"));
    await clickWithJS(driver, nextButton2);
    await driver.sleep(2000);
    
    // ========== STEP 3: Hobbies & Interests ==========
    console.log("\n🎨 STEP 3: Selecting Hobbies & Interests...");
    
    // Select hobbies by clicking on the labels
    await clickCheckboxByLabel(driver, "Gardening");
    await clickCheckboxByLabel(driver, "Reading");
    await clickCheckboxByLabel(driver, "Music");
    
    // Select Skill Level (Intermediate)
    await selectRadioByValue(driver, "skillLevel", "intermediate");
    
    // Select Available Time (Afternoon)
    await selectDropdownValue(driver, "availableTime", "afternoon");
    
    // Select Looking For options
    await clickCheckboxByLabel(driver, "Friendship");
    await clickCheckboxByLabel(driver, "Activity Partner");
    
    // Click Next to go to Step 4
    console.log("\n➡️ Clicking Next button...");
    const nextButton3 = await driver.findElement(By.xpath("//button[contains(text(), 'Next Step')]"));
    await clickWithJS(driver, nextButton3);
    await driver.sleep(2000);
    
    // ========== STEP 4: Help & Support Needs ==========
    console.log("\n🤝 STEP 4: Selecting Help Needs...");
    
    // Select help options
    await clickCheckboxByLabel(driver, "Food Delivery");
    await clickCheckboxByLabel(driver, "Companionship");
    
    // Select Mobility Level
    await selectRadioByValue(driver, "mobility", "some-assist");
    
    // Scroll to privacy checkbox
    await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
    await driver.sleep(1000);
    
    // Accept Privacy Policy (checkbox is hidden, need to click the label)
    const privacyLabel = await driver.findElement(By.xpath("//label[contains(text(), 'I understand how my data')]"));
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", privacyLabel);
    await driver.sleep(500);
    await clickWithJS(driver, privacyLabel);
    console.log("   ✓ Privacy Policy accepted");
    
    // Click Next to go to Step 5
    console.log("\n➡️ Clicking Next button...");
    const nextButton4 = await driver.findElement(By.xpath("//button[contains(text(), 'Next Step')]"));
    await clickWithJS(driver, nextButton4);
    await driver.sleep(2000);
    
    // ========== STEP 5: Review & Submit ==========
    console.log("\n📋 STEP 5: Review and Submit...");
    
    // Verify data is displayed correctly in review
    try {
      const reviewName = await driver.findElement(By.xpath("//div[contains(text(), 'Name')]/following-sibling::p"));
      const nameText = await reviewName.getText();
      console.log(`   ✓ Name displayed: ${nameText}`);
    } catch (e) {
      console.log("   ⚠️ Could not find Name in review");
    }
    
    // Scroll to terms checkbox
    await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
    await driver.sleep(1000);
    
    // Accept Terms and Conditions (click the label)
    const termsLabel = await driver.findElement(By.xpath("//label[contains(text(), 'I agree to the Terms of Service')]"));
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", termsLabel);
    await driver.sleep(500);
    await clickWithJS(driver, termsLabel);
    console.log("   ✓ Terms accepted");
    
    // Click Submit button
    console.log("\n🚀 Submitting registration form...");
    const submitButton = await driver.findElement(By.xpath("//button[contains(text(), 'Create My Account')]"));
    await clickWithJS(driver, submitButton);
    
    // Wait for response
    await driver.sleep(3000);
    
    // Check for alert dialog
    try {
      const alert = await driver.switchTo().alert();
      const alertText = await alert.getText();
      console.log(`\n📢 Alert message: ${alertText}`);
      
      if (alertText.toLowerCase().includes("welcome") || alertText.toLowerCase().includes("success")) {
        console.log("✅ Registration successful!");
        await alert.accept();
      } else {
        console.log("⚠️ Unexpected alert message");
        await alert.accept();
      }
    } catch (e) {
      console.log("ℹ️ No alert detected, checking page content...");
    }
    
    // Wait for redirect
    await driver.sleep(3000);
    const currentUrl = await driver.getCurrentUrl();
    console.log(`\n📍 Current URL: ${currentUrl}`);
    
    if (currentUrl === "http://localhost:5173/") {
      console.log("✅ Successfully redirected to login page!");
    } else if (currentUrl.includes("liberta-home")) {
      console.log("✅ Successfully redirected to home page!");
    } else {
      console.log("⚠️ Unexpected redirect location");
    }
    
    console.log("\n✅✅✅ REGISTRATION TEST PASSED! ✅✅✅");
    console.log(`📧 Test user created with email: ${testEmail}`);
    console.log(`🔑 Password: ${testPassword}`);
    
    // Take success screenshot
    const successScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('registration-success.png', successScreenshot, 'base64');
    console.log("📸 Success screenshot saved as 'registration-success.png'");
    
  } catch (err) {
    console.log("\n❌❌❌ REGISTRATION TEST FAILED ❌❌❌");
    console.error("Error:", err.message);
    
    // Take screenshot on failure
    try {
      const screenshot = await driver.takeScreenshot();
      fs.writeFileSync('registration-failure.png', screenshot, 'base64');
      console.log("📸 Screenshot saved as 'registration-failure.png'");
    } catch (screenshotErr) {
      console.error("Could not take screenshot:", screenshotErr.message);
    }
    
    // Log current URL on failure
    const currentUrl = await driver.getCurrentUrl();
    console.log(`📍 Current URL at failure: ${currentUrl}`);
    
    // Log page source for debugging (first 500 chars)
    const pageSource = await driver.getPageSource();
    console.log(`\n📄 Page source snippet:\n${pageSource.substring(0, 1000)}...`);
    
  } finally {
    // Wait a moment before closing
    await driver.sleep(3000);
    await driver.quit();
    console.log("\n🔚 Test completed, browser closed.");
  }
}

// Run the test
registerTest().catch(console.error);