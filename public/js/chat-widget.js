// Chat Widget JavaScript
class ChatWidget {
  constructor() {
    this.socket = null;
    this.isOpen = false;
    this.isTyping = false;
    this.typingTimeout = null;
    this.messages = [];
    this.currentUser = null;
    this.isAdmin = false;
    this.currentChatRoom = null;
    this.isAdminLargeOpen = false;

    this.init();
  }

  async init() {
    console.log("🚀 Initializing ChatWidget...");
    await this.checkUserRole();
    console.log("✅ User role checked:", this.isAdmin ? "ADMIN" : "USER");
    this.createWidget();
    console.log("✅ Widget created");
    this.connectSocket();
    console.log("✅ Socket connected");
    this.bindEvents();
    console.log("✅ Events bound");

    // Không force open chat window nữa - chỉ mở khi user click
    console.log(
      "✅ Chat widget initialized - window stays closed until clicked"
    );

    // Debug: Kiểm tra trạng thái ban đầu
    setTimeout(() => {
      const chatWindow = document.getElementById("chat-window");
      if (chatWindow) {
        console.log("🔍 Initial chat window state:");
        console.log("- Hidden class:", chatWindow.classList.contains("hidden"));
        console.log(
          "- Display style:",
          window.getComputedStyle(chatWindow).display
        );
        console.log(
          "- Visibility:",
          window.getComputedStyle(chatWindow).visibility
        );
        console.log("- Opacity:", window.getComputedStyle(chatWindow).opacity);
      }
    }, 1000);
  }

