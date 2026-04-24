// controllers/sosController.js
const ElderlyUser = require("../models/ElderlyUser");
const axios = require('axios');
const twilio = require('twilio');

// Initialize Twilio client (if using Twilio)
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Helper function to format Sri Lankan phone numbers
const formatSriLankanNumber = (phoneNumber) => {
  if (!phoneNumber) return null;
  
  // Remove all non-numeric characters
  let cleanNumber = phoneNumber.replace(/\D/g, '');
  
  console.log(`[DEBUG] Original number from DB: ${phoneNumber}`);
  console.log(`[DEBUG] Cleaned number: ${cleanNumber}`);
  
  // Sri Lankan number formatting rules:
  if (cleanNumber.startsWith('0')) {
    cleanNumber = '94' + cleanNumber.substring(1);
    console.log(`[DEBUG] Removed leading 0, added 94: ${cleanNumber}`);
  }
  else if (cleanNumber.length === 9 && !cleanNumber.startsWith('94')) {
    cleanNumber = '94' + cleanNumber;
    console.log(`[DEBUG] Added 94 to 9-digit number: ${cleanNumber}`);
  }
  else if (cleanNumber.startsWith('94') && cleanNumber.length === 11) {
    console.log(`[DEBUG] Number already in correct format: ${cleanNumber}`);
  }
  else if (cleanNumber.length === 9 && cleanNumber.startsWith('7')) {
    cleanNumber = '94' + cleanNumber;
    console.log(`[DEBUG] Added 94 to number starting with 7: ${cleanNumber}`);
  }
  
  console.log(`[DEBUG] Final formatted number for Twilio: +${cleanNumber}`);
  return cleanNumber;
};

