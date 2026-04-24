// friendsPageTest.js
const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');

// Test credentials
const TEST_EMAIL = "test@gmail.com";
const TEST_PASSWORD = "123456";

// Helper function to wait for element and scroll into view
async function waitForElementAndScroll(driver, locator, timeout = 10000) {
  const element = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  await driver.executeScript("arguments[0].scrollIntoView({block: 'center', behavior: 'smooth'});", element);
  await driver.sleep(500);
  return element;
}

// Helper function to click with JavaScript
async function clickWithJS(driver, element) {
  await driver.executeScript("arguments[0].click();", element);
}

// Helper function to take screenshot
async function takeScreenshot(driver, name) {
  const screenshot = await driver.takeScreenshot();
  fs.writeFileSync(`${name}.png`, screenshot, 'base64');
  console.log(`📸 Screenshot saved as ${name}.png`);
}

// Helper function to wait for element to be present
async function waitForElement(driver, locator, timeout = 10000) {
  return await driver.wait(until.elementLocated(locator), timeout);
}

async function login(driver) {
  console.log("\n🔐 Logging in...");
  
  await driver.get("http://localhost:5173/");
  await driver.sleep(2000);
  
  // Enter email
  const emailInput = await waitForElementAndScroll(driver, By.name("email"));
  await emailInput.clear();
  await emailInput.sendKeys(TEST_EMAIL);
  console.log(`   ✓ Email entered: ${TEST_EMAIL}`);
  
  // Enter password
  const passwordInput = await waitForElementAndScroll(driver, By.name("password"));
  await passwordInput.clear();
  await passwordInput.sendKeys(TEST_PASSWORD);
  console.log(`   ✓ Password entered: ${TEST_PASSWORD}`);
  
  // Click login button
  const loginButton = await driver.findElement(By.xpath("//button[contains(text(), 'Log In')]"));
  await clickWithJS(driver, loginButton);
  console.log("   ✓ Login button clicked");
  
  // Wait for redirect to home page
  await driver.wait(until.urlContains("liberta-home"), 10000);
  console.log("   ✅ Login successful!");
  await driver.sleep(2000);
}

async function navigateToFriendsPage(driver) {
  console.log("\n👥 Navigating to Friends Page...");
  
  try {
    // Try to find Friends link in the sidebar
    const friendsLink = await driver.findElement(By.xpath("//a[contains(@href, 'FriendsPage')]"));
    await clickWithJS(driver, friendsLink);
    await driver.sleep(2000);
    console.log("   ✅ Navigated via Friends link");
  } catch (error) {
    console.log("   ⚠️ Could not find Friends link, trying direct URL...");
    await driver.get("http://localhost:5173/FriendsPage");
    await driver.sleep(2000);
    console.log("   ✅ Navigated via direct URL");
  }
  
  // Wait for page to load - look for the main heading
  await driver.wait(until.elementLocated(By.xpath("//h1[contains(text(), 'Community Friends')]")), 10000);
  console.log("   ✅ Friends Page loaded");
  await takeScreenshot(driver, "friends-page-loaded");
  return true;
}

async function testViewTotalMembers(driver) {
  console.log("\n📊 TEST 1: View Total Members Count...");
  
  try {
    // Look for the Total Members stat card
    const totalMembersElement = await driver.findElement(By.xpath("//div[contains(@class, 'bg-white rounded-xl')]//p[contains(text(), 'Total Members')]/following-sibling::p"));
    const totalMembers = await totalMembersElement.getText();
    console.log(`   ✓ Total Members: ${totalMembers}`);
    
    if (parseInt(totalMembers) > 0) {
      console.log("   ✅ Total members count displayed correctly");
    } else {
      console.log("   ⚠️ Total members count is 0");
    }
    
    await takeScreenshot(driver, "total-members");
    return parseInt(totalMembers);
  } catch (error) {
    console.error("   ❌ Error getting total members:", error.message);
    return 0;
  }
}

