import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import fs from 'fs'
import type { Request } from 'express';
import { createRequire } from 'module';
import { createServer } from 'http';
import { Server } from 'socket.io';
const require = createRequire(import.meta.url);
const multer = require('multer');

// Type definitions
interface JwtPayload {
    id: number;
    email: string;
    role: string;
}

// Khóa bí mật từ biến môi trường
const jwtSecret = process.env.ACCESS_TOKEN_SECRET!;
const jwtRefreshSecret = process.env.REFRESH_TOKEN_SECRET!;

// Cấu hình file tĩnh
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cấu hình dotenv
dotenv.config();

// Khởi tạo Prisma và Express
const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

// Khởi tạo HTTP server và Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Serve files from uploads directory
// Serve files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Serve fix-chat-errors.js
app.get('/fix-chat-errors.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'fix-chat-errors.js'));
});
console.log('Static files served from:', path.join(__dirname, 'public', 'uploads'));

// Đảm bảo thư mục upload tồn tại
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer để upload ảnh
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || '');
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, unique);
    }
});
const upload = multer({ storage });

// Cấu hình view engine
app.set('views', './views');
app.set('view engine', 'ejs');

// Hàm tạo token
const generateAccessToken = (payload: { id: number; email: string }) => {
    return jwt.sign(payload, jwtSecret, {
        algorithm: 'HS256',
        expiresIn: '1d',
    });
};

const generateRefreshToken = (payload: { id: number; email: string }) => {
    return jwt.sign(payload, jwtRefreshSecret, {
        algorithm: 'HS256',
        expiresIn: '7d',
    });
};

// Middleware xác thực JWT
const authenticateJWT = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization || req.cookies.accessToken;
    if (!authHeader) {
        return res.redirect('/login'); // Chuyển hướng về login nếu không có token
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    jwt.verify(token, jwtSecret, (err: any, payload: any) => {
        if (err) {
            return res.redirect('/login'); // Chuyển hướng về login nếu token không hợp lệ
        }
        req.payload = payload;
        next();
    });
};

// Middaleware kiểm tra quyền admin 
const requireAdmin = async (req, res, next) => {
    const userId = req.payload?.id;
    if (!userId) return res.redirect('/login');
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, avatar: true }
    });
    if (!user || user.role !== 'ADMIN') {
        return res.status(403).send('Không có quyền truy cập admin')
    }
    next();
}

interface AuthenticatedRequest extends Request {
    payload?: { id: number; email: string };
    // Dùng any để tránh lỗi type với multer namespace khác phiên bản
    file?: any;
    files?: any;
}

// Tạo các bài viết mặc định khi server khởi động
(async () => {
    try {
        // Tạo post "home"
        const homeExist = await prisma.post.findUnique({ where: { slug: 'home' } });
        if (!homeExist) {
            await prisma.post.create({
                data: {
                    title: 'Trang chủ',
                    slug: 'home',
                    status: 'ACTIVE'
                }
            });
            console.log('Đã tạo post home trong database');
        }

        // Tạo bài viết TypeScript có sẵn
        const typescriptExist = await prisma.post.findUnique({ where: { slug: 'typescript-la-gi' } });
        if (!typescriptExist) {
            await prisma.post.create({
                data: {
                    title: 'Typescript là gì? Vì sao TypeScript là lựa chọn hàng đầu cho Dự án lớn',
                    slug: 'typescript-la-gi',
                    authorName: 'StudyBlog',
                    authorUrl: 'mailto:admin@studyblog.com',
                    excerpt: 'TypeScript (TS) không phải là "một ngôn ngữ mới lạ" bên cạnh JavaScript (JS) — nó là một siêu ngôn ngữ của JS: thêm hệ thống kiểu tĩnh, công cụ phân tích mã, và trải nghiệm IDE tốt hơn.',
                    lead: `<p class="lead">
                    TypeScript (TS) không phải là "một ngôn ngữ mới lạ" bên cạnh JavaScript (JS) — nó là một siêu
                    ngôn ngữ của JS: thêm hệ thống kiểu tĩnh, công cụ phân tích mã, và trải nghiệm IDE tốt hơn, rồi
                    biên dịch (transpile) về JS chạy ở mọi nơi JS chạy được.
                </p>
                <p>TypeScript ra đời để giải quyết vấn đề gì?</p>
                <p>
                    JavaScript tuyệt vời cho MVP và kịch bản ngắn. Nhưng khi ứng dụng phình to (nhiều module, nhiều
                    dev, vòng đời dài), JS thuần dễ sinh lỗi do:
                </p>
                <p>
                <ol>
                    <li>Không có kiểm tra kiểu tĩnh → bug chỉ lộ ở runtime.</li>
                    <li>Refactor rủi ro (đổi tên, đổi chữ ký hàm, tái cấu trúc) → thiếu "lan tỏa an toàn".</li>
                    <li>Thiếu "hợp đồng" giữa module/team → hiểu nhầm kiểu dữ liệu, API.</li>
                </ol>
                </p>
                <p> TypeScript xuất hiện (Microsoft, do Anders Hejlsberg dẫn dắt) để: <br>
                <ol>
                    <li>Thêm an toàn kiểu tĩnh nhưng vẫn giữ tính linh hoạt của JS.</li>
                    <li>Tận dụng hệ sinh thái JS nguyên vẹn (npm, Node, trình duyệt).</li>
                    <li>Nâng DPI cho IDE (tự hoàn thành, nhảy định nghĩa, rename symbol, quick-fix…).</li>
                </ol>
                </p>
                <h2>Điểm mạnh của TypeScript</h2>
                <p><strong>I. An toàn kiểu & tự tin khi refactor</strong>
                <ol>
                    <li>Kiểu tĩnh bắt lỗi sớm, refactor an toàn hơn.</li>
                    <li>Discriminated union + control-flow narrowing cho logic nhánh cực rõ.</li>
                </ol>
                </p>
                <h2>Điểm yếu / hạn chế</h2>
                <p class="lead">1. Cần bước biên dịch <br>
                    Thêm độ trễ build, cấu hình (tsconfig, bundler) và xử lý lỗi type.</p>
                <p class="lead">2. Kiểu bị xóa ở runtime <br>
                    TS không kiểm tra kiểu lúc chạy. Nếu dữ liệu từ API "bẩn", bạn cần validation runtime
                    (Zod/Valibot/io-ts…).</p>
                <h2>Ứng dụng thực tế</h2>
                <h3>Frontend</h3>
                <p>
                <ol>
                    <li><strong>React + TypeScript</strong>(Next.js, Vite): mặc định hiện đại, DX tốt.</li>
                    <li><strong>Angular</strong>: TypeScript là "công dân hạng nhất".</li>
                    <li><strong>Vue 3</strong>: hỗ trợ TS tốt với Volar, defineComponent </li>
                    <li><strong>Svelte/SvelteKit</strong>: bật TS dễ dàng.</li>
                </ol>
                </p>`,
                    publishedAt: new Date('2025-01-15'),
                    status: 'ACTIVE'
                }
            });
            console.log('Đã tạo bài viết TypeScript trong database');
        }

        // Tạo thêm một số bài viết mẫu
        const samplePosts = [
            {
                title: 'Node.js & Express: Xây Dựng Backend Linh Hoạt Và Hiệu Quả',
                slug: 'nodejs-express-backend',
                excerpt: 'Node.js là môi trường chạy JavaScript phía server, cho phép xây dựng ứng dụng nhanh và hiệu quả. Express là framework tối giản giúp tạo API.',
                content: `<p class="lead">Node.js là môi trường chạy JavaScript phía server, cho phép xây dựng ứng dụng nhanh và hiệu quả. Express là framework tối giản giúp tạo API, quản lý routing và middleware một cách rõ ràng, gọn nhẹ.</p>
            <h2>Ưu điểm của Node.js</h2>
            <p>Node.js có nhiều ưu điểm vượt trội:</p>
            <ul>
                <li>Non-blocking I/O: Xử lý nhiều request đồng thời</li>
                <li>Event-driven: Hiệu suất cao với ít tài nguyên</li>
                <li>NPM ecosystem: Thư viện phong phú</li>
                <li>JavaScript everywhere: Cùng ngôn ngữ frontend và backend</li>
            </ul>`
            },
            {
                title: 'ReactJS: Từ Cơ Bản Đến Nâng Cao',
                slug: 'reactjs-tu-co-ban-den-nang-cao',
                excerpt: 'React là thư viện JavaScript phổ biến nhất để xây dựng giao diện người dùng. Học React từ cơ bản đến nâng cao.',
                content: `<p class="lead">React là thư viện JavaScript phổ biến nhất để xây dựng giao diện người dùng. Được phát triển bởi Facebook, React đã trở thành tiêu chuẩn trong phát triển frontend.</p>
            <h2>Core Concepts</h2>
            <p>React dựa trên các khái niệm cốt lõi:</p>
            <ul>
                <li>Components: Tái sử dụng và modular</li>
                <li>Props: Truyền dữ liệu từ parent xuống child</li>
                <li>State: Quản lý trạng thái component</li>
                <li>Virtual DOM: Tối ưu hiệu suất render</li>
            </ul>`
            },
            {
                title: 'TailwindCSS: Thiết Kế Giao Diện Nhanh, Gọn, Đẹp',
                slug: 'tailwindcss-thiet-ke-giao-dien',
                excerpt: 'Tailwind CSS là framework CSS utility-first giúp bạn xây dựng giao diện nhanh chóng với các class có sẵn.',
                content: `<p class="lead">Tailwind CSS là framework CSS utility-first giúp bạn xây dựng giao diện nhanh chóng với các class có sẵn. Thay vì viết CSS tùy chỉnh, bạn sử dụng các utility class.</p>
            <h2>Ưu điểm của Tailwind</h2>
            <p>Tailwind CSS mang lại nhiều lợi ích:</p>
            <ul>
                <li>Rapid development: Phát triển nhanh với utility classes</li>
                <li>Consistent design: Thiết kế nhất quán</li>
                <li>Responsive: Tích hợp responsive design</li>
                <li>Customizable: Dễ dàng tùy chỉnh theme</li>
            </ul>`
            }
        ];

        for (const postData of samplePosts) {
            const exist = await prisma.post.findUnique({ where: { slug: postData.slug } });
            if (!exist) {
                await prisma.post.create({
                    data: {
                        title: postData.title,
                        slug: postData.slug,
                        authorName: 'StudyBlog',
                        authorUrl: 'mailto:admin@studyblog.com',
                        excerpt: postData.excerpt,
                        lead: postData.content,
                        publishedAt: new Date('2025-01-15'),
                        status: 'ACTIVE'
                    }
                });
                console.log(`Đã tạo bài viết: ${postData.title}`);
            }
        }
    } catch (error) {
        console.error('Lỗi khởi tạo dữ liệu mặc định:', error);
    }
})();

