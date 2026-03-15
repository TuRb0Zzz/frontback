const express = require('express');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

app.use(express.json());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API магазина с авторизацией',
      version: '1.0.0',
      description: 'API для управления пользователями и товарами',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Локальный сервер',
      },
    ],
  },
  apis: ['./index.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

let users = [];
let products = [];

function findUserByEmail(email, res) {
  const user = users.find(u => u.email === email);
  if (!user) {
    res.status(404).json({ error: "Пользователь не найден" });
    return null;
  }
  return user;
}

function findProductOr404(id, res) {
  const product = products.find(p => p.id === id);
  if (!product) {
    res.status(404).json({ error: "Товар не найден" });
    return null;
  }
  return product;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - first_name
 *         - last_name
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: Автоматически сгенерированный ID пользователя
 *           example: "abc123"
 *         email:
 *           type: string
 *           format: email
 *           description: Email пользователя (логин)
 *           example: "ivan@mail.ru"
 *         first_name:
 *           type: string
 *           description: Имя пользователя
 *           example: "Иван"
 *         last_name:
 *           type: string
 *           description: Фамилия пользователя
 *           example: "Иванов"
 *         password:
 *           type: string
 *           description: Хешированный пароль (не возвращается в ответах)
 *           example: "$2b$10$..."
 *     Product:
 *       type: object
 *       required:
 *         - title
 *         - category
 *         - description
 *         - price
 *       properties:
 *         id:
 *           type: string
 *           description: Автоматически сгенерированный ID товара
 *           example: "prod123"
 *         title:
 *           type: string
 *           description: Название товара
 *           example: "Цемент М500"
 *         category:
 *           type: string
 *           description: Категория товара
 *           example: "Стройматериалы"
 *         description:
 *           type: string
 *           description: Описание товара
 *           example: "Портландцемент М500, 50кг"
 *         price:
 *           type: number
 *           description: Цена товара
 *           example: 550
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "ivan@mail.ru"
 *         password:
 *           type: string
 *           example: "qwerty123"
 */

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Регистрация и авторизация
 *   - name: Products
 *     description: Управление товарами
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - first_name
 *               - last_name
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               password:
 *                 type: string
 *             example:
 *               email: "ivan@mail.ru"
 *               first_name: "Иван"
 *               last_name: "Иванов"
 *               password: "qwerty123"
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 first_name:
 *                   type: string
 *                 last_name:
 *                   type: string
 *               example:
 *                 id: "abc123"
 *                 email: "ivan@mail.ru"
 *                 first_name: "Иван"
 *                 last_name: "Иванов"
 *       400:
 *         description: Ошибка валидации или email уже существует
 */
app.post("/api/auth/register", async (req, res) => {
  const { email, first_name, last_name, password } = req.body;


  if (!email || !first_name || !last_name || !password) {
    return res.status(400).json({ error: "Все поля обязательны для заполнения" });
  }


  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: "Пользователь с таким email уже существует" });
  }


  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const newUser = {
    id: nanoid(6),
    email: email,
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    hashedPassword: hashedPassword
  };

  users.push(newUser);


  const { hashedPassword: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Вход выполнен успешно"
 *       400:
 *         description: Отсутствуют обязательные поля
 *       401:
 *         description: Неверный пароль
 *       404:
 *         description: Пользователь не найден
 */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email и пароль обязательны" });
  }

  const user = findUserByEmail(email, res);
  if (!user) return;

  const isAuthenticated = await bcrypt.compare(password, user.hashedPassword);

  if (isAuthenticated) {
    res.status(200).json({ 
      success: true, 
      message: "Вход выполнен успешно",
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  } else {
    res.status(401).json({ error: "Неверный пароль" });
  }
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - description
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *             example:
 *               title: "Новый товар"
 *               category: "Инструменты"
 *               description: "Описание товара"
 *               price: 1500
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Ошибка валидации
 */
app.post("/api/products", (req, res) => {
  const { title, category, description, price } = req.body;

  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({ error: "Все поля обязательны для заполнения" });
  }

  if (typeof price !== 'number' || price <= 0) {
    return res.status(400).json({ error: "Цена должна быть положительным числом" });
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

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get("/api/products", (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Данные товара
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 */
app.get("/api/products/:id", (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;
  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить товар (полное обновление)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - description
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Обновленный товар
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Ошибка валидации
 *       404:
 *         description: Товар не найден
 */
app.put("/api/products/:id", (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;

  const { title, category, description, price } = req.body;

  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({ error: "Все поля обязательны для заполнения" });
  }

  if (typeof price !== 'number' || price <= 0) {
    return res.status(400).json({ error: "Цена должна быть положительным числом" });
  }

  product.title = title.trim();
  product.category = category.trim();
  product.description = description.trim();
  product.price = Number(price);

  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     responses:
 *       204:
 *         description: Товар успешно удален (нет тела ответа)
 *       404:
 *         description: Товар не найден
 */
app.delete("/api/products/:id", (req, res) => {
  const id = req.params.id;
  const exists = products.some(p => p.id === id);

  if (!exists) {
    return res.status(404).json({ error: "Товар не найден" });
  }

  products = products.filter(p => p.id !== id);
  res.status(204).send();
});

// 404 для всех остальных маршрутов
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});


app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
  console.log(`Документация Swagger доступна на http://localhost:${port}/api-docs`);
});