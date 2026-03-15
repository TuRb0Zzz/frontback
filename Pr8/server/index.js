const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const cors = require('cors');

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

const JWT_SECRET = "secret";
const ACCESS_EXPIRES_IN = "30s";

let users = [];
let products = [];

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API магазина с JWT авторизацией',
      version: '1.0.0',
      description: 'API для управления пользователями и товарами с JWT токенами',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Локальный сервер',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    }
  },
  apis: ['./index.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Регистрация
app.post("/api/auth/register", async (req, res) => {
  console.log('Register request:', req.body);
  
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
    hashedPassword
  };

  users.push(newUser);
  console.log('User created:', newUser.id);

  const { hashedPassword: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

// Вход
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email и пароль обязательны" });
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: "Неверные учетные данные" });
  }

  const isValid = await bcrypt.compare(password, user.hashedPassword);
  if (!isValid) {
    return res.status(401).json({ error: "Неверные учетные данные" });
  }

  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );

  res.json({ accessToken });
});

// Информация о пользователе
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const userId = req.user.sub;
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }

  const { hashedPassword: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Товары
app.post("/api/products", authMiddleware, (req, res) => {
  const { title, category, description, price } = req.body;

  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({ error: "Все поля обязательны для заполнения" });
  }

  const newProduct = {
    id: nanoid(6),
    title: title.trim(),
    category: category.trim(),
    description: description.trim(),
    price: Number(price)
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.get("/api/products", authMiddleware, (req, res) => {
  res.json(products);
});

app.get("/api/products/:id", authMiddleware, (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Товар не найден" });
  }
  res.json(product);
});

app.put("/api/products/:id", authMiddleware, (req, res) => {
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

  res.json(product);
});

app.delete("/api/products/:id", authMiddleware, (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Товар не найден" });
  }

  products.splice(index, 1);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
  console.log(`Документация Swagger доступна на http://localhost:${port}/api-docs`);
});