// Route: Trang chủ (public - không cần đăng nhập)
app.get('/', async (req, res) => {
    try {
        // Lấy thông tin user nếu đã đăng nhập
        let user: any = null;
        const token = req.cookies.accessToken;

        if (token) {
            try {
                const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
                console.log('=== TOKEN DEBUG ===');
                console.log('Token decoded:', decoded);
                console.log('User ID from token:', decoded.id);

                user = await prisma.user.findUnique({
                    where: { id: decoded.id },
                    select: { id: true, name: true, email: true, avatar: true, role: true }
                });
                console.log('=== USER DEBUG ===');
                console.log('User found:', user);
                console.log('User avatar:', user?.avatar);
                console.log('User avatar type:', typeof user?.avatar);
            } catch (error) {
                // Token không hợp lệ, bỏ qua
                console.log('Token verification failed:', error);
            }
        } else {
            console.log('=== NO TOKEN DEBUG ===');
            console.log('No accessToken found in cookies');
        }

        // Lấy bài viết "home"
        const post = await prisma.post.findUnique({ where: { slug: 'home' } });
        if (!post) return res.status(404).send('Không tìm thấy bài viết home');

        // Lấy comments cho trang home
        const comments = await prisma.comment.findMany({
            where: { postId: post.id, isDeleted: false, parentId: null },
            include: {
                author: true,
                children: {
                    where: { isDeleted: false },
                    include: { author: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Lấy các bài viết khác để hiển thị trong sidebar và related articles
        const otherPosts = await prisma.post.findMany({
            where: {
                status: 'ACTIVE',
                slug: { not: 'home' } // Loại trừ bài viết home
            },
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                authorName: true,
                publishedAt: true,
                heroImage: true
            },
            orderBy: { publishedAt: 'desc' },
            take: 6 // Lấy 6 bài viết mới nhất
        });

        // Format dữ liệu cho template
        const formattedPosts = otherPosts.map(post => ({
            ...post,
            url: `/posts/${post.slug}`,
            prettyDate: post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : '',
            excerpt: post.excerpt || post.title.substring(0, 100) + '...',
            // Ước tính thời gian đọc (1 phút cho mỗi 200 từ)
            readTime: Math.max(1, Math.ceil((post.title.length + (post.excerpt?.length || 0)) / 200))
        }));

        console.log('=== RENDER DEBUG ===');
        console.log('Final user object:', user);
        console.log('User avatar in render:', user?.avatar);
        res.render('home', { comments, user, post, otherPosts: formattedPosts });
    } catch (error) {
        console.error('Lỗi load trang chủ:', error);
        res.status(500).send('Lỗi server');
    }
});

// Route: Trang chủ (bảo vệ - cần đăng nhập)
app.get('/home', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    const post = await prisma.post.findUnique({ where: { slug: 'home' } });
    if (!post) return res.status(404).send('Không tìm thấy bài viết home');
    const comments = await prisma.comment.findMany({
        where: { postId: post.id, isDeleted: false, parentId: null },
        include: {
            author: true,
            children: {
                where: { isDeleted: false },
                include: { author: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Lấy các bài viết khác để hiển thị trong sidebar và related articles
    const otherPosts = await prisma.post.findMany({
        where: {
            status: 'ACTIVE',
            slug: { not: 'home' } // Loại trừ bài viết home
        },
        select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            authorName: true,
            publishedAt: true,
            heroImage: true
        },
        orderBy: { publishedAt: 'desc' },
        take: 6 // Lấy 6 bài viết mới nhất
    });

    console.log('Các bài viết trong trang home:', otherPosts.map(p => ({ id: p.id, title: p.title, slug: p.slug, status: 'ACTIVE' })));

    // Format dữ liệu cho template
    const formattedPosts = otherPosts.map(post => ({
        ...post,
        url: `/posts/${post.slug}`,
        prettyDate: post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : '',
        excerpt: post.excerpt || post.title.substring(0, 100) + '...',
        // Ước tính thời gian đọc (1 phút cho mỗi 200 từ)
        readTime: Math.max(1, Math.ceil((post.title.length + (post.excerpt?.length || 0)) / 200))
    }));

    console.log('Formatted posts for home:', formattedPosts.map(p => ({ title: p.title, url: p.url, prettyDate: p.prettyDate })));

    // Lấy user từ DB để có đủ role
    let user: any = null;
    if (req.payload?.id) {
        user = await prisma.user.findUnique({
            where: { id: req.payload.id },
            select: { id: true, email: true, name: true, role: true, avatar: true }
        });
    }

    console.log('Rendering home page with posts:', formattedPosts.length);
    res.render('home', { comments, user, post, otherPosts: formattedPosts });
});

// Route xử lý comment cho trang home
app.post('/home/comment', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    const { comment, parentId } = req.body;
    const userId = req.payload?.id;
    const post = await prisma.post.findUnique({
        where: { slug: 'home' }
    });
    if (!comment || !userId || !post) return res.redirect('/home');

    await prisma.comment.create({
        data: {
            postId: post.id,
            authorId: userId,
            content: comment,
            parentId: parentId ? Number(parentId) : null
        }
    });
    res.redirect('/home'); // Sau khi gửi, sẽ render lại trang home với comment mới
});

// delete comment user 
app.post('/home/comment/:id/delete', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    const commentId = Number(req.params.id);
    const userId = req.payload?.id;
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, avatar: true }
    });

    // Tìm comment cần xoá
    const comment = await prisma.comment.findUnique({
        where: { id: commentId },
    });
    if (!comment) return res.redirect('/home');

    // Chỉ cho phép xoá nếu là chủ comment hoặc admin
    if (comment.authorId !== userId && user?.role !== 'ADMIN') {
        return res.status(403).send('Bạn không có quyền xoá bình luận này');
    }

    // Xoá mềm: cập nhật isDeleted = true
    await prisma.comment.update({
        where: { id: commentId },
        data: { isDeleted: true }
    });

    // Nếu là comment cha, cũng xoá mềm các reply con
    if (!comment.parentId) {
        await prisma.comment.updateMany({ where: { parentId: commentId }, data: { isDeleted: true } });
    }

    res.redirect('/home')
});

// update comment by user
app.post('/home/comment/:id/edit', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    const commentId = Number(req.params.id);
    const userId = req.payload?.id;
    const { content } = req.body;
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, avatar: true }
    });

    // Tìm comment và kiểm tra quyền ?
    const comment = await prisma.comment.findUnique({
        where: { id: commentId }
    });

    if (!comment || comment.authorId !== userId && user?.role !== 'ADMIN') {
        return res.status(403).send('Bạn không có quyền chỉnh sửa bình luận này');
    }

    // cập nhật nội dung và lịch sử chỉnh sửa
    await prisma.comment.update({
        where: { id: commentId },
        data: {
            content,
            editedAt: new Date(),
            lastEditedById: userId
        }
    });

    res.redirect('/home');
})