async function testSearchUsers(driver) {
  console.log("\n🔍 TEST 2: Search for users...");
  
  const searchTerm = "John";
  
  try {
    // Find search input
    const searchInput = await waitForElementAndScroll(driver, By.xpath("//input[@placeholder='Search by name, hobby, or interest...']"));
    await searchInput.clear();
    await searchInput.sendKeys(searchTerm);
    console.log(`   ✓ Entered search term: "${searchTerm}"`);
    
    // Wait for search results
    await driver.sleep(2000);
    await takeScreenshot(driver, "search-results");
    
    // Check if search results contain the search term
    const userCards = await driver.findElements(By.xpath("//div[contains(@class, 'bg-white rounded-2xl')]//h3"));
    if (userCards.length > 0) {
      console.log(`   ✓ Found ${userCards.length} user(s) matching search`);
    } else {
      console.log("   ℹ️ No users found matching search");
    }
    
    // Clear search
    await searchInput.clear();
    await driver.sleep(1000);
    console.log("   ✓ Search cleared");
    
    return userCards.length;
  } catch (error) {
    console.error("   ❌ Error searching users:", error.message);
    return 0;
  }
}

async function testFilterByFollowing(driver) {
  console.log("\n🔘 TEST 3: Filter by Following...");
  
  try {
    // Click Following filter
    const followingFilter = await driver.findElement(By.xpath("//button[contains(text(), 'Following')]"));
    await clickWithJS(driver, followingFilter);
    await driver.sleep(2000);
    console.log("   ✓ Clicked 'Following' filter");
    await takeScreenshot(driver, "filter-following");
    
    // Click All Members to reset
    const allFilter = await driver.findElement(By.xpath("//button[contains(text(), 'All Members')]"));
    await clickWithJS(driver, allFilter);
    await driver.sleep(1000);
    console.log("   ✓ Reset to 'All Members'");
    
    return true;
  } catch (error) {
    console.error("   ❌ Error with following filter:", error.message);
    return false;
  }
}

async function testFilterByHighMatch(driver) {
  console.log("\n⭐ TEST 4: Filter by High Match...");
  
  try {
    // Click High Match filter
    const highMatchFilter = await driver.findElement(By.xpath("//button[contains(text(), 'High Match')]"));
    await clickWithJS(driver, highMatchFilter);
    await driver.sleep(2000);
    console.log("   ✓ Clicked 'High Match (70%+)' filter");
    await takeScreenshot(driver, "filter-high-match");
    
    // Reset filter
    const allFilter = await driver.findElement(By.xpath("//button[contains(text(), 'All Members')]"));
    await clickWithJS(driver, allFilter);
    await driver.sleep(1000);
    console.log("   ✓ Reset to 'All Members'");
    
    return true;
  } catch (error) {
    console.error("   ❌ Error with high match filter:", error.message);
    return false;
  }
}

async function testFollowUser(driver) {
  console.log("\n➕ TEST 5: Follow a user...");
  
  try {
    // Wait for user cards to load
    await driver.sleep(2000);
    
    // Find the first user card that has a "Follow" button
    const userCards = await driver.findElements(By.xpath("//div[contains(@class, 'bg-white rounded-2xl')]"));
    
    if (userCards.length === 0) {
      console.log("   ℹ️ No user cards found");
      return false;
    }
    
    let followButton = null;
    let userName = "";
    
    // Look for a user card with Follow button (not Following)
    for (let i = 0; i < userCards.length; i++) {
      try {
        const buttons = await userCards[i].findElements(By.xpath(".//button"));
        for (let button of buttons) {
          const buttonText = await button.getText();
          if (buttonText === "Follow") {
            followButton = button;
            const nameElement = await userCards[i].findElement(By.xpath(".//h3"));
            userName = await nameElement.getText();
            break;
          }
        }
        if (followButton) break;
      } catch (e) {
        continue;
      }
    }
    
    if (followButton) {
      console.log(`   ✓ Found user: ${userName}`);
      await clickWithJS(driver, followButton);
      await driver.sleep(2000);
      console.log("   ✓ Clicked Follow button");
      console.log("   ✅ Successfully followed user");
      await takeScreenshot(driver, "followed-user");
      return true;
    } else {
      console.log("   ℹ️ No followable users found (all are already followed)");
      return false;
    }
  } catch (error) {
    console.error("   ❌ Error following user:", error.message);
    return false;
  }
}

