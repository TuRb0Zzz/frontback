const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');

const app = express();
const port = 3000;

// Начальные данные - строительные товары
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

// Middleware
app.use(express.json());
app.use(cors({
  origin: "http://localhost:3001",
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Логирование запросов
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      console.log('Body:', req.body);
    }
  });
  next();
});

// Вспомогательная функция для поиска товара
function findProductOr404(id, res) {
  const product = products.find(p => p.id === id);
  if (!product) {
    res.status(404).json({ error: "Товар не найден" });
    return null;
  }
  return product;
}

// Маршруты API

// GET /api/products - получение всех товаров
app.get("/api/products", (req, res) => {
  res.json(products);
});

// GET /api/products/:id - получение товара по ID
app.get("/api/products/:id", (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;
  res.json(product);
});

// POST /api/products - создание нового товара
app.post("/api/products", (req, res) => {
  const { name, category, description, price, stock } = req.body;
  
  // Валидация
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

// PATCH /api/products/:id - обновление товара
app.patch("/api/products/:id", (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;
  
  // Проверяем, есть ли что обновлять
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

// DELETE /api/products/:id - удаление товара
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

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
  console.log(`Магазин строительных товаров`);
});