// Route: Trang gốc
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Route: Trang đăng nhập
app.get('/login', (req, res) => {
    res.render('login');
});

// Route: Xử lý đăng nhập
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!email || !password) {
        return res.status(400).render('login', { error: 'Email và mật khẩu là bắt buộc' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).render('login', { error: 'Email hoặc mật khẩu sai' });
        }

        const payload = { id: user.id, email: user.email };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        // Gửi accessToken trong cookie (không HttpOnly để client có thể truy cập)
        res.cookie('accessToken', accessToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000, // 24 giờ (để test)
        });

        // Gửi refreshToken trong cookie HttpOnly
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
        });

        // Chuyển hướng đến /home sau khi đăng nhập thành công
        res.redirect('/home');
    } catch (error) {
        console.error(error);
        res.status(500).render('login', { error: 'Lỗi server khi đăng nhập' });
    }
});

// Route: Test avatar - debug route
app.get('/test-avatar', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, avatar: true }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Route: Test cookies - debug route
app.get('/test-cookies', (req, res) => {
    const token = req.cookies.accessToken;
    res.json({
        hasToken: !!token,
        token: token ? 'Token exists' : 'No token',
        allCookies: req.cookies
    });
});

// Route: Đăng xuất
app.get('/logout', (req, res) => {
    // Xóa cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.redirect('/login');
});

// Route: Upload avatar
app.post('/api/upload-avatar', authenticateJWT, upload.single('avatar'), async (req: AuthenticatedRequest, res) => {
    try {
        console.log('=== UPLOAD AVATAR DEBUG ===');
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);
        console.log('User ID:', req.payload!.id);

        if (!req.file) {
            console.log('No file uploaded');
            return res.status(400).json({ error: 'Không có file ảnh được tải lên' });
        }

        console.log('File uploaded successfully:', req.file.filename);
        const avatarUrl = `/uploads/${req.file.filename}`;
        console.log('Avatar URL:', avatarUrl);

        // Cập nhật avatar trong database
        const updatedUser = await prisma.user.update({
            where: { id: req.payload!.id },
            data: { avatar: avatarUrl }
        });

        console.log('Database updated:', updatedUser);

        res.json({ avatar: avatarUrl });
    } catch (error) {
        console.error('Lỗi upload avatar:', error);
        res.status(500).json({ error: 'Không thể tải avatar lên' });
    }
});

// Route: Làm mới token
app.post('/refresh-token', (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Không có refresh token' });
    }

    jwt.verify(refreshToken, jwtRefreshSecret, (err: any, payload: any) => {
        if (err) {
            return res.status(403).json({ message: 'Refresh token không hợp lệ' });
        }

        const newPayload = { id: payload.id, email: payload.email };
        const newAccessToken = generateAccessToken(newPayload);

        // Gửi accessToken mới trong cookie
        res.cookie('accessToken', newAccessToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 15 * 60 * 1000, // 15 phút
        });

        res.json({ message: 'Tạo access token mới thành công' });
    });
});

// Route: Trang đăng ký
app.get('/register', (req, res) => {
    res.render('dangky');
});

