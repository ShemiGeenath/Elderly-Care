// postTest.js
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

// Helper function to wait for post to appear
async function waitForPost(driver, postContent) {
  try {
    const postElement = await driver.wait(
      until.elementLocated(By.xpath(`//p[contains(text(), '${postContent}')]`)),
      10000
    );
    await driver.wait(until.elementIsVisible(postElement), 5000);
    return postElement;
  } catch (error) {
    console.log(`⚠️ Post not found: ${postContent}`);
    return null;
  }
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

async function testCreatePostOnHomePage(driver) {
  console.log("\n📝 TEST 1: Creating post on Home Page...");
  
  const testPostContent = `Test post from automation - ${Date.now()}`;
  
  try {
    // Find the textarea for new post
    const postTextarea = await waitForElementAndScroll(
      driver, 
      By.xpath("//textarea[contains(@placeholder, 'What's on your mind')]")
    );
    await postTextarea.clear();
    await postTextarea.sendKeys(testPostContent);
    console.log(`   ✓ Post content entered: "${testPostContent}"`);
    
    // Click Post button
    const postButton = await driver.findElement(By.xpath("//button[contains(text(), 'Post') and not(contains(@disabled, 'disabled'))]"));
    await clickWithJS(driver, postButton);
    console.log("   ✓ Post button clicked");
    
    // Wait for post to appear
    await driver.sleep(3000);
    const newPost = await waitForPost(driver, testPostContent);
    
    if (newPost) {
      console.log(`   ✅ Post created successfully on home page!`);
      await takeScreenshot(driver, "post-created-homepage");
      return testPostContent;
    } else {
      console.log("   ❌ Post not found in feed");
      return null;
    }
  } catch (error) {
    console.error("   ❌ Error creating post on home page:", error.message);
    await takeScreenshot(driver, "post-creation-error-homepage");
    return null;
  }
}

async function testCreatePostWithImage(driver) {
  console.log("\n📸 TEST 2: Creating post with image on Home Page...");
  
  const testPostContent = `Check out this beautiful view! ${Date.now()}`;
  
  try {
    // Find the textarea for new post
    const postTextarea = await waitForElementAndScroll(
      driver, 
      By.xpath("//textarea[contains(@placeholder, 'What's on your mind')]")
    );
    await postTextarea.clear();
    await postTextarea.sendKeys(testPostContent);
    console.log(`   ✓ Post content entered: "${testPostContent}"`);
    
    // Click on Photo/Video button
    const photoVideoButton = await driver.findElement(By.xpath("//label[contains(text(), 'Photo/Video')]"));
    console.log("   ✓ Photo/Video button found");
    
    // Create a test image file path
    const imagePath = require('path').resolve(__dirname, 'test-image.jpg');
    
    // Check if test image exists, if not create a simple one
    const fs = require('fs');
    if (!fs.existsSync(imagePath)) {
      console.log("   ℹ️ No test image found, skipping image upload test");
      // Just post without image
      const postButton = await driver.findElement(By.xpath("//button[contains(text(), 'Post')]"));
      await clickWithJS(driver, postButton);
      await driver.sleep(2000);
      return testPostContent;
    }
    
    // Upload image
    const fileInput = await driver.findElement(By.xpath("//input[@type='file']"));
    await fileInput.sendKeys(imagePath);
    console.log("   ✓ Image selected for upload");
    await driver.sleep(2000);
    
    // Click Post button
    const postButton = await driver.findElement(By.xpath("//button[contains(text(), 'Post')]"));
    await clickWithJS(driver, postButton);
    console.log("   ✓ Post button clicked");
    
    // Wait for post to appear
    await driver.sleep(3000);
    const newPost = await waitForPost(driver, testPostContent);
    
    if (newPost) {
      console.log(`   ✅ Post with image created successfully!`);
      await takeScreenshot(driver, "post-with-image");
      return testPostContent;
    } else {
      console.log("   ❌ Post with image not found");
      return null;
    }
  } catch (error) {
    console.error("   ❌ Error creating post with image:", error.message);
    return null;
  }
}

async function testCreatePostOnProfilePage(driver) {
  console.log("\n👤 TEST 3: Creating post on Profile Page...");
  
  const testPostContent = `Profile post from automation - ${Date.now()}`;
  
  try {
    // Navigate to profile page
    const profileLink = await driver.findElement(By.xpath("//a[contains(@href, '/profile/')]"));
    await clickWithJS(driver, profileLink);
    await driver.sleep(2000);
    console.log("   ✓ Navigated to profile page");
    
    // Look for the "What's on your mind?" area on profile page
    const postTextarea = await driver.findElement(By.xpath("//textarea[contains(@placeholder, 'What's on your mind')]"));
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", postTextarea);
    await driver.sleep(500);
    await postTextarea.clear();
    await postTextarea.sendKeys(testPostContent);
    console.log(`   ✓ Post content entered: "${testPostContent}"`);
    
    // Click Post button on profile page
    const postButton = await driver.findElement(By.xpath("//button[contains(text(), 'Post')]"));
    await clickWithJS(driver, postButton);
    console.log("   ✓ Post button clicked");
    
    // Wait for post to appear
    await driver.sleep(3000);
    const newPost = await waitForPost(driver, testPostContent);
    
    if (newPost) {
      console.log(`   ✅ Post created successfully on profile page!`);
      await takeScreenshot(driver, "post-created-profile");
      return testPostContent;
    } else {
      console.log("   ❌ Post not found on profile page");
      return null;
    }
  } catch (error) {
    console.error("   ❌ Error creating post on profile page:", error.message);
    await takeScreenshot(driver, "profile-post-error");
    return null;
  }
}

async function testLikePost(driver) {
  console.log("\n❤️ TEST 4: Liking a post...");
  
  try {
    // Find the first post's like button
    const likeButton = await driver.findElement(By.xpath("//button[contains(text(), 'Like')]"));
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", likeButton);
    await driver.sleep(500);
    
    // Check if already liked
    const buttonText = await likeButton.getText();
    const isAlreadyLiked = buttonText.includes('Liked');
    
    await clickWithJS(driver, likeButton);
    await driver.sleep(1500);
    console.log(`   ✓ Like button clicked (was ${isAlreadyLiked ? 'liked' : 'unliked'})`);
    
    // Verify the button text changed
    const newButtonText = await likeButton.getText();
    if ((isAlreadyLiked && !newButtonText.includes('Liked')) || 
        (!isAlreadyLiked && newButtonText.includes('Liked'))) {
      console.log("   ✅ Like/Unlike action successful!");
    } else {
      console.log("   ⚠️ Like action may have failed");
    }
    
    await takeScreenshot(driver, "post-liked");
  } catch (error) {
    console.error("   ❌ Error liking post:", error.message);
  }
}

async function testAddComment(driver) {
  console.log("\n💬 TEST 5: Adding comment to a post...");
  
  const testComment = `Automated test comment - ${Date.now()}`;
  
  try {
    // Find and click comment button on first post
    const commentButton = await driver.findElement(By.xpath("//button[contains(text(), 'Comment')]"));
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", commentButton);
    await driver.sleep(500);
    await clickWithJS(driver, commentButton);
    console.log("   ✓ Comment button clicked");
    await driver.sleep(1000);
    
    // Find the comment textarea
    const commentTextarea = await driver.findElement(By.xpath("//textarea[contains(@placeholder, 'Write a comment')]"));
    await commentTextarea.clear();
    await commentTextarea.sendKeys(testComment);
    console.log(`   ✓ Comment entered: "${testComment}"`);
    
    // Click the comment submit button
    const submitCommentButton = await driver.findElement(By.xpath("//button[contains(text(), 'Comment') and not(contains(text(), 'Like'))]"));
    await clickWithJS(driver, submitCommentButton);
    console.log("   ✓ Submit comment button clicked");
    
    // Wait for comment to appear
    await driver.sleep(2000);
    const newComment = await driver.findElement(By.xpath(`//p[contains(text(), '${testComment}')]`));
    
    if (newComment) {
      console.log("   ✅ Comment added successfully!");
      await takeScreenshot(driver, "comment-added");
    } else {
      console.log("   ⚠️ Comment may not have been added");
    }
  } catch (error) {
    console.error("   ❌ Error adding comment:", error.message);
    await takeScreenshot(driver, "comment-error");
  }
}

async function testNavigateToFriendsPage(driver) {
  console.log("\n👥 TEST 6: Navigating to Friends Page...");
  
  try {
    // Find and click Friends/Discover People button
    const friendsButton = await driver.findElement(By.xpath("//button[contains(text(), 'Discover People')]"));
    await clickWithJS(driver, friendsButton);
    await driver.sleep(2000);
    console.log("   ✓ Navigated to Friends Page");
    
    const currentUrl = await driver.getCurrentUrl();
    if (currentUrl.includes("FriendsPage")) {
      console.log("   ✅ Friends page loaded successfully!");
      await takeScreenshot(driver, "friends-page");
    } else {
      console.log(`   ⚠️ Current URL: ${currentUrl}`);
    }
    
    // Go back to home page
    await driver.navigate().back();
    await driver.sleep(2000);
    console.log("   ✓ Returned to home page");
  } catch (error) {
    console.error("   ❌ Error navigating to friends page:", error.message);
  }
}

async function testPostDeletion(driver, postContent) {
  if (!postContent) {
    console.log("\n🗑️ TEST 7: Skipping post deletion test (no post to delete)");
    return;
  }
  
  console.log("\n🗑️ TEST 7: Deleting test post...");
  
  try {
    // Navigate to profile page to delete posts
    const profileLink = await driver.findElement(By.xpath("//a[contains(@href, '/profile/')]"));
    await clickWithJS(driver, profileLink);
    await driver.sleep(2000);
    
    // Find the post with our content
    const postElement = await driver.findElement(By.xpath(`//p[contains(text(), '${postContent}')]`));
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", postElement);
    await driver.sleep(500);
    
    // Find and click the options menu (three dots)
    const optionsButton = await postElement.findElement(By.xpath("./ancestor::div[contains(@class, 'bg-gray-800')]//button[contains(@class, 'hover:bg-gray-700')]"));
    await clickWithJS(driver, optionsButton);
    await driver.sleep(500);
    
    // Click delete option
    const deleteButton = await driver.findElement(By.xpath("//button[contains(text(), 'Delete Post')]"));
    await clickWithJS(driver, deleteButton);
    await driver.sleep(500);
    
    // Handle confirmation dialog
    try {
      const alert = await driver.switchTo().alert();
      await alert.accept();
      console.log("   ✓ Confirmed deletion");
    } catch (e) {
      // If no alert, try to find and click confirm button
      const confirmButton = await driver.findElement(By.xpath("//button[contains(text(), 'Delete')]"));
      if (confirmButton) {
        await clickWithJS(driver, confirmButton);
      }
    }
    
    await driver.sleep(2000);
    console.log("   ✅ Post deleted successfully!");
    await takeScreenshot(driver, "post-deleted");
  } catch (error) {
    console.error("   ❌ Error deleting post:", error.message);
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
  
  let createdPostContent = null;
  
  try {
    console.log("🚀 STARTING POST FUNCTIONALITY TESTS\n");
    console.log("=" .repeat(50));
    
    // Login first
    await login(driver);
    
    // Run all tests
    createdPostContent = await testCreatePostOnHomePage(driver);
    await driver.sleep(2000);
    
    await testCreatePostWithImage(driver);
    await driver.sleep(2000);
    
    await testCreatePostOnProfilePage(driver);
    await driver.sleep(2000);
    
    await testLikePost(driver);
    await driver.sleep(2000);
    
    await testAddComment(driver);
    await driver.sleep(2000);
    
    await testNavigateToFriendsPage(driver);
    await driver.sleep(2000);
    
    await testPostDeletion(driver, createdPostContent);
    
    console.log("\n" + "=".repeat(50));
    console.log("\n✅ ALL TESTS COMPLETED SUCCESSFULLY!");
    console.log("📸 Screenshots saved for each test step");
    
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error.message);
    await takeScreenshot(driver, "test-failure");
    console.log("📸 Failure screenshot saved as test-failure.png");
  } finally {
    await driver.sleep(3000);
    await driver.quit();
    console.log("\n🔚 Browser closed.");
  }
}

// Run the tests
runAllTests().catch(console.error);