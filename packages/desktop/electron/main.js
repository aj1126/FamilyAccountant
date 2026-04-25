const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

let mainWindow;
let db;

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'family_accountant.db');
  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      localId TEXT UNIQUE NOT NULL,
      accountId TEXT NOT NULL,
      householdId TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      description TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT '',
      transactionDate TEXT NOT NULL,
      syncStatus TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      deletedAt TEXT
    )
  `);
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('db:getTransactions', () => {
  return db.prepare('SELECT * FROM transactions ORDER BY transactionDate DESC').all();
});

ipcMain.handle('db:addTransaction', (_event, tx) => {
  const stmt = db.prepare(`
    INSERT INTO transactions
      (id, localId, accountId, householdId, amount, currency, description,
       category, transactionDate, syncStatus, createdAt, updatedAt, deletedAt)
    VALUES
      (@id, @localId, @accountId, @householdId, @amount, @currency, @description,
       @category, @transactionDate, @syncStatus, @createdAt, @updatedAt, @deletedAt)
  `);
  stmt.run(tx);
  return tx;
});

ipcMain.handle('db:updateSyncStatus', (_event, localId, status) => {
  db.prepare('UPDATE transactions SET syncStatus = ? WHERE localId = ?').run(status, localId);
});