// Route: Xử lý đăng ký
app.post('/register', async (req, res) => {
    const { email, name, password, confirmPassword } = req.body;

    if (!email || !name || !password || !confirmPassword) {
        return res.status(400).render('dangky', { error: 'Email, tên, mật khẩu và xác nhận mật khẩu là bắt buộc' });
    }

    if (password !== confirmPassword) {
        return res.status(400).render('dangky', { error: 'Mật khẩu và xác nhận mật khẩu không khớp' });
    }

    if (password.length < 6) {
        return res.status(400).render('dangky', { error: 'Mật khẩu phải ít nhất 6 ký tự' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
            },
        });

        res.redirect('/login'); // Chuyển hướng về login sau khi đăng ký
    } catch (error) {
        console.error(error);
        res.status(400).render('dangky', { error: 'Lỗi đăng ký: Email đã tồn tại hoặc lỗi server' });
    }
});

// Route: Trang quên mật khẩu
app.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});

app.get('/newsTypescript', (req, res) => {
    // Điều hướng về trang bài viết động để dùng hệ thống bình luận Fetch API
    res.redirect('/posts/typescript-la-gi');
})

// Route : Trang admin liệt kê bài viết 
app.get('/admin', authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        // Lấy thông tin user
        const user = await prisma.user.findUnique({
            where: { id: req.payload!.id },
            select: { id: true, email: true, name: true, role: true, avatar: true }
        });

        const posts = await prisma.post.findMany({
            select: { id: true, title: true, slug: true, createdAt: true, status: true, heroImage: true },
            orderBy: { createdAt: 'desc' },
        });

        console.log('Các bài viết trong trang admin:', posts.map(p => ({ id: p.id, title: p.title, slug: p.slug, status: p.status })));

        // Map dữ liệu cho view (giữ key 'url' như cũ để EJS dùng)
        const viewPosts = posts.map(p => ({
            id: p.id,
            title: p.title,
            url: `/posts/${p.slug}`, // Sửa URL để trỏ đến route /posts/:slug
            createdAt: p.createdAt, // Date
            status: p.status,       // 'ACTIVE' | 'INACTIVE'
            imageUrl: p.heroImage || ''
        }));

        // Xử lý thông báo thành công từ query parameter
        const success = req.query.success;

        res.render('admin', { posts: viewPosts, success, user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi khi lấy danh sách bài viết');
    }
});

// Route: Trang admin chat
app.get('/admin/chat', authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        // Lấy thông tin user
        const user = await prisma.user.findUnique({
            where: { id: req.payload!.id },
            select: { id: true, email: true, name: true, role: true, avatar: true }
        });

        res.render('admin-chat', { user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi khi tải trang admin chat');
    }
});

// Route: Trang admin chat fixed (sửa lỗi gửi tin nhắn)
app.get('/admin/chat-fixed', authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        // Lấy thông tin user
        const user = await prisma.user.findUnique({
            where: { id: req.payload!.id },
            select: { id: true, email: true, name: true, role: true, avatar: true }
        });

        res.render('admin-chat-fixed', { user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi khi tải trang admin chat fixed');
    }
});

// API: Lấy thông tin admin
app.get('/api/admin-info', async (req, res) => {
    try {
        // Lấy admin đầu tiên trong database
        const admin = await prisma.user.findFirst({
            where: { role: 'ADMIN' },
            select: { id: true, name: true, email: true, avatar: true }
        });

        if (admin) {
            res.json(admin);
        } else {
            res.status(404).json({ error: 'Không tìm thấy admin' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Route test chat
app.get('/test-chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-chat-final.html'));
});

// Route test chat complete
app.get('/test-chat-complete', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-chat-complete.html'));
});

// Route test chat system
app.get('/test-chat-system', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-chat-system.html'));
});

// Route final chat report
app.get('/final-chat-report', (req, res) => {
    res.sendFile(path.join(__dirname, 'final-chat-report.html'));
});

// Route final system test
app.get('/final-system-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'final-system-test.html'));
});

// Route comprehensive test
app.get('/comprehensive-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'comprehensive-test.html'));
});

// Route final chat test
app.get('/final-chat-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'final-chat-test.html'));
});

// Route test admin message
app.get('/test-admin-message', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-admin-message.html'));
});

// Test chat widget
app.get('/test-chat-widget', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-chat-widget.html'));
});

app.get('/test-chat-debug', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-chat-debug.html'));
});



app.get('/test-chat-simple', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-chat-simple.html'));
});

app.get('/test-chat-fix', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-chat-fix.html'));
});

app.get('/test-chat-debug', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-chat-debug.html'));
});

app.get('/test-admin-send', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-admin-send.html'));
});

app.get('/test-chat-simple', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-chat-simple.html'));
});

// Route thực hiện xoá bài viết
app.post('/admin/posts/:id/delete', authenticateJWT, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).send('ID không hợp lệ');

    try {
        // Kiểm tra tồn tại
        const exist = await prisma.post.findUnique({ where: { id } });
        if (!exist) return res.status(404).send('Không tìm thấy bài viết');

        // Xoá mềm: set INACTIVE + deletedAt
        await prisma.post.update({
            where: { id },
            data: { status: 'INACTIVE', deletedAt: new Date() },
        });

        return res.redirect('/admin');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Không xoá được bài viết');
    }
});

// Route xoá hẳn bài viết (hard delete)
app.post('/admin/posts/:id/hard-delete', authenticateJWT, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).send('ID không hợp lệ');

    try {
        // Kiểm tra tồn tại
        const exist = await prisma.post.findUnique({ where: { id } });
        if (!exist) return res.status(404).send('Không tìm thấy bài viết');

        // Xoá hẳn khỏi database
        await prisma.post.delete({
            where: { id }
        });

        return res.redirect('/admin');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Không xoá được bài viết');
    }
});

// Route xoá hàng loạt bài viết
app.post('/admin/posts/bulk-delete', authenticateJWT, requireAdmin, async (req, res) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).send('Danh sách ID không hợp lệ');
    }

    try {
        // Xoá hẳn tất cả bài viết được chọn
        await prisma.post.deleteMany({
            where: {
                id: {
                    in: ids.map(id => Number(id)).filter(id => Number.isFinite(id))
                }
            }
        });

        return res.redirect('/admin');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Không xoá được bài viết');
    }
});

// Route toggle trạng thái bài viết (ACTIVE <-> INACTIVE)
app.post('/admin/posts/:id/toggle-status', authenticateJWT, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).send('ID không hợp lệ');

    try {
        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) return res.status(404).send('Không tìm thấy bài viết');

        const isActive = post.status === 'ACTIVE';
        await prisma.post.update({
            where: { id },
            data: {
                status: isActive ? 'INACTIVE' : 'ACTIVE',
                deletedAt: isActive ? new Date() : null,
            }
        });

        return res.redirect('/admin');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Không thể cập nhật trạng thái bài viết');
    }
});