// @desc    Send SOS emergency alert
// @route   POST /api/sos/send
// @access  Private
exports.sendSOS = async (req, res) => {
  try {
    console.log("[DEBUG] ========== SOS SEND STARTED ==========");
    console.log("[DEBUG] Request body:", req.body);
    console.log("[DEBUG] User ID from token:", req.user.id);
    
    const userId = req.user.id;
    const { location, message } = req.body;
    
    // Get user with emergency contacts
    const user = await ElderlyUser.findById(userId);
    
    if (!user) {
      console.log("[DEBUG] User not found in database");
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.log("[DEBUG] User found:", {
      firstName: user.firstName,
      lastName: user.lastName,
      emergencyPhone: user.emergencyPhone,
      emergencyContact: user.emergencyContact,
      phone: user.phone
    });

    // Check if user has emergency contact
    if (!user.emergencyPhone && !user.emergencyContact) {
      console.log("[DEBUG] No emergency contact found");
      return res.status(400).json({
        success: false,
        message: "No emergency contact information found. Please update your profile."
      });
    }

    const emergencyResults = [];
    const timestamp = new Date().toLocaleString();

    // Prepare SOS message
    const sosMessage = message || `🚨 EMERGENCY SOS ALERT from ${user.firstName} ${user.lastName}`;
    const fullMessage = `${sosMessage}\n\n` +
      `Name: ${user.firstName} ${user.lastName}\n` +
      `Phone: ${user.phone || 'Not provided'}\n` +
      `Address: ${user.address || 'Not provided'}, ${user.city || ''} ${user.state || ''}\n` +
      `Time: ${timestamp}\n` +
      (location ? `Location: https://maps.google.com/?q=${location.lat},${location.lng}\n` : '') +
      `\nPlease check on ${user.firstName} immediately!`;

    // 1. Send WhatsApp message (if phone number is available)
    if (user.emergencyPhone) {
      console.log("[DEBUG] Attempting to send WhatsApp to:", user.emergencyPhone);
      try {
        const whatsappResult = await sendWhatsAppMessage(
          user.emergencyPhone, 
          fullMessage, 
          `${user.firstName} ${user.lastName}`,
          user.phone,     // Add this - user's phone number for callback
          location        // Add this - location coordinates
        );
        console.log("[DEBUG] WhatsApp result:", whatsappResult);
        emergencyResults.push({
          method: 'whatsapp',
          success: whatsappResult.success,
          recipient: user.emergencyPhone,
          ...whatsappResult
        });
      } catch (error) {
        console.error("[DEBUG] WhatsApp send error:", error);
        emergencyResults.push({
          method: 'whatsapp',
          success: false,
          recipient: user.emergencyPhone,
          error: error.message
        });
      }
    } else {
      console.log("[DEBUG] No emergency phone number available");
    }

    // Log SOS event
    await logSOSEvent(userId, {
      timestamp,
      location,
      message: sosMessage,
      results: emergencyResults
    });

    // Determine overall success
    const anySuccess = emergencyResults.some(r => r.success);
    
    console.log("[DEBUG] Final results:", emergencyResults);
    console.log("[DEBUG] ========== SOS SEND COMPLETED ==========");
    
    res.json({
      success: anySuccess,
      message: anySuccess 
        ? "SOS alert sent successfully" 
        : "Failed to send SOS alert. Please try calling emergency services.",
      results: emergencyResults
    });

  } catch (error) {
    console.error("[DEBUG] SOS error:", error);
    res.status(500).json({
      success: false,
      message: "Error sending SOS alert",
      error: error.message
    });
  }
};

// WhatsApp message sending function - UPDATED with your new SOS template
async function sendWhatsAppMessage(phoneNumber, message, userName, userPhone, location) {
  console.log("[DEBUG] ====== INSIDE sendWhatsAppMessage ======");
  console.log("[DEBUG] Input phoneNumber:", phoneNumber);
  console.log("[DEBUG] User name:", userName);
  console.log("[DEBUG] User phone:", userPhone);
  console.log("[DEBUG] Location:", location);
  
  // Format the Sri Lankan number correctly
  const formattedNumber = formatSriLankanNumber(phoneNumber);
  
  if (!formattedNumber) {
    console.log("[DEBUG] Failed to format number");
    return { 
      provider: 'error', 
      success: false, 
      error: 'Invalid phone number format' 
    };
  }
  
  console.log(`[DEBUG] Formatted number for Twilio: +${formattedNumber}`);

  // Check Twilio configuration
  console.log("[DEBUG] Twilio client exists:", !!twilioClient);
  console.log("[DEBUG] TWILIO_WHATSAPP_NUMBER:", process.env.TWILIO_WHATSAPP_NUMBER);
  console.log("[DEBUG] OLD TEMPLATE SID:", process.env.TWILIO_TEMPLATE_SID);
  
  // YOUR NEW SOS TEMPLATE SID - Replace with the one from your image
  const YOUR_SOS_TEMPLATE_SID = 'HX06d50d46d4364d63e279f2d694e876a7';
  console.log("[DEBUG] NEW SOS TEMPLATE SID:", YOUR_SOS_TEMPLATE_SID);

  // Method 1: Use your new SOS template first
  if (twilioClient && process.env.TWILIO_WHATSAPP_NUMBER && YOUR_SOS_TEMPLATE_SID) {
    try {
      // Create location link if available
      const locationLink = location 
        ? `https://maps.google.com/?q=${location.lat},${location.lng}`
        : "Location not available";
      
      // Format the variables for your SOS template
      const contentVariables = JSON.stringify({
        "1": userName,                    // Person's name (e.g., "Saman Indika")
        "2": locationLink,                 // Location link
        "3": new Date().toLocaleString(),  // Current time (e.g., "3/9/2024 8:45 PM")
        "4": userPhone || "Not provided"   // Call back number
      });
      
      console.log("[DEBUG] Attempting to send NEW SOS template:");
      console.log("[DEBUG] - From:", `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`);
      console.log("[DEBUG] - To:", `whatsapp:+${formattedNumber}`);
      console.log("[DEBUG] - Template SID:", YOUR_SOS_TEMPLATE_SID);
      console.log("[DEBUG] - Content Variables:", contentVariables);
      
      const response = await twilioClient.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:+${formattedNumber}`,
        contentSid: YOUR_SOS_TEMPLATE_SID,
        contentVariables: contentVariables
      });
      
      console.log("[DEBUG] ✅ NEW SOS template message sent successfully!");
      console.log("[DEBUG] Message SID:", response.sid);
      
      return { 
        provider: 'twilio_sos_template', 
        messageId: response.sid,
        success: true 
      };
    } catch (templateError) {
      console.error("[DEBUG] ❌ NEW SOS template error:");
      console.error("[DEBUG] - Error code:", templateError.code);
      console.error("[DEBUG] - Error message:", templateError.message);
      
      // If new template fails, try the old appointment template
      console.log("[DEBUG] Trying old appointment template as fallback...");
    }
  }

  // Method 2: Fallback to old appointment template
  if (twilioClient && process.env.TWILIO_WHATSAPP_NUMBER && process.env.TWILIO_TEMPLATE_SID) {
    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { 
        month: 'numeric', 
        day: 'numeric' 
      });
      const timeStr = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      
      const contentVariables = JSON.stringify({
        "1": dateStr,
        "2": timeStr
      });
      
      console.log("[DEBUG] Attempting to send old appointment template:");
      
      const response = await twilioClient.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:+${formattedNumber}`,
        contentSid: process.env.TWILIO_TEMPLATE_SID,
        contentVariables: contentVariables
      });
      
      console.log("[DEBUG] ✅ Appointment template message sent:", response.sid);
      return { 
        provider: 'twilio_appointment_template', 
        messageId: response.sid,
        success: true 
      };
    } catch (error) {
      console.error("[DEBUG] ❌ Appointment template error:", error);
    }
  }

  // Method 3: Generate WhatsApp deep link (final fallback)
  console.log("[DEBUG] Generating WhatsApp deep link as fallback");
  const emergencyMessage = `🚨 SOS Emergency from ${userName}\n\nPlease check on me immediately!`;
  const whatsappLink = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(emergencyMessage)}`;
  
  console.log("[DEBUG] Generated link:", whatsappLink);
  
  return { 
    provider: 'whatsapp_link',
    link: whatsappLink,
    success: true,
    message: 'WhatsApp link generated - click to open WhatsApp'
  };
}

// Log SOS event
async function logSOSEvent(userId, data) {
  const SOSLog = require('../models/SOSLog');
  
  await SOSLog.create({
    user: userId,
    timestamp: data.timestamp,
    location: data.location,
    message: data.message,
    results: data.results
  });
}

// @desc    Get SOS history for user
// @route   GET /api/sos/history
// @access  Private
exports.getSOSHistory = async (req, res) => {
  try {
    const SOSLog = require('../models/SOSLog');
    
    const history = await SOSLog.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error("Get SOS history error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching SOS history"
    });
  }
};

// @desc    Test Twilio connection
// @route   GET /api/sos/test
// @access  Private
exports.testTwilio = async (req, res) => {
  try {
    const user = await ElderlyUser.findById(req.user.id);
    
    const testResults = {
      twilioConfigured: !!twilioClient,
      environmentVariables: {
        TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? '✓ Set' : '✗ Missing',
        TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? '✓ Set' : '✗ Missing',
        TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '✗ Missing',
        TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER || '✗ Missing',
        TWILIO_TEMPLATE_SID: process.env.TWILIO_TEMPLATE_SID || '✗ Missing',
      },
      newSOSTemplateSID: 'HX06d50d46d4364d63e279f2d694e876a7',
      userEmergencyNumber: user?.emergencyPhone || 'Not set',
      formattedNumber: user?.emergencyPhone ? formatSriLankanNumber(user.emergencyPhone) : 'N/A',
      instructions: {
        step1: `From the emergency phone (${user?.emergencyPhone || 'your phone'}), open WhatsApp`,
        step2: "Send this EXACT message to +1 415 523 8886: join afraid-corner",
        step3: "Wait for confirmation reply (you should get a response)",
        note: "The sandbox connection expires every 3 days and needs to be renewed"
      }
    };
    
    res.json({
      success: true,
      message: 'Twilio configuration status',
      config: testResults
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Check credentials function
exports.checkCredentials = async (req, res) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN ? "Present (hidden)" : "Missing";
    const first5 = accountSid ? accountSid.substring(0, 5) : "None";
    const last5 = accountSid ? accountSid.substring(accountSid.length - 5) : "None";
    const length = accountSid ? accountSid.length : 0;
    
    res.json({
      success: true,
      data: {
        accountSidLength: length,
        accountSidFirst5: first5,
        accountSidLast5: last5,
        authTokenStatus: authToken,
        whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER,
        oldTemplateSid: process.env.TWILIO_TEMPLATE_SID,
        newTemplateSid: 'HX06d50d46d4364d63e279f2d694e876a7',
        expectedSid: "ACa8ec78f45319c08871fa11de0d5df5f",
        isCorrect: accountSid === "ACa8ec78f45319c08871fa11de0d5df5f"
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};