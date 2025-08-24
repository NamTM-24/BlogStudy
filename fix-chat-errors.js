// Script để kiểm tra và sửa các lỗi chat system
console.log("🔧 Chat System Error Checker Started...");

// Kiểm tra các vấn đề chính
const issues = [];

// 1. Kiểm tra Socket.IO connection
function checkSocketConnection() {
  if (typeof io === "undefined") {
    issues.push("❌ Socket.IO not loaded");
    return false;
  }

  try {
    const testSocket = io();
    testSocket.on("connect", () => {
      console.log("✅ Socket.IO connection successful");
      testSocket.disconnect();
    });
    testSocket.on("connect_error", (error) => {
      issues.push(`❌ Socket.IO connection failed: ${error.message}`);
    });
    return true;
  } catch (error) {
    issues.push(`❌ Socket.IO error: ${error.message}`);
    return false;
  }
}

// 2. Kiểm tra Chat Widget
function checkChatWidget() {
  const chatWidget = document.getElementById("chat-widget");
  if (!chatWidget) {
    issues.push("❌ Chat widget not found in DOM");
    return false;
  }

  console.log("✅ Chat widget found");

  // Kiểm tra vị trí
  const computedStyle = window.getComputedStyle(chatWidget);
  const position = computedStyle.position;
  const bottom = computedStyle.bottom;
  const right = computedStyle.right;

  console.log("Widget position:", { position, bottom, right });

  if (position !== "fixed") {
    issues.push("❌ Chat widget position should be fixed");
  }

  return true;
}

// 3. Kiểm tra User Role Detection
function checkUserRoleDetection() {
  const token = getCookie("accessToken");
  if (!token) {
    issues.push("⚠️ No access token found (user not logged in)");
    return false;
  }

  console.log("✅ Access token found");
  return true;
}

// 4. Kiểm tra CSS Classes
function checkCSSClasses() {
  const chatWidget = document.getElementById("chat-widget");
  if (!chatWidget) return false;

  const classes = chatWidget.className;
  console.log("Chat widget classes:", classes);

  if (
    classes.includes("admin-chat-right") ||
    classes.includes("chat-widget-default")
  ) {
    console.log("✅ CSS classes applied correctly");
    return true;
  } else {
    issues.push("❌ CSS classes not applied correctly");
    return false;
  }
}

// 5. Kiểm tra Message Handling
function checkMessageHandling() {
  if (typeof window.ChatWidget === "undefined") {
    issues.push("❌ ChatWidget class not available");
    return false;
  }

  console.log("✅ ChatWidget class available");
  return true;
}

// Helper function để lấy cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

// Chạy tất cả các kiểm tra
function runAllChecks() {
  console.log("\n🔍 Running Chat System Checks...\n");

  checkSocketConnection();
  checkChatWidget();
  checkUserRoleDetection();
  checkCSSClasses();
  checkMessageHandling();

  // Hiển thị kết quả
  setTimeout(() => {
    console.log("\n📊 Check Results:");
    if (issues.length === 0) {
      console.log("✅ All checks passed! Chat system should work correctly.");
    } else {
      console.log("❌ Issues found:");
      issues.forEach((issue) => console.log(issue));
      console.log("\n💡 Recommendations:");
      console.log("1. Make sure user is logged in");
      console.log("2. Check browser console for errors");
      console.log("3. Verify Socket.IO server is running");
      console.log("4. Check CSS files are loaded correctly");
    }
  }, 2000);
}

// Chạy kiểm tra khi trang load
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(runAllChecks, 1000);
});

// Export cho testing
window.ChatSystemChecker = {
  runAllChecks,
  checkSocketConnection,
  checkChatWidget,
  checkUserRoleDetection,
  checkCSSClasses,
  checkMessageHandling,
};

console.log("🔧 Chat System Error Checker Loaded");