// Route chỉnh sửa bài viết (tiêu đề + ảnh)
app.post('/admin/posts/:id/edit', authenticateJWT, requireAdmin, upload.single('image'), async (req: AuthenticatedRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).send('ID không hợp lệ');

    try {
        const { title } = req.body as { title?: string };
        const data: any = {};
        if (title && title.trim().length >= 3) {
            data.title = title.trim();
        }
        if (req.file) {
            data.heroImage = `/uploads/${req.file.filename}`;
        }

        if (Object.keys(data).length === 0) {
            return res.redirect('/admin');
        }

        await prisma.post.update({
            where: { id },
            data
        });

        return res.redirect('/admin');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Không thể chỉnh sửa bài viết');
    }
});

// check create news post

// ---- slug helpers ----
const slugify = (str: string) => {
    return (
        str
            ?.toString()
            .normalize('NFD')                       // tách dấu
            .replace(/[\u0300-\u036f]/g, '')       // bỏ dấu
            .replace(/đ/gi, 'd')                   // đ -> d
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')           // ký tự ngoài a-z0-9 -> -
            .replace(/(^-|-$)/g, '')               // bỏ - ở đầu/cuối
    ) || 'bai-viet';
};

async function makeUniqueSlug(title: string): Promise<string> {
    const base = slugify(title);
    let slug = base;
    let i = 0;

    // thử base, nếu trùng thì thêm -1, -2, ...
    while (true) {
        const exist = await prisma.post.findUnique({ where: { slug } });
        if (!exist) return slug;
        i += 1;
        slug = `${base}-${i}`;
        // fallback an toàn nếu lặp quá nhiều
        if (i > 100) {
            const stamp = Date.now().toString(36).slice(-4);
            return `${base}-${stamp}`;
        }
    }
}


app.get('/admin/posts/new', authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        // Lấy thông tin user
        const user = await prisma.user.findUnique({
            where: { id: req.payload!.id },
            select: { id: true, email: true, name: true, role: true, avatar: true }
        });

        res.render('create-post', {
            error: null,
            user
        });
    } catch (error) {
        console.error('Lỗi load trang create-post:', error);
        res.render('create-post', {
            error: null,
            user: null
        });
    }
});

// Route upload ảnh cho editor
app.post('/admin/upload-image', authenticateJWT, requireAdmin, upload.single('image'), async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Không có file ảnh được tải lên' });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({ url: imageUrl });
    } catch (error) {
        console.error('Lỗi upload ảnh:', error);
        res.status(500).json({ error: 'Không thể tải ảnh lên' });
    }
});

// API lấy thông tin user hiện tại
app.get('/api/current-user', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.payload?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Không tìm thấy thông tin user' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true, avatar: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy user' });
        }

        res.json(user);
    } catch (error) {
        console.error('Lỗi lấy thông tin user:', error);
        res.status(500).json({ error: 'Không thể lấy thông tin user' });
    }
});

// API lấy thông tin user cho chat widget (có thể không cần authentication)
app.get('/api/user-info', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Không có token' });
        }

        const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, name: true, email: true, role: true, avatar: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy user' });
        }

        res.json(user);
    } catch (error) {
        console.error('Lỗi lấy thông tin user:', error);
        res.status(401).json({ error: 'Token không hợp lệ' });
    }
});



// Route tạo bài viết mới
app.post('/admin/posts/new', authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        console.log('=== DEBUG: Tạo bài viết mới ===');
        console.log('Request body:', req.body);
        console.log('Content-Type:', req.headers['content-type']);

        const { title, content } = req.body;
        console.log('Title:', title);
        console.log('Content length:', content ? content.length : 0);

        // Validate dữ liệu đầu vào
        if (!title || title.trim().length < 3) {
            console.log('Lỗi: Tiêu đề không hợp lệ');
            return res.status(400).render('create-post', {
                error: 'Tiêu đề bắt buộc (>= 3 ký tự).'
            });
        }

        if (!content || content.trim().length < 10) {
            console.log('Lỗi: Nội dung không hợp lệ');
            return res.status(400).render('create-post', {
                error: 'Nội dung bắt buộc (>= 10 ký tự).'
            });
        }

        console.log('Validation passed, proceeding to create post...');

        // Lấy thông tin user để làm tác giả
        const user = await prisma.user.findUnique({
            where: { id: req.payload!.id },
            select: { id: true, email: true, name: true, role: true, avatar: true }
        });

        // Tự động tạo slug từ tiêu đề
        const finalSlug = await makeUniqueSlug(title);

        // Tạo bài viết mới
        const postData: any = {
            title: title.trim(),
            slug: finalSlug,
            authorName: user?.name || 'Tác giả',
            authorUrl: `mailto:${user?.email || ''}`,
            lead: content.trim(), // Nội dung HTML với ảnh từ Quill editor
            excerpt: content.replace(/<[^>]*>/g, '').substring(0, 200) + '...', // Tạo excerpt từ nội dung
            publishedAt: new Date(), // Thời gian đăng bài
            status: 'ACTIVE'
        };

        const newPost = await prisma.post.create({
            data: postData
        });

        console.log('Đã tạo bài viết mới:', {
            id: newPost.id,
            title: newPost.title,
            slug: newPost.slug,
            status: newPost.status,
            publishedAt: newPost.publishedAt
        });

        // Redirect về trang admin với thông báo thành công
        res.redirect('/admin?success=published');

    } catch (e: any) {
        console.error('Lỗi tạo bài viết:', e);
        console.error('Stack trace:', e.stack);
        res.status(500).render('create-post', {
            error: 'Không tạo được bài viết. Vui lòng thử lại.'
        });
    }
});

