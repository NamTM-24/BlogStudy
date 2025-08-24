const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function updatePosts() {
  try {
    // 1. Cập nhật bài viết Node.js & Express
    await prisma.post.update({
      where: { slug: "nodejs-express-backend" },
      data: {
        lead: `
<p>Node.js là môi trường chạy JavaScript phía server, cho phép xây dựng ứng dụng nhanh và hiệu quả. Express là framework web tối giản và linh hoạt cho Node.js, giúp tạo ra các ứng dụng web và API một cách dễ dàng.</p>

<h2>Node.js - Môi trường runtime JavaScript</h2>
<p>Node.js được xây dựng trên V8 JavaScript engine của Chrome, cho phép chạy JavaScript bên ngoài trình duyệt. Điều này mở ra khả năng sử dụng JavaScript cho cả frontend và backend.</p>

<h3>Đặc điểm nổi bật của Node.js:</h3>
<ul>
<li><strong>Event-driven:</strong> Sử dụng mô hình event loop không đồng bộ</li>
<li><strong>Non-blocking I/O:</strong> Xử lý nhiều request đồng thời hiệu quả</li>
<li><strong>NPM ecosystem:</strong> Thư viện phong phú với hơn 1.5 triệu package</li>
<li><strong>Cross-platform:</strong> Chạy trên Windows, macOS, Linux</li>
</ul>

<h2>Express.js - Framework web cho Node.js</h2>
<p>Express là framework web tối giản và linh hoạt cho Node.js, cung cấp các tính năng mạnh mẽ để xây dựng ứng dụng web và API.</p>

<h3>Core features của Express:</h3>
<ul>
<li><strong>Routing:</strong> Định tuyến request đến handler tương ứng</li>
<li><strong>Middleware:</strong> Xử lý request qua các layer trung gian</li>
<li><strong>Template engines:</strong> Hỗ trợ nhiều template engine</li>
<li><strong>Static files:</strong> Phục vụ file tĩnh dễ dàng</li>
</ul>

<h2>Ví dụ thực tế: Tạo REST API</h2>
<pre><code>const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Routes
app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  res.status(201).json({ message: 'User created' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});</code></pre>

<h2>Best Practices</h2>
<ul>
<li>Sử dụng helmet.js để bảo mật headers</li>
<li>Validate input data</li>
<li>Implement rate limiting</li>
<li>Sử dụng HTTPS trong production</li>
</ul>

<h2>Kết luận</h2>
<p>Node.js & Express là bộ đôi hoàn hảo để xây dựng backend hiện đại. Với hiệu suất cao, ecosystem phong phú và cộng đồng lớn, đây là lựa chọn hàng đầu cho các dự án web.</p>
        `,
        excerpt:
          "Node.js là môi trường chạy JavaScript phía server, cho phép xây dựng ứng dụng nhanh và hiệu quả. Express là framework web tối giản và linh hoạt cho Node.js.",
      },
    });

    // 2. Cập nhật bài viết ReactJS
    await prisma.post.update({
      where: { slug: "reactjs-tu-co-ban-den-nang-cao" },
      data: {
        lead: `
<p>React là thư viện JavaScript phổ biến nhất để xây dựng giao diện người dùng. Học React từ cơ bản đến nâng cao sẽ mở ra cánh cửa cho việc phát triển ứng dụng web hiện đại.</p>

<h2>React là gì?</h2>
<p>React là một thư viện JavaScript được phát triển bởi Facebook (nay là Meta) để xây dựng giao diện người dùng. React sử dụng component-based architecture, cho phép tạo ra các UI component có thể tái sử dụng.</p>

<h3>Đặc điểm chính của React:</h3>
<ul>
<li><strong>Component-based:</strong> Xây dựng UI từ các component nhỏ, có thể tái sử dụng</li>
<li><strong>Virtual DOM:</strong> Tối ưu hóa hiệu suất render</li>
<li><strong>Unidirectional data flow:</strong> Dữ liệu chảy một chiều từ parent xuống child</li>
<li><strong>JSX:</strong> Cú pháp mở rộng cho phép viết HTML trong JavaScript</li>
</ul>

<h2>JSX - Cú pháp đặc biệt của React</h2>
<p>JSX cho phép bạn viết HTML-like code trong JavaScript:</p>
<pre><code>const element = (
  &lt;div className="greeting"&gt;
    &lt;h1&gt;Hello, World!&lt;/h1&gt;
    &lt;p&gt;Welcome to React&lt;/p&gt;
  &lt;/div&gt;
);</code></pre>

<h2>Components - Nền tảng của React</h2>
<p>Components là các khối xây dựng cơ bản của React ứng dụng:</p>

<h3>Functional Components (Modern React)</h3>
<pre><code>import React, { useState, useEffect } from 'react';

function UserProfile({ name, email }) {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    console.log('User profile mounted');
  }, []);

  return (
    &lt;div className="user-profile"&gt;
      &lt;h2&gt;{name}&lt;/h2&gt;
      &lt;p&gt;{email}&lt;/p&gt;
      &lt;span className={isOnline ? 'online' : 'offline'}&gt;
        {isOnline ? 'Online' : 'Offline'}
      &lt;/span&gt;
    &lt;/div&gt;
  );
}</code></pre>

<h2>Hooks - Quản lý state và side effects</h2>
<p>Hooks là các function đặc biệt cho phép sử dụng state và lifecycle methods trong functional components:</p>

<h3>useState Hook</h3>
<pre><code>const [count, setCount] = useState(0);

const increment = () => {
  setCount(count + 1);
};</code></pre>

<h3>useEffect Hook</h3>
<pre><code>useEffect(() => {
  document.title = \`Count: \${count}\`;
  
  return () => {
    document.title = 'React App';
  };
}, [count]);</code></pre>

<h2>Advanced React Patterns</h2>

<h3>1. Custom Hooks</h3>
<pre><code>function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
}</code></pre>

<h2>Performance Optimization</h2>
<p>Tối ưu hóa hiệu suất React ứng dụng:</p>

<h3>React.memo</h3>
<pre><code>const MemoizedComponent = React.memo(function MyComponent({ data }) {
  return &lt;div&gt;{data}&lt;/div&gt;;
});</code></pre>

<h3>useMemo và useCallback</h3>
<pre><code>const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);</code></pre>

<h2>Kết luận</h2>
<p>React đã trở thành một trong những thư viện JavaScript phổ biến nhất cho việc xây dựng giao diện người dùng. Với cộng đồng lớn, ecosystem phong phú và hiệu suất cao, React là lựa chọn hàng đầu cho các dự án web hiện đại.</p>
        `,
        excerpt:
          "React là thư viện JavaScript phổ biến nhất để xây dựng giao diện người dùng. Học React từ cơ bản đến nâng cao sẽ mở ra cánh cửa cho việc phát triển ứng dụng web hiện đại.",
      },
    });

    // 3. Cập nhật bài viết TailwindCSS
    await prisma.post.update({
      where: { slug: "tailwindcss-thiet-ke-giao-dien" },
      data: {
        lead: `
<p>Tailwind CSS là framework CSS utility-first giúp bạn xây dựng giao diện nhanh chóng với các class có sẵn. Với cách tiếp cận độc đáo, Tailwind đã thay đổi cách chúng ta viết CSS.</p>

<h2>Tailwind CSS là gì?</h2>
<p>Tailwind CSS là một framework CSS utility-first được phát triển bởi Adam Wathan. Thay vì viết CSS tùy chỉnh, bạn sử dụng các class utility có sẵn để xây dựng giao diện.</p>

<h3>Đặc điểm nổi bật:</h3>
<ul>
<li><strong>Utility-first:</strong> Sử dụng các class nhỏ, có thể kết hợp</li>
<li><strong>Responsive by default:</strong> Hỗ trợ responsive design dễ dàng</li>
<li><strong>Highly customizable:</strong> Có thể tùy chỉnh theme, colors, spacing</li>
<li><strong>PurgeCSS integration:</strong> Tự động loại bỏ CSS không sử dụng</li>
</ul>

<h2>Cài đặt và cấu hình</h2>
<p>Bắt đầu với Tailwind CSS:</p>

<h3>1. Cài đặt qua npm</h3>
<pre><code>npm install -D tailwindcss
npx tailwindcss init</code></pre>

<h3>2. Cấu hình tailwind.config.js</h3>
<pre><code>module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        }
      }
    },
  },
  plugins: [],
}</code></pre>

<h2>Utility Classes cơ bản</h2>

<h3>Spacing (Margin & Padding)</h3>
<pre><code>&lt;div class="m-4 p-6"&gt;Margin 1rem, Padding 1.5rem&lt;/div&gt;
&lt;div class="mx-auto my-8"&gt;Horizontal auto, Vertical 2rem&lt;/div&gt;
&lt;div class="pt-4 pb-2 px-3"&gt;Top 1rem, Bottom 0.5rem, Horizontal 0.75rem&lt;/div&gt;</code></pre>

<h3>Typography</h3>
<pre><code>&lt;h1 class="text-4xl font-bold text-gray-900"&gt;Heading lớn&lt;/h1&gt;
&lt;p class="text-lg text-gray-600 leading-relaxed"&gt;Paragraph với line-height&lt;/p&gt;
&lt;span class="text-sm text-gray-500 italic"&gt;Text nhỏ, nghiêng&lt;/span&gt;</code></pre>

<h3>Layout</h3>
<pre><code>&lt;div class="flex items-center justify-between"&gt;
  &lt;div&gt;Item 1&lt;/div&gt;
  &lt;div&gt;Item 2&lt;/div&gt;
&lt;/div&gt;

&lt;div class="grid grid-cols-3 gap-4"&gt;
  &lt;div&gt;Column 1&lt;/div&gt;
  &lt;div&gt;Column 2&lt;/div&gt;
  &lt;div&gt;Column 3&lt;/div&gt;
&lt;/div&gt;</code></pre>

<h2>Responsive Design</h2>
<p>Tailwind sử dụng mobile-first approach:</p>

<pre><code>&lt;div class="w-full md:w-1/2 lg:w-1/3"&gt;
  &lt;!-- Full width trên mobile, 1/2 trên tablet, 1/3 trên desktop --&gt;
&lt;/div&gt;

&lt;div class="text-sm md:text-base lg:text-lg"&gt;
  &lt;!-- Text size tăng dần theo breakpoint --&gt;
&lt;/div&gt;</code></pre>

<h2>Component Patterns</h2>

<h3>Card Component</h3>
<pre><code>&lt;div class="max-w-sm rounded-lg overflow-hidden shadow-lg bg-white"&gt;
  &lt;img class="w-full h-48 object-cover" src="image.jpg" alt="Card image"&gt;
  &lt;div class="px-6 py-4"&gt;
    &lt;div class="font-bold text-xl mb-2"&gt;Card Title&lt;/div&gt;
    &lt;p class="text-gray-700 text-base"&gt;
      Card description goes here...
    &lt;/p&gt;
  &lt;/div&gt;
&lt;/div&gt;</code></pre>

<h3>Button Component</h3>
<pre><code>&lt;button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"&gt;
  Primary Button
&lt;/button&gt;</code></pre>

<h2>Custom Components với @apply</h2>
<p>Sử dụng @apply để tạo custom components:</p>

<pre><code>/* Trong file CSS */
.btn-primary {
  @apply bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200;
}

.card {
  @apply max-w-sm rounded-lg overflow-hidden shadow-lg bg-white;
}</code></pre>

<h2>Dark Mode</h2>
<p>Tailwind hỗ trợ dark mode:</p>

<pre><code>&lt;div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"&gt;
  &lt;h1 class="text-2xl font-bold"&gt;Title&lt;/h1&gt;
  &lt;p class="text-gray-600 dark:text-gray-300"&gt;Content&lt;/p&gt;
&lt;/div&gt;</code></pre>

<h2>Best Practices</h2>

<h3>1. Component Extraction</h3>
<p>Tạo reusable components thay vì lặp lại classes:</p>
<pre><code>function Button({ children, variant = 'primary', ...props }) {
  const baseClasses = 'font-bold py-2 px-4 rounded transition-colors duration-200';
  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-300 hover:bg-gray-400 text-gray-800'
  };
  
  return (
    &lt;button className={\`\${baseClasses} \${variants[variant]}\`} {...props}&gt;
      {children}
    &lt;/button&gt;
  );
}</code></pre>

<h2>Kết luận</h2>
<p>Tailwind CSS đã thay đổi cách chúng ta viết CSS. Với utility-first approach, responsive design dễ dàng, và khả năng tùy chỉnh cao, Tailwind là lựa chọn hàng đầu cho các dự án web hiện đại.</p>
        `,
        excerpt:
          "Tailwind CSS là framework CSS utility-first giúp bạn xây dựng giao diện nhanh chóng với các class có sẵn. Với cách tiếp cận độc đáo, Tailwind đã thay đổi cách chúng ta viết CSS.",
      },
    });

    // 4. Cập nhật bài viết TypeScript
    await prisma.post.update({
      where: { slug: "typescript-la-gi" },
      data: {
        lead: `
<p>TypeScript (TS) không phải là "một ngôn ngữ mới lạ" bên cạnh JavaScript (JS) — nó là một siêu ngôn ngữ (superset) của JavaScript, bổ sung hệ thống kiểu dữ liệu tĩnh vào JavaScript động.</p>

<h2>TypeScript là gì?</h2>
<p>TypeScript là một ngôn ngữ lập trình được phát triển bởi Microsoft, mở rộng JavaScript bằng cách thêm static typing. TypeScript được biên dịch thành JavaScript thuần túy, có thể chạy trên bất kỳ môi trường nào hỗ trợ JavaScript.</p>

<h3>Đặc điểm chính:</h3>
<ul>
<li><strong>Static Typing:</strong> Kiểm tra kiểu dữ liệu tại thời điểm biên dịch</li>
<li><strong>Object-Oriented:</strong> Hỗ trợ classes, interfaces, inheritance</li>
<li><strong>ES6+ Features:</strong> Hỗ trợ đầy đủ các tính năng ES6+</li>
<li><strong>Tooling Support:</strong> IDE support mạnh mẽ với IntelliSense</li>
</ul>

<h2>Tại sao sử dụng TypeScript?</h2>

<h3>1. Phát hiện lỗi sớm</h3>
<p>TypeScript giúp phát hiện lỗi ngay trong quá trình phát triển:</p>
<pre><code>// JavaScript - Lỗi chỉ phát hiện khi runtime
function add(a, b) {
  return a + b;
}
add("5", 3); // Kết quả: "53" (string concatenation)

// TypeScript - Lỗi phát hiện khi compile
function add(a: number, b: number): number {
  return a + b;
}
add("5", 3); // Error: Argument of type 'string' is not assignable to parameter of type 'number'</code></pre>

<h3>2. Code Documentation</h3>
<p>Type annotations làm code dễ đọc và hiểu hơn:</p>
<pre><code>interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

function createUser(userData: User): User {
  return {
    id: Date.now(),
    name: userData.name,
    email: userData.email,
    isActive: true
  };
}</code></pre>

<h2>Basic Types</h2>

<h3>Primitive Types</h3>
<pre><code>let name: string = "John";
let age: number = 25;
let isStudent: boolean = true;
let hobbies: string[] = ["reading", "coding"];
let scores: number[] = [85, 90, 78];

// Union Types
let status: "active" | "inactive" = "active";
let id: string | number = "user123";</code></pre>

<h3>Object Types</h3>
<pre><code>interface Person {
  name: string;
  age: number;
  email?: string; // Optional property
  readonly id: number; // Read-only property
}

const person: Person = {
  name: "Alice",
  age: 30,
  id: 12345
};</code></pre>

<h2>Advanced Types</h2>

<h3>1. Generics</h3>
<pre><code>// Generic function
function identity&lt;T&gt;(arg: T): T {
  return arg;
}

// Generic interface
interface ApiResponse&lt;T&gt; {
  data: T;
  status: number;
  message: string;
}

// Generic class
class Stack&lt;T&gt; {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }
}</code></pre>

<h3>2. Union and Intersection Types</h3>
<pre><code>// Union Types
type StringOrNumber = string | number;

function processValue(value: StringOrNumber): string {
  if (typeof value === "string") {
    return value.toUpperCase();
  } else {
    return value.toString();
  }
}

// Intersection Types
interface HasName {
  name: string;
}

interface HasAge {
  age: number;
}

type Person = HasName & HasAge;</code></pre>

<h2>Classes và Interfaces</h2>

<h3>Classes</h3>
<pre><code>interface Vehicle {
  brand: string;
  model: string;
  year: number;
}

class Car implements Vehicle {
  constructor(
    public brand: string,
    public model: string,
    public year: number,
    private engineType: string
  ) {}

  getInfo(): string {
    return \`\${this.brand} \${this.model} (\${this.year})\`;
  }

  startEngine(): void {
    console.log(\`Starting \${this.engineType} engine...\`);
  }
}</code></pre>

<h2>TypeScript với React</h2>

<pre><code>import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

interface UserListProps {
  users: User[];
  onUserSelect: (user: User) => void;
  isLoading?: boolean;
}

const UserList: React.FC&lt;UserListProps&gt; = ({ 
  users, 
  onUserSelect, 
  isLoading = false 
}) => {
  const [selectedUserId, setSelectedUserId] = useState&lt;number | null&gt;(null);

  useEffect(() => {
    if (users.length > 0 && !selectedUserId) {
      setSelectedUserId(users[0].id);
    }
  }, [users, selectedUserId]);

  if (isLoading) {
    return &lt;div&gt;Loading users...&lt;/div&gt;;
  }

  return (
    &lt;div&gt;
      {users.map((user) => (
        &lt;div
          key={user.id}
          onClick={() => {
            setSelectedUserId(user.id);
            onUserSelect(user);
          }}
          className={selectedUserId === user.id ? 'selected' : ''}
        &gt;
          {user.name} ({user.email})
        &lt;/div&gt;
      ))}
    &lt;/div&gt;
  );
};</code></pre>

<h2>Best Practices</h2>

<h3>1. Strict Mode</h3>
<p>Luôn sử dụng strict mode trong tsconfig.json:</p>
<pre><code>{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}</code></pre>

<h3>2. Explicit Return Types</h3>
<pre><code>// Good
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}</code></pre>

<h3>3. Use Interfaces for Object Shapes</h3>
<pre><code>// Good
interface User {
  id: number;
  name: string;
  email: string;
}</code></pre>

<h2>Kết luận</h2>
<p>TypeScript đã trở thành lựa chọn hàng đầu cho các dự án JavaScript lớn. Với static typing, tooling support mạnh mẽ, và khả năng tương thích hoàn toàn với JavaScript, TypeScript giúp tạo ra code an toàn hơn, dễ bảo trì hơn.</p>
        `,
        excerpt:
          'TypeScript (TS) không phải là "một ngôn ngữ mới lạ" bên cạnh JavaScript (JS) — nó là một siêu ngôn ngữ (superset) của JavaScript, bổ sung hệ thống kiểu dữ liệu tĩnh vào JavaScript động.',
      },
    });

    console.log("✅ Đã cập nhật thành công nội dung cho tất cả bài viết!");
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật bài viết:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePosts();
