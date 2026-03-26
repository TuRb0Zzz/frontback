const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));


const ACCESS_SECRET = "access_secret_key";
const REFRESH_SECRET = "refresh_secret_key";


const ACCESS_EXPIRES_IN = "10s";
const REFRESH_EXPIRES_IN = "7d";


let users = [];
let products = [
  {
    id: nanoid(6),
    title: "Цемент М500 50кг",
    category: "Стройматериалы",
    description: "Портландцемент М500, высокая прочность",
    price: 550,
    createdBy: "system",
    createdAt: new Date().toISOString()
  },
  {
    id: nanoid(6),
    title: "Кирпич красный",
    category: "Стройматериалы",
    description: "Кирпич керамический полнотелый М150",
    price: 75,
    createdBy: "system",
    createdAt: new Date().toISOString()
  },
  {
    id: nanoid(6),
    title: "Перфоратор Makita",
    category: "Инструменты",
    description: "Мощный перфоратор для профессиональных работ",
    price: 8990,
    createdBy: "system",
    createdAt: new Date().toISOString()
  }
];
let refreshTokens = new Set();


const ROLES = {
  USER: 'user',
  SELLER: 'seller',
  ADMIN: 'admin'
};


function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}


function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  
  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired access token" });
  }
}


function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied. Insufficient permissions" });
    }
    
    next();
  };
}




app.post("/api/auth/register", async (req, res) => {
  const { email, first_name, last_name, password } = req.body;

  if (!email || !first_name || !last_name || !password) {
    return res.status(400).json({ error: "Все поля обязательны для заполнения" });
  }

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: "Пользователь с таким email уже существует" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: nanoid(6),
    email,
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    role: ROLES.ADMIN, 
    hashedPassword,
    isActive: true 
  };

  users.push(newUser);

  const { hashedPassword: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});


app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email и пароль обязательны" });
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: "Неверные учетные данные" });
  }
  
  if (user.isActive === false) {
    return res.status(403).json({ error: "Аккаунт заблокирован" });
  }

  const isValid = await bcrypt.compare(password, user.hashedPassword);
  if (!isValid) {
    return res.status(401).json({ error: "Неверные учетные данные" });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  
  refreshTokens.add(refreshToken);

  res.json({ accessToken, refreshToken });
});


app.post("/api/auth/refresh", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: "refreshToken is required" });
  }

  if (!refreshTokens.has(refreshToken)) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = users.find(u => u.id === payload.sub);

    if (!user || user.isActive === false) {
      return res.status(401).json({ error: "User not found or blocked" });
    }

    refreshTokens.delete(refreshToken);
    
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    
    refreshTokens.add(newRefreshToken);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  const userId = req.user.sub;
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }

  const { hashedPassword: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.post("/api/auth/logout", (req, res) => {
  const { refreshToken } = req.body;
  
  if (refreshToken && refreshTokens.has(refreshToken)) {
    refreshTokens.delete(refreshToken);
  }
  
  res.json({ message: "Logged out successfully" });
});

app.get("/api/users", authMiddleware, roleMiddleware([ROLES.ADMIN]), (req, res) => {
  const usersList = users.map(({ hashedPassword: _, ...user }) => user);
  res.json(usersList);
});

app.get("/api/users/:id", authMiddleware, roleMiddleware([ROLES.ADMIN]), (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }
  
  const { hashedPassword: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.put("/api/users/:id", authMiddleware, roleMiddleware([ROLES.ADMIN]), async (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }
  
  const { first_name, last_name, role } = req.body;
  
  if (first_name !== undefined) user.first_name = first_name.trim();
  if (last_name !== undefined) user.last_name = last_name.trim();
  if (role !== undefined && [ROLES.USER, ROLES.SELLER, ROLES.ADMIN].includes(role)) {
    user.role = role;
  }
  
  const { hashedPassword: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.delete("/api/users/:id", authMiddleware, roleMiddleware([ROLES.ADMIN]), (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }
  
  user.isActive = false;
  
  for (const token of refreshTokens) {
    try {
      const decoded = jwt.verify(token, REFRESH_SECRET);
      if (decoded.sub === user.id) {
        refreshTokens.delete(token);
      }
    } catch (e) {
      
    }
  }
  
  res.status(204).send();
});



app.post("/api/products", authMiddleware, roleMiddleware([ROLES.SELLER, ROLES.ADMIN]), (req, res) => {
  const { title, category, description, price } = req.body;

  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({ error: "Все поля обязательны для заполнения" });
  }

  const newProduct = {
    id: nanoid(6),
    title: title.trim(),
    category: category.trim(),
    description: description.trim(),
    price: Number(price),
    createdBy: req.user.sub,
    createdAt: new Date().toISOString()
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

// Получить список товаров 
app.get("/api/products", authMiddleware, (req, res) => {
  res.json(products);
});

// Получить товар по ID если есть аккаунт
app.get("/api/products/:id", authMiddleware, (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Товар не найден" });
  }
  res.json(product);
});

// Обновить товар админ + продавец
app.put("/api/products/:id", authMiddleware, roleMiddleware([ROLES.SELLER, ROLES.ADMIN]), (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Товар не найден" });
  }

  const { title, category, description, price } = req.body;

  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({ error: "Все поля обязательны для заполнения" });
  }

  product.title = title.trim();
  product.category = category.trim();
  product.description = description.trim();
  product.price = Number(price);
  product.updatedAt = new Date().toISOString();

  res.json(product);
});

// Удалить товар, админ
app.delete("/api/products/:id", authMiddleware, roleMiddleware([ROLES.ADMIN]), (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Товар не найден" });
  }

  products.splice(index, 1);
  res.status(204).send();
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Обработчик ошибок
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});