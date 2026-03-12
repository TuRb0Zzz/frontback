const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

let products = [
  {
    id: nanoid(6),
    name: "Цемент М500 50кг",
    category: "Сыпучие материалы",
    description: "Портландцемент М500 Д0, высокая прочность, быстрое схватывание. Для фундаментных работ, кладки, стяжки.",
    price: 550,
    stock: 45
  },
  {
    id: nanoid(6),
    name: "Кирпич керамический полнотелый",
    category: "Кирпич и блоки",
    description: "Кирпич красный М150, размер 250х120х65 мм. Морозостойкость F50, водопоглощение 8%.",
    price: 75,
    stock: 5000
  },
  {
    id: nanoid(6),
    name: "Доска обрезная 50х150х6000",
    category: "Пиломатериалы",
    description: "Доска обрезная из сосны, естественной влажности, сорт 1-2. Идеально для каркасного строительства.",
    price: 850,
    stock: 320
  },
  {
    id: nanoid(6),
    name: "Арматура рифленая 12мм",
    category: "Металлопрокат",
    description: "Арматура класса А500С, длина 11.7м. Для армирования фундаментов и ж/б конструкций.",
    price: 95,
    stock: 1200
  },
  {
    id: nanoid(6),
    name: "Гвозди строительные 100мм",
    category: "Крепеж",
    description: "Гвозди строительные оцинкованные, вес 1кг. Для кровельных и плотничных работ.",
    price: 180,
    stock: 250
  },
  {
    id: nanoid(6),
    name: "Перфоратор Makita HR2470",
    category: "Инструменты",
    description: "Перфоратор 780Вт, патрон SDS-plus, энергия удара 2.7Дж, 3 режима работы.",
    price: 8990,
    stock: 15
  },
  {
    id: nanoid(6),
    name: "Краска фасадная Tikkurila 9л",
    category: "Лакокрасочные",
    description: "Акрилатная краска для фасадов, белая, матовая. Укрывистость 7-9 м²/л.",
    price: 4250,
    stock: 28
  },
  {
    id: nanoid(6),
    name: "Штукатурка гипсовая Knauf 30кг",
    category: "Сухие смеси",
    description: "Штукатурка гипсовая Rotband, толщина слоя до 50мм, расход 8.5 кг/м².",
    price: 520,
    stock: 86
  },
  {
    id: nanoid(6),
    name: "Плитка керамогранит 600x600",
    category: "Отделочные материалы",
    description: "Керамогранит под бетон, толщина 9мм, износостойкость PEI 4, для пола.",
    price: 1450,
    stock: 340
  },
  {
    id: nanoid(6),
    name: "Черепица металлическая Монтеррей",
    category: "Кровельные материалы",
    description: "Металлочерепица с полимерным покрытием, толщина 0.5мм, цвет RAL 8004.",
    price: 620,
    stock: 180
  }
];

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API магазина строительных товаров',
      version: '1.0.0',
      description: 'Простое API для управления товарами в магазине строительных материалов',
    },
    servers: [
      {
        url: `http://localhost:${port}/api`,
        description: 'Локальный сервер',
      },
    ],
  },
  apis: ['./index.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.json());
app.use(cors({
  origin: "http://localhost:3001",
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      console.log('Body:', req.body);
    }
  });
  next();
});

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
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - description
 *         - price
 *         - stock
 *       properties:
 *         id:
 *           type: string
 *           description: Автоматически сгенерированный уникальный ID товара
 *           example: "abc123"
 *         name:
 *           type: string
 *           description: Название товара
 *           example: "Цемент М500 50кг"
 *         category:
 *           type: string
 *           description: Категория товара
 *           example: "Сыпучие материалы"
 *         description:
 *           type: string
 *           description: Подробное описание товара
 *           example: "Портландцемент М500 Д0, высокая прочность..."
 *         price:
 *           type: number
 *           description: Цена товара в рублях
 *           example: 550
 *         stock:
 *           type: integer
 *           description: Количество товара на складе
 *           example: 45
 *       example:
 *         id: "abc123"
 *         name: "Цемент М500 50кг"
 *         category: "Сыпучие материалы"
 *         description: "Портландцемент М500 Д0, высокая прочность, быстрое схватывание."
 *         price: 550
 *         stock: 45
 */

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Управление товарами
 */

app.get("/api/products", (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Возвращает список всех товаров
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
app.get("/api/products/:id", (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;
  res.json(product);
});

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Получает товар по ID
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Товар не найден"
 */
app.post("/api/products", (req, res) => {
  const { name, category, description, price, stock } = req.body;
  
  if (!name || !category || !description || price === undefined || stock === undefined) {
    return res.status(400).json({ error: "Все поля обязательны для заполнения" });
  }
  
  if (typeof price !== 'number' || price <= 0) {
    return res.status(400).json({ error: "Цена должна быть положительным числом" });
  }
  
  if (typeof stock !== 'number' || stock < 0) {
    return res.status(400).json({ error: "Количество на складе должно быть неотрицательным числом" });
  }
  
  const newProduct = {
    id: nanoid(6),
    name: name.trim(),
    category: category.trim(),
    description: description.trim(),
    price: Number(price),
    stock: Number(stock)
  };
  
  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Создает новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - description
 *               - price
 *               - stock
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *             example:
 *               name: "Новый товар"
 *               category: "Инструменты"
 *               description: "Описание нового товара"
 *               price: 1500
 *               stock: 10
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
app.patch("/api/products/:id", (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;
  
  if (req.body?.name === undefined && req.body?.category === undefined && 
      req.body?.description === undefined && req.body?.price === undefined && 
      req.body?.stock === undefined) {
    return res.status(400).json({ error: "Нет данных для обновления" });
  }
  
  const { name, category, description, price, stock } = req.body;
  
  if (name !== undefined) product.name = name.trim();
  if (category !== undefined) product.category = category.trim();
  if (description !== undefined) product.description = description.trim();
  
  if (price !== undefined) {
    if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ error: "Цена должна быть положительным числом" });
    }
    product.price = Number(price);
  }
  
  if (stock !== undefined) {
    if (typeof stock !== 'number' || stock < 0) {
      return res.status(400).json({ error: "Количество на складе должно быть неотрицательным числом" });
    }
    product.stock = Number(stock);
  }
  
  res.json(product);
});

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Обновляет существующий товар
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
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *             example:
 *               name: "Обновленное название"
 *               price: 1200
 *     responses:
 *       200:
 *         description: Обновленный товар
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Нет данных для обновления или ошибка валидации
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

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Удаляет товар
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
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
  console.log(`Магазин строительных товаров`);
});