// Route hiển thị danh sách tất cả bài viết công khai
app.get('/posts', async (req, res) => {
    try {
        const posts = await prisma.post.findMany({
            where: { status: 'ACTIVE' },
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                authorName: true,
                publishedAt: true,
                createdAt: true
            },
            orderBy: { publishedAt: 'desc' },
        });

        console.log('Các bài viết trong trang posts:', posts.map(p => ({ id: p.id, title: p.title, slug: p.slug, status: 'ACTIVE' })));

        // Format dữ liệu cho template
        const formattedPosts = posts.map(post => ({
            ...post,
            url: `/posts/${post.slug}`,
            prettyDate: post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : '',
            excerpt: post.excerpt || post.title.substring(0, 150) + '...'
        }));

        res.render('posts-list', {
            posts: formattedPosts,
            site: { name: 'StudyBlog', homeUrl: '/', logo: '/images/weaverseio_logo.jpg' }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi khi tải danh sách bài viết');
    }
});

// API tạo comment cho bài viết (không reload trang)
app.post('/api/posts/:slug/comments', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    try {
        const { slug } = req.params;
        const { content, parentId } = req.body;
        const userId = req.payload?.id;

        if (!content || !userId) {
            return res.status(400).json({ error: 'Nội dung comment và user ID là bắt buộc' });
        }

        const post = await prisma.post.findUnique({
            where: { slug, status: 'ACTIVE' }
        });

        if (!post) {
            return res.status(404).json({ error: 'Không tìm thấy bài viết' });
        }

        const newComment = await prisma.comment.create({
            data: {
                postId: post.id,
                authorId: userId,
                content: content.trim(),
                parentId: parentId ? Number(parentId) : null
            },
            include: {
                author: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        res.json({
            success: true,
            comment: {
                id: newComment.id,
                content: newComment.content,
                createdAt: newComment.createdAt,
                author: newComment.author,
                parentId: newComment.parentId
            }
        });
    } catch (err) {
        console.error('Lỗi tạo comment:', err);
        res.status(500).json({ error: 'Không thể tạo comment' });
    }
});

// API xóa comment (không reload trang)
app.delete('/api/comments/:id', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    try {
        const commentId = Number(req.params.id);
        const userId = req.payload?.id;

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        });

        if (!comment) {
            return res.status(404).json({ error: 'Không tìm thấy comment' });
        }

        if (comment.authorId !== userId && user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Bạn không có quyền xóa comment này' });
        }

        // Xóa mềm comment
        await prisma.comment.update({
            where: { id: commentId },
            data: { isDeleted: true }
        });

        // Nếu là comment cha, cũng xóa mềm các reply con
        if (!comment.parentId) {
            await prisma.comment.updateMany({
                where: { parentId: commentId },
                data: { isDeleted: true }
            });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Lỗi xóa comment:', err);
        res.status(500).json({ error: 'Không thể xóa comment' });
    }
});

// API lấy comments cho bài viết
app.get('/api/posts/:slug/comments', async (req, res) => {
    try {
        const { slug } = req.params;
        const post = await prisma.post.findUnique({
            where: { slug, status: 'ACTIVE' }
        });

        if (!post) {
            return res.status(404).json({ error: 'Không tìm thấy bài viết' });
        }

        const comments = await prisma.comment.findMany({
            where: { postId: post.id, isDeleted: false, parentId: null },
            include: {
                author: {
                    select: { id: true, name: true, email: true }
                },
                children: {
                    where: { isDeleted: false },
                    include: {
                        author: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ comments });
    } catch (err) {
        console.error('Lỗi lấy comments:', err);
        res.status(500).json({ error: 'Không thể lấy comments' });
    }
});

// API cập nhật comment (không reload trang)
app.put('/api/comments/:id', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    try {
        const commentId = Number(req.params.id);
        const userId = req.payload?.id;
        const { content } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        });

        if (!comment) {
            return res.status(404).json({ error: 'Không tìm thấy comment' });
        }

        if (comment.authorId !== userId && user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa comment này' });
        }

        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: {
                content: content.trim(),
                editedAt: new Date(),
                lastEditedById: userId
            },
            include: {
                author: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        res.json({
            success: true,
            comment: {
                id: updatedComment.id,
                content: updatedComment.content,
                editedAt: updatedComment.editedAt,
                author: updatedComment.author
            }
        });
    } catch (err) {
        console.error('Lỗi cập nhật comment:', err);
        res.status(500).json({ error: 'Không thể cập nhật comment' });
    }
});

// Route xem bài viết theo slug
app.get('/posts/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const post = await prisma.post.findUnique({
            where: { slug, status: 'ACTIVE' }
        });

        console.log('Tìm bài viết với slug:', slug, 'Kết quả:', post ? { id: post.id, title: post.title, status: post.status } : 'Không tìm thấy');

        if (!post) {
            return res.status(404).send('Không tìm thấy bài viết');
        }

        // Lấy comments cho bài viết này
        const comments = await prisma.comment.findMany({
            where: { postId: post.id, isDeleted: false, parentId: null },
            include: {
                author: true,
                children: {
                    where: { isDeleted: false },
                    include: { author: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Lấy các bài viết khác để hiển thị trong sidebar và related articles
        const otherPosts = await prisma.post.findMany({
            where: {
                status: 'ACTIVE',
                slug: { not: slug } // Loại trừ bài viết hiện tại
            },
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                authorName: true,
                publishedAt: true,
                heroImage: true
            },
            orderBy: { publishedAt: 'desc' },
            take: 6 // Lấy 6 bài viết mới nhất
        });

        // Format dữ liệu cho template
        const formattedPosts = otherPosts.map(post => ({
            ...post,
            url: `/posts/${post.slug}`,
            prettyDate: post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : '',
            excerpt: post.excerpt || post.title.substring(0, 100) + '...',
            // Ước tính thời gian đọc (1 phút cho mỗi 200 từ)
            readTime: Math.max(1, Math.ceil((post.title.length + (post.excerpt?.length || 0)) / 200))
        }));

        // Lấy user nếu đã đăng nhập
        let user: any = null;
        const authHeader = req.headers.authorization || req.cookies.accessToken;
        if (authHeader) {
            const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
            try {
                const payload = jwt.verify(token, jwtSecret) as any;
                user = await prisma.user.findUnique({
                    where: { id: payload.id },
                    select: { id: true, email: true, name: true, role: true, avatar: true }
                });
            } catch (e) {
                // Token không hợp lệ, bỏ qua
            }
        }

        // Format dữ liệu cho template
        const postAny = post as any;
        const formattedPost = {
            ...post,
            prettyDate: postAny.publishedAt ? new Date(postAny.publishedAt).toLocaleDateString('vi-VN') : '',
            publishedAtISO: postAny.publishedAt ? postAny.publishedAt.toISOString() : ''
        };

        res.render('post-view', {
            post: formattedPost,
            comments,
            user,
            sidebarPosts: formattedPosts.slice(0, 3), // 3 bài cho sidebar
            relatedPosts: formattedPosts.slice(0, 4), // 4 bài cho related articles
            site: { name: 'StudyBlog', homeUrl: '/', logo: '/images/weaverseio_logo.jpg' }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi khi tải bài viết');
    }
});

// Database Chat Functions
async function saveChatMessageToDatabase(roomId: string, userId: number, message: string, isAdmin: boolean) {
    try {
        await prisma.chatMessage.create({
            data: {
                roomId,
                userId,
                message,
                isAdmin
            }
        });
        console.log('✅ Chat message saved to database:', { roomId, userId, message, isAdmin });
    } catch (error) {
        console.error('❌ Error saving chat message to database:', error);
    }
}

async function loadChatMessagesFromDatabase(roomId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
        const dbMessages = await prisma.chatMessage.findMany({
            where: { roomId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        // Convert to ChatMessage format
        const messages: ChatMessage[] = dbMessages.reverse().map(msg => ({
            id: `db-${msg.id}`,
            userId: msg.userId || undefined,
            userName: msg.user?.name,
            userAvatar: msg.user?.avatar || undefined,
            message: msg.message,
            timestamp: msg.createdAt,
            isAdmin: msg.isAdmin
        }));

        console.log(`✅ Loaded ${messages.length} messages from database for room: ${roomId}`);
        return messages;
    } catch (error) {
        console.error('❌ Error loading chat messages from database:', error);
        return [];
    }
}

// Socket.IO Chat System
interface ChatMessage {
    id: string;
    userId?: number;
    userName?: string;
    userAvatar?: string;
    message: string;
    timestamp: Date;
    isAdmin: boolean;
    isSystem?: boolean;
}

interface ChatUser {
    id: string;
    userId?: number;
    userName?: string;
    userAvatar?: string;
    isAdmin: boolean;
    socketId: string;
}

// Lưu trữ thông tin chat
const chatUsers = new Map<string, ChatUser>();
const chatMessages = new Map<string, ChatMessage[]>(); // Private chat messages per user
const adminSockets = new Set<string>(); // Admin socket IDs

// Xử lý kết nối Socket.IO
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Xử lý user join chat
    socket.on('join-chat', async (data: { token?: string }) => {
        try {
            let user: any = null;
            let isAdmin = false;

            if (data.token) {
                try {
                    const decoded = jwt.verify(data.token, jwtSecret) as JwtPayload;
                    user = await prisma.user.findUnique({
                        where: { id: decoded.id },
                        select: { id: true, name: true, email: true, avatar: true, role: true }
                    });
                    isAdmin = user?.role === 'ADMIN';
                } catch (error) {
                    console.log('Token verification failed for chat:', error);
                }
            }

            const chatUser: ChatUser = {
                id: socket.id,
                userId: user?.id,
                userName: user?.name || 'Khách',
                userAvatar: user?.avatar,
                isAdmin,
                socketId: socket.id
            };

            chatUsers.set(socket.id, chatUser);

            // Tạo chat room riêng cho user
            const chatRoomId = isAdmin ? 'admin' : `user-${chatUser.userId || socket.id}`;
            console.log('Chat room created:', chatRoomId, 'for user:', chatUser.userName, 'isAdmin:', isAdmin);

            // Khởi tạo chat messages cho user nếu chưa có
            if (!chatMessages.has(chatRoomId)) {
                chatMessages.set(chatRoomId, []);
                console.log('New chat room initialized:', chatRoomId);
            }

            // Join vào room riêng
            socket.join(chatRoomId);

            // Lưu admin socket và join vào tất cả user rooms
            if (isAdmin) {
                adminSockets.add(socket.id);
                console.log('=== ADMIN JOIN DEBUG ===');
                console.log('Admin joined, socket ID:', socket.id);
                console.log('Total admin sockets:', adminSockets.size);
                console.log('Admin sockets:', Array.from(adminSockets));

                // Admin join vào room admin để nhận thông báo
                socket.join('admin');
                console.log('Admin joined room "admin"');
                console.log('=== END ADMIN JOIN DEBUG ===');
            }

            // Gửi thông báo chào mừng chỉ khi user không phải admin và chưa có tin nhắn chào mừng
            if (!isAdmin) {
                const userMessages = chatMessages.get(chatRoomId) || [];
                const hasWelcomeMessage = userMessages.some(msg => msg.isSystem && msg.isAdmin);

                if (!hasWelcomeMessage) {
                    const welcomeMessage: ChatMessage = {
                        id: `welcome-${Date.now()}`,
                        message: `Xin chào ${chatUser.userName}! Tôi có thể giúp bạn như thế nào?`,
                        timestamp: new Date(),
                        isAdmin: true,
                        isSystem: true
                    };

                    // Thêm tin nhắn chào mừng vào chat room
                    userMessages.push(welcomeMessage);
                    chatMessages.set(chatRoomId, userMessages);

                    socket.emit('chat-message', welcomeMessage);
                }
            }

            // Load tin nhắn từ database và gửi lịch sử chat
            const dbMessages = await loadChatMessagesFromDatabase(chatRoomId, 50);
            const userMessages = chatMessages.get(chatRoomId) || [];

            // Merge database messages với memory messages
            const allMessages = [...dbMessages, ...userMessages];
            chatMessages.set(chatRoomId, allMessages);

            socket.emit('chat-history', {
                chatRoomId: chatRoomId,
                messages: allMessages.slice(-50)
            }); // Gửi 50 tin nhắn gần nhất

            // Thông báo user online cho admin
            if (!isAdmin) {
                // Gửi thông báo cho tất cả admin online
                adminSockets.forEach(adminSocketId => {
                    io.to(adminSocketId).emit('user-online', {
                        userId: chatUser.userId,
                        userName: chatUser.userName,
                        userAvatar: chatUser.userAvatar,
                        chatRoomId: chatRoomId
                    });
                });
            }
        } catch (error) {
            console.error('Error joining chat:', error);
        }
    });

    // Xử lý tin nhắn chat
    socket.on('send-message', async (data: { message: string, token?: string, targetUserId?: string }) => {
        try {
            const chatUser = chatUsers.get(socket.id);
            if (!chatUser) return;

            let chatRoomId: string;

            if (chatUser.isAdmin) {
                // Nếu admin gửi tin nhắn, cần targetUserId
                console.log('Admin sending message, data:', data);
                console.log('Admin user:', chatUser);

                if (!data.targetUserId) {
                    console.error('Admin message missing targetUserId');
                    console.error('Data received:', data);
                    return;
                }
                chatRoomId = `user-${data.targetUserId}`;
                console.log('Admin target room:', chatRoomId);

                // Admin join vào room của user để có thể gửi tin nhắn
                socket.join(chatRoomId);
                console.log('Admin joined room:', chatRoomId);

                // Đảm bảo room tồn tại
                if (!chatMessages.has(chatRoomId)) {
                    chatMessages.set(chatRoomId, []);
                }
            } else {
                // Nếu user gửi tin nhắn, tạo room cho user đó
                chatRoomId = `user-${chatUser.userId || socket.id}`;
            }

            const newMessage: ChatMessage = {
                id: `msg-${Date.now()}-${Math.random()}`,
                userId: chatUser.userId,
                userName: chatUser.userName,
                userAvatar: chatUser.userAvatar,
                message: data.message.trim(),
                timestamp: new Date(),
                isAdmin: chatUser.isAdmin
            };

            // Lưu tin nhắn vào database
            if (chatUser.userId) {
                console.log('💾 Saving message to database:', {
                    roomId: chatRoomId,
                    userId: chatUser.userId,
                    message: newMessage.message,
                    isAdmin: newMessage.isAdmin
                });
                await saveChatMessageToDatabase(chatRoomId, chatUser.userId, newMessage.message, newMessage.isAdmin);
            } else {
                console.log('⚠️ Cannot save message to database: no userId');
            }

            // Thêm tin nhắn vào chat room của user (memory cache)
            const userMessages = chatMessages.get(chatRoomId) || [];
            userMessages.push(newMessage);
            chatMessages.set(chatRoomId, userMessages);

            // Gửi tin nhắn đến room riêng - Gửi cho tất cả trong room đó (bao gồm cả sender)
            io.to(chatRoomId).emit('chat-message', newMessage);
            console.log('Message sent to room:', chatRoomId);
            console.log('Message content:', newMessage);
            console.log('Room members:', Array.from(io.sockets.adapter.rooms.get(chatRoomId) || []));

            // Nếu là tin nhắn từ admin, đảm bảo user nhận được
            if (chatUser.isAdmin) {
                console.log('Admin message sent, ensuring user receives it');
            }

            // Nếu là tin nhắn từ user (không phải admin), gửi thông báo cho admin
            if (!chatUser.isAdmin) {
                console.log('=== USER MESSAGE DEBUG ===');
                console.log('User message sent to room:', chatRoomId);
                console.log('Admin sockets count:', adminSockets.size);

                // Chỉ gửi thông báo đến room admin, không gửi chat-message
                // Admin sẽ nhận chat-message khi join vào room của user
                io.to('admin').emit('new-user-message', {
                    userId: chatUser.userId,
                    userName: chatUser.userName,
                    userAvatar: chatUser.userAvatar,
                    message: data.message,
                    chatRoomId: chatRoomId
                });

                console.log('=== END USER MESSAGE DEBUG ===');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });

    // Xử lý admin join vào room của user
    socket.on('join-user-room', (data: { chatRoomId: string }) => {
        const chatUser = chatUsers.get(socket.id);
        if (chatUser && chatUser.isAdmin) {
            socket.join(data.chatRoomId);
            console.log('Admin joined user room:', data.chatRoomId);
        }
    });

    // Xử lý request chat history
    socket.on('request-chat-history', async (data: { chatRoomId?: string, token?: string }) => {
        const chatUser = chatUsers.get(socket.id);
        if (!chatUser) {
            console.log('No chat user found for socket:', socket.id);
            return;
        }

        if (chatUser.isAdmin && data.chatRoomId) {
            // Admin requesting specific room history
            console.log('Admin requesting chat history for room:', data.chatRoomId);

            // Load tin nhắn từ database
            const dbMessages = await loadChatMessagesFromDatabase(data.chatRoomId, 50);
            const userMessages = chatMessages.get(data.chatRoomId) || [];

            // Merge database messages với memory messages
            const allMessages = [...dbMessages, ...userMessages];
            chatMessages.set(data.chatRoomId, allMessages);

            socket.emit('chat-history', {
                chatRoomId: data.chatRoomId,
                messages: allMessages.slice(-50)
            });

            console.log(`Sent ${allMessages.length} messages to admin for room:`, data.chatRoomId);
        } else if (!chatUser.isAdmin) {
            // User requesting their own chat history
            const userRoomId = `user-${chatUser.userId}`;
            console.log('User requesting chat history for room:', userRoomId);

            // Load tin nhắn từ database
            const dbMessages = await loadChatMessagesFromDatabase(userRoomId, 50);
            const userMessages = chatMessages.get(userRoomId) || [];

            // Merge database messages với memory messages
            const allMessages = [...dbMessages, ...userMessages];
            chatMessages.set(userRoomId, allMessages);

            socket.emit('chat-history', {
                chatRoomId: userRoomId,
                messages: allMessages.slice(-50)
            });

            console.log(`Sent ${allMessages.length} messages to user for room:`, userRoomId);
        }
    });

    // Xử lý admin gửi tin nhắn trực tiếp đến user widget
    socket.on('admin-direct-message', (data: { targetUserId: string, message: string, adminName: string }) => {
        const chatUser = chatUsers.get(socket.id);
        if (chatUser && chatUser.isAdmin) {
            console.log('Admin sending direct message to user widget:', data.targetUserId);

            // Validate data
            if (!data.targetUserId || !data.message || !data.adminName) {
                console.error('Invalid admin-direct-message data:', data);
                return;
            }

            // Tìm user socket và gửi tin nhắn đến widget
            let userFound = false;
            for (const [socketId, user] of chatUsers.entries()) {
                if (user.userId?.toString() === data.targetUserId && !user.isAdmin) {
                    console.log('Sending admin message to user widget:', socketId);
                    io.to(socketId).emit('admin-message', {
                        message: data.message,
                        adminName: data.adminName,
                        timestamp: new Date()
                    });
                    userFound = true;
                    break;
                }
            }

            if (!userFound) {
                console.log('Target user not found or not online:', data.targetUserId);
            }
        }
    });

    // Xử lý typing indicator
    socket.on('typing', (data: { isTyping: boolean }) => {
        const chatUser = chatUsers.get(socket.id);
        if (chatUser) {
            let chatRoomId: string;

            if (chatUser.isAdmin) {
                // Admin typing - cần gửi đến room của user hiện tại
                // Điều này sẽ được xử lý ở client side
                return;
            } else {
                chatRoomId = `user-${chatUser.userId || socket.id}`;
            }

            socket.to(chatRoomId).emit('user-typing', {
                userId: chatUser.userId,
                userName: chatUser.userName,
                isTyping: data.isTyping
            });
        }
    });

    // Xử lý request users with messages
    socket.on('request-users-with-messages', async () => {
        const chatUser = chatUsers.get(socket.id);
        if (chatUser && chatUser.isAdmin) {
            console.log('Admin requesting users with messages');

            try {
                // Get unique users from chat messages
                const usersWithMessages = await prisma.chatMessage.findMany({
                    select: {
                        userId: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true
                            }
                        }
                    },
                    distinct: ['userId'],
                    orderBy: {
                        createdAt: 'desc'
                    }
                });

                const users = usersWithMessages.map(msg => ({
                    userId: msg.userId,
                    userName: msg.user?.name,
                    userAvatar: msg.user?.avatar
                }));

                socket.emit('users-with-messages', users);
                console.log(`Sent ${users.length} users with messages to admin`);
            } catch (error) {
                console.error('Error getting users with messages:', error);
            }
        }
    });

    // Test admin connection
    socket.on('test-admin-connection', (data) => {
        const chatUser = chatUsers.get(socket.id);
        if (chatUser && chatUser.isAdmin) {
            console.log('=== ADMIN CONNECTION TEST ===');
            console.log('Admin test connection received:', data);
            console.log('Admin socket ID:', socket.id);
            console.log('Admin in adminSockets:', adminSockets.has(socket.id));
            console.log('Total admin sockets:', adminSockets.size);
            console.log('Admin user data:', chatUser);
            console.log('=== END ADMIN CONNECTION TEST ===');

            // Send confirmation back to admin
            socket.emit('admin-connection-confirmed', {
                message: 'Admin connection confirmed',
                socketId: socket.id,
                adminSocketsCount: adminSockets.size,
                timestamp: new Date().toISOString()
            });
        }
    });

    // Xử lý disconnect
    socket.on('disconnect', () => {
        const chatUser = chatUsers.get(socket.id);
        if (chatUser) {
            chatUsers.delete(socket.id);

            // Xóa admin socket nếu là admin
            if (chatUser.isAdmin) {
                adminSockets.delete(socket.id);
            }

            // Thông báo user offline cho admin
            if (!chatUser.isAdmin) {
                // Gửi thông báo cho tất cả admin online
                adminSockets.forEach(adminSocketId => {
                    io.to(adminSocketId).emit('user-offline', {
                        userId: chatUser.userId,
                        userName: chatUser.userName,
                        userAvatar: chatUser.userAvatar
                    });
                });
            }
        }
        console.log('User disconnected:', socket.id);
    });
});

// Khởi động server
httpServer.listen(port, () => {
    console.log(`Ứng dụng đang chạy trên cổng ${port}`);
    console.log(`Socket.IO chat system đã sẵn sàng`);
});