  async checkUserRole() {
    console.log("🔍 Checking user role...");
    try {
      const token = this.getCookie("accessToken");
      console.log("Token found:", !!token);

      if (token) {
        console.log("📡 Fetching user info...");
        const response = await fetch("/api/user-info", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("Response status:", response.status);

        if (response.ok) {
          const userData = await response.json();
          console.log("User data received:", userData);
          this.currentUser = userData;
          this.isAdmin = userData.role === "ADMIN";
          console.log("User role detected:", this.isAdmin ? "ADMIN" : "USER");

          if (this.isAdmin) {
            this.currentChatRoom = "admin";
          }
        } else {
          console.error("Failed to fetch user info:", response.status);
        }
      } else {
        console.log("No token found, user is guest");
      }
    } catch (error) {
      console.error("Error checking user role:", error);
    }
  }

  createWidget() {
    console.log("🏗️ Creating widget...");
    console.log("User role:", this.isAdmin ? "ADMIN" : "USER");

    // Xóa tất cả widget cũ nếu có
    const widgetsToRemove = [
      "chat-widget",
      "admin-small-widget",
      "admin-large-widget",
      "chat-button",
      "chat-window",
    ];

    widgetsToRemove.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        console.log(`🗑️ Removing old widget: ${id}`);
        element.remove();
      }
    });

    // Xóa tất cả element có class chứa chat hoặc admin
    const chatElements = document.querySelectorAll(
      '[class*="chat"], [class*="admin"]'
    );
    chatElements.forEach((element) => {
      if (
        element.id &&
        (element.id.includes("chat") || element.id.includes("admin"))
      ) {
        element.remove();
      }
    });

    // Xóa tất cả element có position fixed và z-index cao (có thể là widget)
    const fixedElements = document.querySelectorAll(
      '[style*="position: fixed"]'
    );
    fixedElements.forEach((element) => {
      if (
        element.id &&
        (element.id.includes("chat") ||
          element.id.includes("admin") ||
          element.id.includes("widget"))
      ) {
        element.remove();
      }
    });

    // Xóa tất cả element có class admin-chat-*
    const adminChatElements = document.querySelectorAll(
      '[class*="admin-chat"]'
    );
    adminChatElements.forEach((element) => {
      element.remove();
    });

    // Xóa tất cả element có class admin-chat-*
    const adminChatPositionElements = document.querySelectorAll(
      ".admin-chat-top-left, .admin-chat-bottom-left, .admin-chat-bottom-right-small"
    );
    adminChatPositionElements.forEach((element) => {
      element.remove();
    });

    if (this.isAdmin) {
      // Tạo 2 widgets cho admin: icon nhỏ và chat window lớn
      const adminSmallWidget = `
        <div id="admin-small-widget" class="admin-small-widget admin-chat-bottom-right-small">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
        </div>
      `;

      const adminLargeWidget = `
        <div id="admin-large-widget" class="admin-large-widget admin-chat-bottom-right hidden">
          <!-- Header -->
          <div class="chat-header">
            <h3>Admin Chat</h3>
            <button class="close-btn" id="close-admin-chat">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Messages Area -->
          <div class="chat-messages" id="admin-chat-messages">
            <div class="text-center py-8">
              <div class="text-gray-500 mb-4">
                <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-2.239"></path>
                </svg>
                <p class="text-sm">Admin Chat Widget</p>
                <p class="text-xs text-gray-400 mb-4">Để chat với user cụ thể, vui lòng sử dụng Admin Interface</p>
                <a href="/admin/chat-fixed" class="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                  Mở Admin Chat
                </a>
              </div>
            </div>
          </div>

          <!-- Input Area -->
          <div class="chat-input">
            <input type="text" placeholder="Nhập tin nhắn..." id="admin-chat-input" disabled>
            <button class="send-btn" id="admin-send-btn" disabled>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            </button>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML("beforeend", adminSmallWidget);
      document.body.insertAdjacentHTML("beforeend", adminLargeWidget);
    } else {
      console.log("👤 Creating user widget...");
      // Tạo 1 widget cho user thường
      const userWidget = `
        <div id="chat-widget" class="fixed bottom-4 right-4 z-50">
          <!-- Chat Button -->
          <div id="chat-button" class="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full p-4 shadow-xl cursor-pointer transition-all duration-300 transform hover:scale-110 hover:shadow-2xl">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
          </div>

          <!-- Chat Window -->
          <div id="chat-window" class="hidden absolute bottom-16 right-0 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-lg" id="admin-name">StudyBlog Support</h3>
                  <p class="text-blue-100 text-sm">Chúng tôi luôn sẵn sàng hỗ trợ</p>
                </div>
              </div>
              <button id="close-chat" class="text-white hover:text-blue-100 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <!-- Messages Area -->
            <div id="chat-messages" class="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50 min-h-0">
              <!-- Messages will be inserted here -->
            </div>

            <!-- Typing Indicator -->
            <div id="typing-indicator" class="hidden px-4 py-3 bg-white border-t border-gray-100">
              <div class="flex items-center space-x-2">
                <div class="flex space-x-1">
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                </div>
                <span class="text-sm text-gray-500">Đang nhập tin nhắn...</span>
              </div>
            </div>

            <!-- Input Area -->
            <div class="p-4 bg-white border-t border-gray-100">
              <div class="flex space-x-3">
                <input 
                  id="chat-input" 
                  type="text" 
                  placeholder="Nhập tin nhắn của bạn..." 
                  class="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  maxlength="500"
                >
                <button 
                  id="send-message" 
                  class="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML("beforeend", userWidget);
      console.log("✅ User widget inserted into DOM");

      // Verify widget was created
      const chatWidget = document.getElementById("chat-widget");
      const chatButton = document.getElementById("chat-button");
      const chatWindow = document.getElementById("chat-window");
      const chatInput = document.getElementById("chat-input");
      const sendMessage = document.getElementById("send-message");

      console.log("🔍 Widget verification:");
      console.log("- chat-widget exists:", !!chatWidget);
      console.log("- chat-button exists:", !!chatButton);
      console.log("- chat-window exists:", !!chatWindow);
      console.log("- chat-input exists:", !!chatInput);
      console.log("- send-message exists:", !!sendMessage);

      if (chatInput) {
        console.log(
          "📝 Chat input styles:",
          window.getComputedStyle(chatInput)
        );
      }
      if (sendMessage) {
        console.log(
          "📤 Send button styles:",
          window.getComputedStyle(sendMessage)
        );
      }
    }
  }

  bindEvents() {
    console.log("🔗 Binding events...");
    if (this.isAdmin) {
      console.log("👑 Binding admin events...");
      // Admin widget events
      const adminSmallWidget = document.getElementById("admin-small-widget");
      const closeAdminChat = document.getElementById("close-admin-chat");

      if (adminSmallWidget) {
        adminSmallWidget.addEventListener("click", () => {
          this.toggleAdminLargeChat();
        });
        console.log("✅ Admin small widget event bound");
      }

      if (closeAdminChat) {
        closeAdminChat.addEventListener("click", () => {
          this.closeAdminLargeChat();
        });
        console.log("✅ Admin close button event bound");
      }
    } else {
      console.log("👤 Binding user events...");
      // User widget events
      const chatButton = document.getElementById("chat-button");
      const closeChat = document.getElementById("close-chat");
      const sendMessage = document.getElementById("send-message");
      const chatInput = document.getElementById("chat-input");

      console.log("🔍 User elements found:");
      console.log("- chatButton:", !!chatButton);
      console.log("- closeChat:", !!closeChat);
      console.log("- sendMessage:", !!sendMessage);
      console.log("- chatInput:", !!chatInput);

      if (chatButton) {
        chatButton.addEventListener("click", (e) => {
          console.log("🖱️ Chat button clicked!");
          console.log("Event target:", e.target);
          console.log("Event currentTarget:", e.currentTarget);
          console.log("Button element:", chatButton);
          this.toggleChat();
        });
        console.log("✅ Chat button event bound");

        // Chat button ready for manual click only
        console.log("✅ Chat button ready - click to open/close");
      }

      if (closeChat) {
        closeChat.addEventListener("click", () => {
          console.log("❌ Close button clicked!");
          this.closeChat();
        });
        console.log("✅ Close button event bound");
      }

      if (sendMessage) {
        sendMessage.addEventListener("click", () => {
          console.log("📤 Send button clicked!");
          this.sendMessage();
        });
        console.log("✅ Send button event bound");
      }

      if (chatInput) {
        chatInput.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            console.log("⌨️ Enter key pressed!");
            this.sendMessage();
          }
        });
        console.log("✅ Chat input event bound");
      }
    }
  }

  toggleAdminLargeChat() {
    const adminLargeWidget = document.getElementById("admin-large-widget");
    if (adminLargeWidget) {
      this.isAdminLargeOpen = !this.isAdminLargeOpen;
      console.log("🔄 Toggling admin large chat:", this.isAdminLargeOpen);
      if (this.isAdminLargeOpen) {
        adminLargeWidget.classList.remove("hidden");
        adminLargeWidget.style.display = "flex";
      } else {
        adminLargeWidget.classList.add("hidden");
        adminLargeWidget.style.display = "none";
      }
    } else {
      console.error("❌ Admin large widget not found");
    }
  }

  closeAdminLargeChat() {
    const adminLargeWidget = document.getElementById("admin-large-widget");
    if (adminLargeWidget) {
      this.isAdminLargeOpen = false;
      console.log("🔒 Closing admin large chat");
      adminLargeWidget.classList.add("hidden");
      adminLargeWidget.style.display = "none";
    } else {
      console.error("❌ Admin large widget not found for closing");
    }
  }

  toggleChat() {
    console.log("🔄 Toggling chat window...");
    const chatWindow = document.getElementById("chat-window");
    console.log("Chat window element:", chatWindow);
    console.log("Current isOpen state:", this.isOpen);

    if (chatWindow) {
      this.isOpen = !this.isOpen;
      console.log("Chat is now open:", this.isOpen);

      if (this.isOpen) {
        console.log("📖 Opening chat window...");
        console.log(
          "Before removing hidden class:",
          chatWindow.classList.contains("hidden")
        );
        chatWindow.classList.remove("hidden");
        console.log(
          "After removing hidden class:",
          chatWindow.classList.contains("hidden")
        );
        console.log(
          "Chat window display style:",
          window.getComputedStyle(chatWindow).display
        );

        // Không thêm tin nhắn test tự động nữa
        console.log("📖 Chat window opened - no auto messages");

        this.scrollToBottom();
        console.log("✅ Chat window opened successfully");
      } else {
        console.log("📖 Closing chat window...");
        console.log(
          "Before adding hidden class:",
          chatWindow.classList.contains("hidden")
        );
        chatWindow.classList.add("hidden");
        console.log(
          "After adding hidden class:",
          chatWindow.classList.contains("hidden")
        );
        console.log(
          "Chat window display style:",
          window.getComputedStyle(chatWindow).display
        );
        console.log("✅ Chat window closed successfully");
      }
    } else {
      console.error("❌ Chat window element not found!");
    }
  }

  closeChat() {
    const chatWindow = document.getElementById("chat-window");
    if (chatWindow) {
      this.isOpen = false;
      chatWindow.classList.add("hidden");
    }
  }

  connectSocket() {
    this.socket = io();

    console.log("🔌 Connecting to socket...");
    console.log("User role:", this.isAdmin ? "ADMIN" : "USER");

    this.socket.on("connect", () => {
      console.log("✅ Socket connected successfully");
      console.log("Socket ID:", this.socket.id);
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      this.showNotification("Không thể kết nối đến server chat");
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
      this.showNotification("Mất kết nối chat. Đang thử kết nối lại...");
    });

    this.socket.on("reconnect", () => {
      console.log("Socket reconnected");
      this.showNotification("Đã kết nối lại chat thành công");
      const token = this.getCookie("accessToken");
      this.socket.emit("join-chat", { token });
    });

    const token = this.getCookie("accessToken");
    this.socket.emit("join-chat", { token });

    // Request chat history for user
    if (!this.isAdmin) {
      setTimeout(() => {
        console.log("📚 Requesting chat history for user...");
        this.socket.emit("request-chat-history", { token });
      }, 1000);
    }

    // Lắng nghe thông báo tin nhắn mới (cho admin)
    this.socket.on("new-user-message", (data) => {
      console.log("Admin received new-user-message:", data);
      if (this.isAdmin) {
        this.showNotification(
          `Tin nhắn mới từ ${data.userName}: ${data.message}`
        );
      }
    });

    // Lắng nghe tin nhắn chat (cho user)
    this.socket.on("chat-message", (message) => {
      console.log("📨 Received chat message:", message);
      console.log("Current user role:", this.isAdmin ? "ADMIN" : "USER");
      this.addMessage(message);
    });

    // Lắng nghe tin nhắn từ admin (cho user)
    this.socket.on("admin-message", (data) => {
      console.log("🎯 User received admin message:", data);
      console.log("Current user role:", this.isAdmin ? "ADMIN" : "USER");
      console.log("Socket ID:", this.socket.id);

      const adminMessage = {
        id: `admin-${Date.now()}`,
        userId: "admin",
        userName: data.adminName || "Admin",
        message: data.message,
        timestamp: new Date(data.timestamp),
        isAdmin: true,
      };

      console.log("📝 Adding admin message to user widget:", adminMessage);
      this.addMessage(adminMessage);
    });

    // Lắng nghe typing indicator
    this.socket.on("user-typing", (data) => {
      console.log("User typing:", data);
      this.showTypingIndicator(data.userName);
    });

    // Lắng nghe chat history
    this.socket.on("chat-history", (data) => {
      console.log("📚 Received chat history:", data);
      console.log("Chat room ID:", data?.chatRoomId);
      console.log(
        "Number of messages:",
        data?.messages ? data.messages.length : 0
      );
      console.log("Messages:", data?.messages);

      if (data && data.messages) {
        this.messages = data.messages;
        console.log(
          "✅ Updated messages array, now has",
          this.messages.length,
          "messages"
        );
        this.renderMessages();
      } else {
        console.log("❌ No messages in chat history data");
      }
    });

    // Không thêm test message tự động nữa
    console.log("✅ Socket events setup complete - no test messages");
  }

  sendMessage() {
    console.log("📤 Sending message...");
    const chatInput = document.getElementById("chat-input");
    if (!chatInput) {
      console.error("❌ Chat input not found");
      return;
    }

    const message = chatInput.value.trim();
    if (!message) {
      console.log("❌ Empty message");
      return;
    }

    if (!this.socket) {
      console.error("❌ Socket not connected");
      return;
    }

    const token = this.getCookie("accessToken");
    console.log("📤 Emitting send-message:", {
      message,
      token: token ? "present" : "missing",
    });

    this.socket.emit("send-message", {
      message: message,
      token: token,
    });

    chatInput.value = "";
    console.log("✅ Message sent, input cleared");
  }

  addMessage(message) {
    console.log("➕ Adding message:", message);
    console.log("Current messages count:", this.messages.length);
    this.messages.push(message);
    console.log("Total messages after adding:", this.messages.length);
    this.renderMessages();
    this.scrollToBottom();
  }

  renderMessages() {
    const chatMessages = document.getElementById("chat-messages");
    if (!chatMessages) {
      console.log("❌ Chat messages container not found");
      return;
    }

    console.log("🔄 Rendering messages...");
    console.log("Number of messages to render:", this.messages.length);
    console.log("Messages before sorting:", this.messages);

    // Sắp xếp tin nhắn theo timestamp
    const sortedMessages = [...this.messages].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      console.log(
        `🕐 Comparing: ${a.message} (${timeA}) vs ${b.message} (${timeB})`
      );
      return timeA - timeB;
    });

    console.log("Messages after sorting:", sortedMessages);
    console.log("Chat messages container:", chatMessages);

    chatMessages.innerHTML = "";

    sortedMessages.forEach((message, index) => {
      console.log(`📝 Rendering message ${index + 1}:`, message);
      const messageElement = this.createMessageElement(message);
      console.log("Created message element:", messageElement);
      chatMessages.appendChild(messageElement);
    });

    console.log("✅ Messages rendered successfully");
    console.log("Final chat messages HTML:", chatMessages.innerHTML);
  }

  createMessageElement(message) {
    console.log("🎨 Creating message element for:", message);
    const messageDiv = document.createElement("div");
    messageDiv.className = "flex space-x-3";

    if (message.isAdmin) {
      // Admin message (left side - như các app chat khác)
      console.log("Creating admin message element (LEFT)");
      messageDiv.innerHTML = `
        <div class="max-w-xs lg:max-w-md">
          <div class="bg-gray-200 text-gray-800 p-3 rounded-lg">
            <p class="text-sm">${this.escapeHtml(message.message)}</p>
          </div>
          <div class="text-xs text-gray-500 mt-1">
            ${message.userName || "Admin"} • ${this.formatTime(
        message.timestamp
      )}
          </div>
        </div>
        <div class="flex-1"></div>
      `;
    } else {
      // User message (right side - như các app chat khác)
      console.log("Creating user message element (RIGHT)");
      messageDiv.innerHTML = `
        <div class="flex-1"></div>
        <div class="max-w-xs lg:max-w-md">
          <div class="bg-blue-600 text-white p-3 rounded-lg">
            <p class="text-sm">${this.escapeHtml(message.message)}</p>
          </div>
          <div class="text-xs text-gray-500 mt-1 text-right">
            ${this.formatTime(message.timestamp)}
          </div>
        </div>
      `;
    }

    console.log("Created message div:", messageDiv);
    return messageDiv;
  }

  showTypingIndicator(userName) {
    const typingIndicator = document.getElementById("typing-indicator");
    if (typingIndicator) {
      typingIndicator.classList.remove("hidden");

      setTimeout(() => {
        typingIndicator.classList.add("hidden");
      }, 3000);
    }
  }

  showNotification(message) {
    const notification = document.createElement("div");
    notification.className =
      "fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full";
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.remove("translate-x-full");
    }, 100);

    setTimeout(() => {
      notification.classList.add("translate-x-full");
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 5000);
  }

  scrollToBottom() {
    const chatMessages = document.getElementById("chat-messages");
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }
}

// Initialize chat widget when page loads (only if not already initialized)
document.addEventListener("DOMContentLoaded", () => {
  if (!window.chatWidget) {
    console.log("🔄 Auto-initializing ChatWidget from script...");
    window.chatWidget = new ChatWidget();
  }
});