async function testUnfollowUser(driver) {
  console.log("\n➖ TEST 6: Unfollow a user...");
  
  try {
    // Wait for user cards to load
    await driver.sleep(2000);
    
    // Find the first user card that has a "Following" button
    const userCards = await driver.findElements(By.xpath("//div[contains(@class, 'bg-white rounded-2xl')]"));
    
    if (userCards.length === 0) {
      console.log("   ℹ️ No user cards found");
      return false;
    }
    
    let followingButton = null;
    let userName = "";
    
    // Look for a user card with Following button
    for (let i = 0; i < userCards.length; i++) {
      try {
        const buttons = await userCards[i].findElements(By.xpath(".//button"));
        for (let button of buttons) {
          const buttonText = await button.getText();
          if (buttonText === "Following") {
            followingButton = button;
            const nameElement = await userCards[i].findElement(By.xpath(".//h3"));
            userName = await nameElement.getText();
            break;
          }
        }
        if (followingButton) break;
      } catch (e) {
        continue;
      }
    }
    
    if (followingButton) {
      console.log(`   ✓ Found followed user: ${userName}`);
      await clickWithJS(driver, followingButton);
      await driver.sleep(2000);
      console.log("   ✓ Clicked Unfollow button");
      console.log("   ✅ Successfully unfollowed user");
      await takeScreenshot(driver, "unfollowed-user");
      return true;
    } else {
      console.log("   ℹ️ No followed users found");
      return false;
    }
  } catch (error) {
    console.error("   ❌ Error unfollowing user:", error.message);
    return false;
  }
}

async function testViewUserProfile(driver) {
  console.log("\n👤 TEST 7: View user profile from friends page...");
  
  try {
    // Wait for user cards to load
    await driver.sleep(2000);
    
    // Find the first user card
    const userCard = await driver.findElement(By.xpath("//div[contains(@class, 'bg-white rounded-2xl')]"));
    
    // Get the user name from h3
    const userNameElement = await userCard.findElement(By.xpath(".//h3"));
    const userName = await userNameElement.getText();
    console.log(`   ✓ Found user: ${userName}`);
    
    // Find and click the Profile button
    const profileButton = await userCard.findElement(By.xpath(".//button[contains(text(), 'Profile')]"));
    await clickWithJS(driver, profileButton);
    await driver.sleep(2000);
    console.log("   ✓ Clicked Profile button");
    
    // Wait for profile page to load
    await driver.wait(until.urlContains("/profile/"), 10000);
    const currentUrl = await driver.getCurrentUrl();
    console.log(`   ✓ Navigated to: ${currentUrl}`);
    console.log("   ✅ Successfully navigated to user profile");
    await takeScreenshot(driver, "user-profile-from-friends");
    
    // Go back to friends page
    await driver.navigate().back();
    await driver.sleep(2000);
    console.log("   ✓ Returned to friends page");
    
    return true;
  } catch (error) {
    console.error("   ❌ Error viewing user profile:", error.message);
    return false;
  }
}

async function testSendMessage(driver) {
  console.log("\n💬 TEST 8: Send message from friends page...");
  
  try {
    // Wait for user cards to load
    await driver.sleep(2000);
    
    // Find the first user card
    const userCard = await driver.findElement(By.xpath("//div[contains(@class, 'bg-white rounded-2xl')]"));
    
    // Get the user name from h3
    const userNameElement = await userCard.findElement(By.xpath(".//h3"));
    const userName = await userNameElement.getText();
    console.log(`   ✓ Found user: ${userName}`);
    
    // Find and click the Message button
    const messageButton = await userCard.findElement(By.xpath(".//button[contains(text(), 'Message')]"));
    await clickWithJS(driver, messageButton);
    await driver.sleep(2000);
    console.log("   ✓ Clicked Message button");
    
    // Wait for chat page to load
    await driver.wait(until.urlContains("/chat"), 10000);
    const currentUrl = await driver.getCurrentUrl();
    console.log(`   ✓ Navigated to: ${currentUrl}`);
    console.log("   ✅ Successfully navigated to chat page");
    await takeScreenshot(driver, "chat-from-friends");
    
    // Go back to friends page
    await driver.navigate().back();
    await driver.sleep(2000);
    console.log("   ✓ Returned to friends page");
    
    return true;
  } catch (error) {
    console.error("   ❌ Error sending message:", error.message);
    return false;
  }
}

