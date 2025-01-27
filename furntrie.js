const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

// تأكد من أن مجلد "uploads" موجود
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir); // إنشاء المجلد إذا لم يكن موجودًا
}

// إعدادات تخزين multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir); // تحديد مجلد "uploads" لتخزين الصور
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // إضافة timestamp لاسم الصورة لتجنب التكرار
    }
});
const upload = multer({ storage: storage });

// إعدادات التطبيق
const app = express();
const PORT = 5000;
const DATA_FILE = path.join(__dirname, 'furniture.json');

// Middleware for parsing JSON
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // تقديم الملفات من المجلد "uploads" عبر المسار /uploads

// السماح بالطلبات من localhost:3000
app.use(cors({
  origin: 'http://localhost:3000', // يمكنك تحديد مصدر واحد فقط أو '*'
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Helper function to read data from the JSON file
const readData = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

// Helper function to write data to the JSON file
const writeData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
};
app.get('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const furniture = readData(); // قراءة البيانات من الملف
    const product = furniture.find(item => item.id === parseInt(id)); // إيجاد المنتج بواسطة الـ id
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
});


// مسار GET للرابط الرئيسي
app.get('/', (req, res) => {
    res.send('Welcome to the Furniture API!');
});

// مسار GET لعرض جميع المنتجات (الأثاث)
app.get('/api/products', (req, res) => {
    const furniture = readData();
    res.status(200).json(furniture); // إرجاع جميع المنتجات
});

// إنشاء منتج جديد مع صورة
app.post('/api/products', upload.single('image'), (req, res) => {
    const furniture = readData();
    const newItem = {
        id: furniture.length ? furniture[furniture.length - 1].id + 1 : 1,
        ...req.body,
        image: req.file ? `/uploads/${req.file.filename}` : null
    };
    console.log("Uploaded image path:", newItem.image); // تحقق من المسار المرسل
    furniture.push(newItem);
    writeData(furniture);
    res.status(201).json(newItem);
});

// بدء السيرفر
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
