const express = require('express');
const app = express(); //подключение express, установка порта
const port = 3000;

app.use(express.json());

//Товары
let products = [
    { id: 1, name: 'Шапка', price: 1000 },
    { id: 2, name: 'Куртка', price: 2000 },
    { id: 3, name: 'Ботинки', price: 3500 },
    { id: 4, name: 'Штаны', price: 2000 }
];

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});//Все запросы будут выводиться на экран

app.get('/', (req, res) => {//переброс на страницу товаров
    res.redirect('/products');
});


// Получить товары
app.get('/products', (req, res) => {
    res.json(products);
});

// Получить конкретный товар
app.get('/products/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    
    if (!product) {
        return res.status(404).json({ message: 'Товар не найден' });
    }
    
    res.json(product);
});

// создать товар
app.post('/products', (req, res) => {
    const { name, price } = req.body;
    
    
    if (!name || !price) {
        return res.status(400).json({ 
            message: 'Необходимо указать название и стоимость товара' 
        });
    }
    
    if (typeof price !== 'number' || price <= 0) {
        return res.status(400).json({ 
            message: 'Стоимость должна быть положительным числом' 
        });
    }
    
    const newProduct = {
        id: Date.now(),
        name,
        price
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

// Обновить данные товара
app.patch('/products/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    
    if (!product) {
        return res.status(404).json({ message: 'Товара не существует' });
    }
    
    const { name, price } = req.body;
    
    if (name !== undefined) {
        if (typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ 
                message: 'Название должно быть непустой строкой' 
            });
        }
        product.name = name;
    }
    
    if (price !== undefined) {
        if (typeof price !== 'number' || price <= 0) {
            return res.status(400).json({ 
                message: 'Стоимость должна быть положительным числом' 
            });
        }
        product.price = price;
    }
    
    res.json(product);
});

// Удаление товаров
app.delete('/products/:id', (req, res) => {
    const productIndex = products.findIndex(p => p.id == req.params.id);
    
    if (productIndex === -1) {
        return res.status(404).json({ message: 'Товара не существует' });
    }
    
    products.splice(productIndex, 1);
    res.json({ message: 'Товар удален' });
});

app.listen(port, () => { //запуск
    console.log(`Сервер запущен на http://localhost:${port}`);
});