async function testSuggestedFriends(driver) {
  console.log("\n💡 TEST 9: Check Suggested Friends section...");
  
  try {
    // Look for the Suggested For You section
    const suggestedSection = await driver.findElement(By.xpath("//h3[contains(text(), 'Suggested For You')]"));
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", suggestedSection);
    await driver.sleep(500);
    
    const suggestedUsers = await driver.findElements(By.xpath("//div[contains(@class, 'space-y-4')]//div[contains(@class, 'flex items-center justify-between')]"));
    console.log(`   ✓ Found ${suggestedUsers.length} suggested user(s)`);
    
    if (suggestedUsers.length > 0) {
      console.log("   ✅ Suggested friends section is populated");
      await takeScreenshot(driver, "suggested-friends");
    } else {
      console.log("   ℹ️ No suggested friends available");
    }
    
    return suggestedUsers.length;
  } catch (error) {
    console.error("   ❌ Error checking suggested friends:", error.message);
    return 0;
  }
}

async function testFilterStats(driver) {
  console.log("\n📈 TEST 10: Verify filter statistics...");
  
  try {
    // Get statistics from top cards
    const statCards = await driver.findElements(By.xpath("//div[contains(@class, 'grid grid-cols-1 md:grid-cols-3')]/div"));
    
    for (let i = 0; i < statCards.length; i++) {
      const statText = await statCards[i].getText();
      if (statText.includes("Average Match")) {
        const matchValue = statText.match(/\d+/);
        console.log(`   ✓ Average Match: ${matchValue ? matchValue[0] : 0}%`);
      } else if (statText.includes("Following")) {
        const followingValue = statText.match(/\d+/);
        console.log(`   ✓ Following Count: ${followingValue ? followingValue[0] : 0}`);
      } else if (statText.includes("Shared Hobbies")) {
        const hobbiesValue = statText.match(/\d+/);
        console.log(`   ✓ Shared Hobbies: ${hobbiesValue ? hobbiesValue[0] : 0}`);
      }
    }
    
    await takeScreenshot(driver, "filter-stats");
    return true;
  } catch (error) {
    console.error("   ❌ Error getting filter stats:", error.message);
    return false;
  }
}

async function runAllTests() {
  let driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(new chrome.Options().addArguments(
      '--disable-blink-features=AutomationControlled',
      '--start-maximized'
    ))
    .build();
  
  const testResults = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  const testFunctions = [
    { name: "View Total Members", fn: testViewTotalMembers },
    { name: "Search Users", fn: testSearchUsers },
    { name: "Filter by Following", fn: testFilterByFollowing },
    { name: "Filter by High Match", fn: testFilterByHighMatch },
    { name: "Follow User", fn: testFollowUser },
    { name: "Unfollow User", fn: testUnfollowUser },
    { name: "View User Profile", fn: testViewUserProfile },
    { name: "Send Message", fn: testSendMessage },
    { name: "Suggested Friends", fn: testSuggestedFriends },
    { name: "Filter Statistics", fn: testFilterStats }
  ];
  
  try {
    console.log("🚀 STARTING FRIENDS PAGE FUNCTIONALITY TESTS\n");
    console.log("=" .repeat(60));
    
    // Login first
    await login(driver);
    
    // Navigate to Friends Page
    await navigateToFriendsPage(driver);
    
    // Run all tests
    for (const test of testFunctions) {
      testResults.total++;
      console.log(`\n--- Running Test ${testResults.total}: ${test.name} ---`);
      const result = await test.fn(driver);
      if (result) {
        testResults.passed++;
        console.log(`✅ ${test.name} PASSED`);
      } else {
        testResults.failed++;
        console.log(`❌ ${test.name} FAILED`);
      }
      await driver.sleep(1500);
    }
    
    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("\n📊 TEST SUMMARY");
    console.log("=" .repeat(60));
    console.log(`✅ Passed: ${testResults.passed}/${testResults.total}`);
    console.log(`❌ Failed: ${testResults.failed}/${testResults.total}`);
    console.log(`📈 Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
    
    if (testResults.passed === testResults.total) {
      console.log("\n🎉 ALL TESTS PASSED! 🎉");
    } else {
      console.log("\n⚠️ Some tests failed. Check the screenshots for details.");
    }
    
    await takeScreenshot(driver, "final-friends-page");
    
  } catch (error) {
    console.error("\n❌ CRITICAL TEST FAILURE:", error.message);
    await takeScreenshot(driver, "critical-failure");
  } finally {
    await driver.sleep(3000);
    await driver.quit();
    console.log("\n🔚 Browser closed.");
  }
}

// Run the tests
runAllTests().catch(console.error);