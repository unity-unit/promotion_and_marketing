require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');

const { pool } = require('./db');
const { requireLogin } = require('./middleware/auth');

// Allow demo/public access without login (frontend now shows all pages).
// If you need to enforce sessions later, remove the public wrappers below.
function requireLoginOrPublic(req, res, next) {
  // if session exists => normal auth
  if (req.session && req.session.userId) return next();
  // allow read-only endpoints to be public
  const readOnly = ['GET', 'HEAD'].includes(req.method);
  if (readOnly) return next();
  // block writes if not logged in
  return res.status(401).json({ message: 'Unauthorized' });
}


const app = express();

app.use(express.json());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.SESSION_SECURE === 'true',
      maxAge: 1000 * 60 * 60 * 2 // 2 hours
    }
  })
);

// ---- Health ----
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// ---- Auth ----
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, role } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: 'username and password are required' });
    }

    const userRole = role || 'USER';

    const [existing] = await pool.query(
      'SELECT id FROM Users WHERE UserName = ? LIMIT 1',
      [username]
    );
    if (existing.length) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO Users (UserName, Password, Role) VALUES (?, ?, ?)',
      [username, hash, userRole]
    );

    res.status(201).json({ id: result.insertId, username, role: userRole });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: 'username and password are required' });
    }

    const [rows] = await pool.query(
      'SELECT id, Password, Role FROM Users WHERE UserName = ? LIMIT 1',
      [username]
    );

    if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });

    const bcrypt = require('bcrypt');
    const ok = await bcrypt.compare(password, rows[0].Password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    req.session.userId = rows[0].id;
    req.session.userRole = rows[0].Role;
    req.session.userName = username;

    res.json({ id: rows[0].id, username, role: rows[0].Role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/logout', requireLogin, (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get('/api/auth/me', requireLogin, (req, res) => {
  res.json({
    userId: req.session.userId,
    userName: req.session.userName,
    role: req.session.userRole
  });
});

// ---- Generic helpers ----
function requireFields(fields, body) {
  for (const f of fields) {
    if (body[f] === undefined || body[f] === null || body[f] === '') return f;
  }
  return null;
}

// ---- Vehicle CRUD ----
app.get('/api/vehicles', requireLogin, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const like = `%${q}%`;

    const [rows] = await pool.query(
      `SELECT * FROM Vehicle
       WHERE ? = '' OR Plate_Number LIKE ? OR Brand LIKE ? OR Model LIKE ?
       ORDER BY id DESC`,
      [q, like, like, like]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/vehicles', requireLogin, async (req, res) => {
  try {
    const body = req.body || {};
    const missing = requireFields(
      ['Plate_Number', 'Brand', 'Model', 'Year', 'Vehicle_Type', 'Purchase_Price', 'Status'],
      body
    );
    if (missing) return res.status(400).json({ message: `${missing} is required` });

    const [result] = await pool.query(
      `INSERT INTO Vehicle
       (Plate_Number, Brand, Model, Year, Vehicle_Type, Purchase_Price, Status, OwnerUserId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      , [
        body.Plate_Number,
        body.Brand,
        body.Model,
        body.Year,
        body.Vehicle_Type,
        body.Purchase_Price,
        body.Status,
        req.session.userId
      ]
    );

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/vehicles/:id', requireLogin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};

    const [result] = await pool.query(
      `UPDATE Vehicle
       SET Plate_Number=?, Brand=?, Model=?, Year=?, Vehicle_Type=?, Purchase_Price=?, Status=?
       WHERE id=?`,
      [
        body.Plate_Number,
        body.Brand,
        body.Model,
        body.Year,
        body.Vehicle_Type,
        body.Purchase_Price,
        body.Status,
        id
      ]
    );

    res.json({ ok: true, affectedRows: result.affectedRows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/vehicles/:id', requireLogin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [result] = await pool.query('DELETE FROM Vehicle WHERE id=?', [id]);
    res.json({ ok: true, affectedRows: result.affectedRows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---- Customer CRUD ----
app.get('/api/customers', requireLogin, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const like = `%${q}%`;

    const [rows] = await pool.query(
      `SELECT * FROM Customer
       WHERE ? = '' OR FirstName LIKE ? OR LastName LIKE ? OR Email LIKE ? OR PhoneNumber LIKE ?
       ORDER BY id DESC`,
      [q, like, like, like, like]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/customers', requireLogin, async (req, res) => {
  try {
    const body = req.body || {};
    const missing = requireFields(
      ['FirstName', 'LastName', 'Email', 'PhoneNumber', 'CreatedAt', 'Status'],
      body
    );
    if (missing) return res.status(400).json({ message: `${missing} is required` });

    const [result] = await pool.query(
      `INSERT INTO Customer
       (FirstName, LastName, Email, PhoneNumber, CreatedAt, Status, OwnerUserId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      , [
        body.FirstName,
        body.LastName,
        body.Email,
        body.PhoneNumber,
        body.CreatedAt,
        body.Status,
        body.Status,
        req.session.userId
      ]
    );

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/customers/:id', requireLogin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};
    const [result] = await pool.query(
      `UPDATE Customer
       SET FirstName=?, LastName=?, Email=?, PhoneNumber=?, CreatedAt=?, Status=?
       WHERE id=?`,
      [body.FirstName, body.LastName, body.Email, body.PhoneNumber, body.CreatedAt, body.Status, id]
    );
    res.json({ ok: true, affectedRows: result.affectedRows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/customers/:id', requireLogin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [result] = await pool.query('DELETE FROM Customer WHERE id=?', [id]);
    res.json({ ok: true, affectedRows: result.affectedRows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---- Promotion CRUD ----
app.get('/api/promotions', requireLogin, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const like = `%${q}%`;

    const [rows] = await pool.query(
      `SELECT * FROM Promotion
       WHERE ? = '' OR Title LIKE ? OR Description LIKE ?
       ORDER BY id DESC`,
      [q, like, like]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/promotions', requireLogin, async (req, res) => {
  try {
    const body = req.body || {};
    const missing = requireFields(
      ['Title', 'Description', 'Discount_Type', 'Discount_Value', 'Start_Date', 'End_Date', 'Status'],
      body
    );
    if (missing) return res.status(400).json({ message: `${missing} is required` });

    const [result] = await pool.query(
      `INSERT INTO Promotion
       (Title, Description, Discount_Type, Discount_Value, Start_Date, End_Date, Status, OwnerUserId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.Title,
        body.Description,
        body.Discount_Type,
        body.Discount_Value,
        body.Start_Date,
        body.End_Date,
        body.Status,
        req.session.userId
      ]
    );

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---- Promotion update/delete ----
app.put('/api/promotions/:id', requireLogin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};

    const [result] = await pool.query(
      `UPDATE Promotion
       SET Title=?, Description=?, Discount_Type=?, Discount_Value=?, Start_Date=?, End_Date=?, Status=?
       WHERE id=?`,
      [
        body.Title,
        body.Description,
        body.Discount_Type,
        body.Discount_Value,
        body.Start_Date,
        body.End_Date,
        body.Status,
        id
      ]
    );

    res.json({ ok: true, affectedRows: result.affectedRows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/promotions/:id', requireLogin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Remove links first to satisfy FK constraints.
    await pool.query('DELETE FROM Promotion_Vehicle WHERE PromotionId=?', [id]);

    const [result] = await pool.query('DELETE FROM Promotion WHERE id=?', [id]);
    res.json({ ok: true, affectedRows: result.affectedRows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---- Promotion_Vehicle linking CRUD ----
app.get('/api/promotion-vehicles', requireLogin, async (req, res) => {
  try {
    const promotionId = req.query.promotionId ? Number(req.query.promotionId) : null;
    const vehicleId = req.query.vehicleId ? Number(req.query.vehicleId) : null;

    let sql = `SELECT * FROM Promotion_Vehicle`;
    const params = [];

    const where = [];
    if (promotionId) { where.push('PromotionId=?'); params.push(promotionId); }
    if (vehicleId) { where.push('VehicleId=?'); params.push(vehicleId); }
    if (where.length) sql += ` WHERE ${where.join(' AND ')}`;

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/promotion-vehicles', requireLogin, async (req, res) => {
  try {
    const body = req.body || {};
    const missing = requireFields(['PromotionId', 'VehicleId', 'Performance'], body);
    if (missing) return res.status(400).json({ message: `${missing} is required` });

    // Ensure no duplicate pair (PromotionId, VehicleId)
    await pool.query(
      `INSERT INTO Promotion_Vehicle (PromotionId, VehicleId, Performance, CreatedByUserId)
       VALUES (?, ?, ?, ?)`,
      [body.PromotionId, body.VehicleId, body.Performance, req.session.userId]
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/promotion-vehicles', requireLogin, async (req, res) => {
  try {
    const { promotionId, vehicleId } = req.query || {};
    if (!promotionId || !vehicleId) {
      return res.status(400).json({ message: 'promotionId and vehicleId are required' });
    }

    const [result] = await pool.query(
      'DELETE FROM Promotion_Vehicle WHERE PromotionId=? AND VehicleId=?',
      [Number(promotionId), Number(vehicleId)]
    );

    res.json({ ok: true, affectedRows: result.affectedRows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---- Report ----
// Rule B: all customers are interested in all vehicles that have promotions.
app.get('/api/report/customers-promotions', requireLogin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        c.FirstName,
        c.LastName,
        v.Brand,
        v.Model,
        p.Title,
        p.Discount_Value,
        pv.Performance
      FROM Customer c
      JOIN Promotion_Vehicle pv ON 1=1
      JOIN Vehicle v ON v.id = pv.VehicleId
      JOIN Promotion p ON p.id = pv.PromotionId`
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---- Start ----
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`PMS backend running on http://localhost:${port}`);
});

