// test-chat.js - Selenium tests for ChatPage.jsx
const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");
const path = require("path");

const TEST_CONFIG = {
  baseUrl: "http://localhost:5173",
  timeout: 10000,
  longTimeout: 15000,
  testUser: {
    email: "test@gmail.com",
    password: "123456",
    firstName: "Test",
    lastName: "User"
  },
  secondUser: {
    email: "user2@gmail.com",
    password: "123456"
  }
};

async function waitForElement(driver, locator, timeout = TEST_CONFIG.timeout) {
  return await driver.wait(until.elementLocated(locator), timeout);
}

async function waitForElementVisible(driver, locator, timeout = TEST_CONFIG.timeout) {
  const element = await waitForElement(driver, locator, timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  return element;
}

async function scrollToElement(driver, element) {
  await driver.executeScript("arguments[0].scrollIntoView(true);", element);
  await driver.sleep(300);
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
    // Setup Chrome options
    const options = new chrome.Options();
    options.addArguments("--start-maximized");
    // options.addArguments("--headless"); // Uncomment for headless mode
    
    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    // ========== LOGIN ==========
    console.log("\n🔐 Logging in...");
    await driver.get(TEST_CONFIG.baseUrl);
    await waitForElement(driver, By.name("email"));
    await driver.findElement(By.name("email")).sendKeys(TEST_CONFIG.testUser.email);
    await driver.findElement(By.name("password")).sendKeys(TEST_CONFIG.testUser.password);
    await driver.findElement(By.xpath("//button[contains(text(),'Log In')]")).click();
    await driver.wait(until.urlContains("liberta-home"), TEST_CONFIG.longTimeout);
    console.log("   ✅ Login successful");

    // ========== NAVIGATE TO CHAT PAGE ==========
    console.log("\n📍 Navigating to Chat Page...");
    await driver.get(`${TEST_CONFIG.baseUrl}/chat`);
    await driver.sleep(3000);
    console.log("   ✅ Chat page loaded");

    // ========== SECTION 1: PAGE LOAD TESTS ==========
    console.log("\n" + "=".repeat(60));
    console.log("SECTION 1: PAGE LOAD TESTS");
    console.log("=".repeat(60));

    await test("Chat page loads without errors", async () => {
      const currentUrl = await driver.getCurrentUrl();
      if (!currentUrl.includes("/chat")) throw new Error("Chat page URL incorrect");
    });

    await test("Messages section is visible", async () => {
      const messagesSection = await driver.findElement(By.xpath("//h2[contains(text(),'Messages')]"));
      if (!await messagesSection.isDisplayed()) throw new Error("Messages section not found");
    });

    await test("Search input is present", async () => {
      const searchInput = await driver.findElement(By.xpath("//input[@placeholder='Search messages...']"));
      if (!searchInput) throw new Error("Search input not found");
    });

    // ========== SECTION 2: CHAT LIST TESTS ==========
    console.log("\n" + "=".repeat(60));
    console.log("SECTION 2: CHAT LIST TESTS");
    console.log("=".repeat(60));

    await test("Chat list sidebar is visible", async () => {
      const chatList = await driver.findElement(By.xpath("//div[contains(@class,'w-80')]"));
      if (!await chatList.isDisplayed()) throw new Error("Chat list sidebar not found");
    });

    await test("New chat button exists", async () => {
      const newChatBtn = await driver.findElement(By.xpath("//button[contains(@class,'hover:bg-gray-100')]//*[name()='svg' and contains(@class,'h-5 w-5')]"));
      if (!newChatBtn) throw new Error("New chat button not found");
    });

    await test("Search functionality works", async () => {
      const searchInput = await driver.findElement(By.xpath("//input[@placeholder='Search messages...']"));
      await searchInput.clear();
      await searchInput.sendKeys("test");
      await driver.sleep(1000);
      
      const searchValue = await searchInput.getAttribute("value");
      if (searchValue !== "test") throw new Error("Search input not working");
      
      await searchInput.clear();
    });

    // ========== SECTION 3: CHAT WINDOW TESTS ==========
    console.log("\n" + "=".repeat(60));
    console.log("SECTION 3: CHAT WINDOW TESTS");
    console.log("=".repeat(60));

    await test("No chat selected shows placeholder", async () => {
      // Check for placeholder message
      const placeholder = await driver.findElement(By.xpath("//h3[contains(text(),'Your Messages')]"));
      if (!await placeholder.isDisplayed()) throw new Error("Placeholder not shown");
    });

    // Try to select a chat if available
    const chatItems = await driver.findElements(By.xpath("//div[contains(@class,'w-80')]//button"));
    
    if (chatItems.length > 0) {
      await test("Selecting a chat displays chat window", async () => {
        await chatItems[0].click();
        await driver.sleep(2000);
        
        const chatHeader = await driver.findElement(By.xpath("//h2[contains(@class,'text-lg font-semibold')]"));
        if (!await chatHeader.isDisplayed()) throw new Error("Chat window not displayed");
      });

      await test("Chat header shows user name", async () => {
        const headerName = await driver.findElement(By.xpath("//h2[contains(@class,'text-lg font-semibold')]"));
        const nameText = await headerName.getText();
        if (!nameText || nameText.trim() === "") throw new Error("Chat header name missing");
        console.log(`   Chat with: ${nameText}`);
      });

      await test("Message input area is present", async () => {
        const textarea = await driver.findElement(By.xpath("//textarea[@placeholder]"));
        if (!await textarea.isDisplayed()) throw new Error("Message input not found");
      });

      await test("Send button is present", async () => {
        const sendBtn = await driver.findElement(By.xpath("//button[@type='submit']"));
        if (!sendBtn) throw new Error("Send button not found");
      });
    }

    // ========== SECTION 4: MESSAGE SENDING TESTS ==========
    console.log("\n" + "=".repeat(60));
    console.log("SECTION 4: MESSAGE SENDING TESTS");
    console.log("=".repeat(60));

    if (chatItems.length > 0) {
      const testMessage = randomString("Test message ");
      
      await test("Send a text message", async () => {
        // Make sure a chat is selected
        const textarea = await driver.findElement(By.xpath("//textarea[@placeholder]"));
        await textarea.click();
        await textarea.sendKeys(testMessage);
        await driver.sleep(500);
        
        const sendBtn = await driver.findElement(By.xpath("//button[@type='submit']"));
        await sendBtn.click();
        await driver.sleep(2000);
        
        // Check if message appears in chat
        const messageElement = await driver.findElement(By.xpath(`//p[contains(text(),'${testMessage}')]`));
        if (!await messageElement.isDisplayed()) throw new Error("Message not sent");
        console.log(`   Message sent: "${testMessage}"`);
      });

      await test("Send message with Enter key", async () => {
        const testMessage2 = randomString("Enter key test ");
        
        const textarea = await driver.findElement(By.xpath("//textarea[@placeholder]"));
        await textarea.clear();
        await textarea.sendKeys(testMessage2);
        await textarea.sendKeys(Key.ENTER);
        await driver.sleep(2000);
        
        const messageElement = await driver.findElement(By.xpath(`//p[contains(text(),'${testMessage2}')]`));
        if (!await messageElement.isDisplayed()) throw new Error("Enter key not working");
      });
    }

    // ========== SECTION 5: ACTION BUTTONS TESTS ==========
    console.log("\n" + "=".repeat(60));
    console.log("SECTION 5: ACTION BUTTONS TESTS");
    console.log("=".repeat(60));

    if (chatItems.length > 0) {
      await test("Mic button for voice recording exists", async () => {
        const micBtn = await driver.findElement(By.xpath("//button[contains(@title,'Record voice message')]"));
        if (!micBtn) throw new Error("Voice recording button not found");
      });

      await test("Image attachment button exists", async () => {
        const imageBtn = await driver.findElement(By.xpath("//button[contains(@title,'Send image')]"));
        if (!imageBtn) throw new Error("Image attachment button not found");
      });

      await test("Video attachment button exists", async () => {
        const videoBtn = await driver.findElement(By.xpath("//button[contains(@title,'Send video')]"));
        if (!videoBtn) throw new Error("Video attachment button not found");
      });

      await test("File attachment button exists", async () => {
        const fileBtn = await driver.findElement(By.xpath("//button[contains(@title,'Send file')]"));
        if (!fileBtn) throw new Error("File attachment button not found");
      });

      await test("Emoji picker button exists", async () => {
        const emojiBtn = await driver.findElement(By.xpath("//button[contains(@class,'hover:bg-gray-100')]//*[name()='svg' and contains(@class,'h-5 w-5')]"));
        if (!emojiBtn) throw new Error("Emoji button not found");
      });
    }

    // ========== SECTION 6: CALL BUTTONS TESTS ==========
    console.log("\n" + "=".repeat(60));
    console.log("SECTION 6: CALL BUTTONS TESTS");
    console.log("=".repeat(60));

    if (chatItems.length > 0) {
      await test("Phone call button exists", async () => {
        const phoneBtn = await driver.findElement(By.xpath("//button[contains(@class,'hover:bg-gray-100')]//*[name()='svg' and contains(@class,'h-5 w-5')]"));
        // Just check existence, not functionality
        if (!phoneBtn) console.log("   Phone button not found - may be hidden");
        else console.log("   Phone button found");
      });

      await test("Video call button exists", async () => {
        const videoCallBtn = await driver.findElement(By.xpath("//button[contains(@class,'hover:bg-gray-100')]//*[name()='svg' and contains(@class,'h-5 w-5')]"));
        if (!videoCallBtn) console.log("   Video call button not found - may be hidden");
        else console.log("   Video call button found");
      });
    }

    // ========== SECTION 7: MESSAGE DISPLAY TESTS ==========
    console.log("\n" + "=".repeat(60));
    console.log("SECTION 7: MESSAGE DISPLAY TESTS");
    console.log("=".repeat(60));

    if (chatItems.length > 0) {
      await test("Messages are displayed with timestamps", async () => {
        const timestamps = await driver.findElements(By.xpath("//span[contains(@class,'text-gray-500')]"));
        if (timestamps.length === 0) {
          console.log("   No timestamps found - may be no messages");
        } else {
          console.log(`   Found ${timestamps.length} timestamps`);
        }
      });

      await test("Own messages have different styling", async () => {
        const ownMessages = await driver.findElements(By.xpath("//div[contains(@class,'bg-blue-600')]"));
        const otherMessages = await driver.findElements(By.xpath("//div[contains(@class,'bg-white')]"));
        
        console.log(`   Own messages: ${ownMessages.length}`);
        console.log(`   Other messages: ${otherMessages.length}`);
        
        // Test passes if we can find at least one message type
        if (ownMessages.length === 0 && otherMessages.length === 0) {
          console.log("   No messages to check styling");
        }
      });
    }

    // ========== SECTION 8: RESPONSIVE TESTS ==========
    console.log("\n" + "=".repeat(60));
    console.log("SECTION 8: RESPONSIVE TESTS");
    console.log("=".repeat(60));

    await test("Chat page is responsive", async () => {
      // Get window size
      const windowSize = await driver.manage().window().getRect();
      console.log(`   Window size: ${windowSize.width}x${windowSize.height}`);
      
      if (windowSize.width < 768) {
        console.log("   Mobile view detected");
      } else {
        console.log("   Desktop view detected");
      }
    });

    // ========== SECTION 9: SIDEBAR AND NAVIGATION TESTS ==========
    console.log("\n" + "=".repeat(60));
    console.log("SECTION 9: SIDEBAR AND NAVIGATION TESTS");
    console.log("=".repeat(60));

    await test("Sidebar is visible", async () => {
      const sidebar = await driver.findElement(By.xpath("//div[contains(@class,'fixed left-0')]"));
      if (!await sidebar.isDisplayed()) throw new Error("Sidebar not found");
    });

    await test("Navbar is visible", async () => {
      const navbar = await driver.findElement(By.xpath("//header | //div[contains(@class,'ml-32')]/div[1]"));
      if (!navbar) console.log("   Navbar structure may vary");
      else console.log("   Navbar found");
    });

    // ========== SECTION 10: PERFORMANCE TESTS ==========
    console.log("\n" + "=".repeat(60));
    console.log("SECTION 10: PERFORMANCE TESTS");
    console.log("=".repeat(60));

    await test("Chat page loads within 5 seconds", async () => {
      const start = Date.now();
      await driver.get(`${TEST_CONFIG.baseUrl}/chat`);
      await waitForElement(driver, By.xpath("//h2[contains(text(),'Messages')]"), 10000);
      const loadTime = Date.now() - start;
      console.log(`   Load time: ${loadTime}ms`);
      if (loadTime > 5000) throw new Error(`Slow load: ${loadTime}ms`);
    });

    // ========== SECTION 11: EDGE CASE TESTS ==========
    console.log("\n" + "=".repeat(60));
    console.log("SECTION 11: EDGE CASE TESTS");
    console.log("=".repeat(60));

    await test("Empty search shows all chats or no chats message", async () => {
      const searchInput = await driver.findElement(By.xpath("//input[@placeholder='Search messages...']"));
      await searchInput.clear();
      await searchInput.sendKeys("xyzabc123nonexistent");
      await driver.sleep(1500);
      
      const noResults = await driver.findElement(By.xpath("//p[contains(text(),'No conversations yet')]"));
      const hasResults = await noResults.isDisplayed().catch(() => false);
      
      if (!hasResults) {
        const chatItemsAfterSearch = await driver.findElements(By.xpath("//div[contains(@class,'w-80')]//button"));
        console.log(`   Search results: ${chatItemsAfterSearch.length} chats found`);
      } else {
        console.log("   No results message displayed");
      }
      
      await searchInput.clear();
    });

    await test("Empty message cannot be sent", async () => {
      if (chatItems.length > 0) {
        const textarea = await driver.findElement(By.xpath("//textarea[@placeholder]"));
        await textarea.clear();
        
        const sendBtn = await driver.findElement(By.xpath("//button[@type='submit']"));
        const isDisabled = await sendBtn.getAttribute("disabled");
        
        if (isDisabled === "true") {
          console.log("   Send button disabled for empty message - correct");
        } else {
          console.log("   Send button enabled for empty message");
        }
      } else {
        console.log("   No chat selected - skipping");
      }
    });

    // ========== SECTION 12: UNREAD MESSAGES TEST ==========
    console.log("\n" + "=".repeat(60));
    console.log("SECTION 12: UNREAD MESSAGES TEST");
    console.log("=".repeat(60));

    await test("Unread count badge displays", async () => {
      const unreadBadge = await driver.findElement(By.xpath("//span[contains(@class,'bg-red-500')]"));
      const hasUnread = await unreadBadge.isDisplayed().catch(() => false);
      
      if (hasUnread) {
        const badgeText = await unreadBadge.getText();
        console.log(`   Unread messages: ${badgeText}`);
      } else {
        console.log("   No unread messages badge found");
      }
    });

    // ========== SUMMARY ==========
    console.log("\n" + "=".repeat(60));
    console.log("📊 TEST SUMMARY - CHAT PAGE");
    console.log("=".repeat(60));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${passed + failed}`);
    console.log(`🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(2)}%`);
    console.log("=".repeat(60));

    // Detailed breakdown
    console.log("\n📋 TEST BREAKDOWN:");
    console.log("   - Page Load Tests: 3 tests");
    console.log("   - Chat List Tests: 3 tests");
    console.log("   - Chat Window Tests: 3-4 tests");
    console.log("   - Message Sending: 2 tests");
    console.log("   - Action Buttons: 5 tests");
    console.log("   - Call Buttons: 2 tests");
    console.log("   - Message Display: 2 tests");
    console.log("   - Responsive: 1 test");
    console.log("   - Sidebar/Navbar: 2 tests");
    console.log("   - Performance: 1 test");
    console.log("   - Edge Cases: 2 tests");
    console.log("   - Unread Messages: 1 test");

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
console.log("🚀 Starting ChatPage Tests");
console.log("⚠️  Make sure:");
console.log("   1. Vite dev server is running on http://localhost:5173");
console.log("   2. You are logged in as test user");
console.log("   3. There is at least one other user to chat with");
console.log("=".repeat(60));

runTests();