import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { getDatabase, closeDatabase } from './database/connection'
import { runMigrations } from './database/migrations'
import { registerCostsIPC } from './ipc/costs.ipc'
import { registerBudgetsIPC } from './ipc/budgets.ipc'
import { registerServicesIPC } from './ipc/services.ipc'
import { registerProjectsIPC } from './ipc/projects.ipc'
import { registerAuditIPC } from './ipc/audit.ipc'
import { registerSettingsIPC } from './ipc/settings.ipc'
import { registerImportIPC } from './ipc/import.ipc'
import { registerComparisonIPC } from './ipc/comparison.ipc'
import { createTray, destroyTray } from './services/tray.service'
import { triggerAlertCheck } from './services/alert.service'

let mainWindow: BrowserWindow | null = null
let isQuitting = false

function initDatabase(): void {
  const db = getDatabase()
  runMigrations(db)
}

function createWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    show: false,
    title: 'FinOps Cloud Cost Tracker',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  // Minimize to tray instead of closing
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow!.hide()
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}


// Set app user model ID for Windows notifications
app.setAppUserModelId('com.finops.cloud-cost-tracker')

app.whenReady().then(() => {
  // Initialize database
  initDatabase()

  // Register all IPC handlers
  registerCostsIPC()
  registerBudgetsIPC()
  registerServicesIPC()
  registerProjectsIPC()
  registerAuditIPC()
  registerSettingsIPC()
  registerImportIPC()
  registerComparisonIPC()

  // Create window
  const win = createWindow()

  // Create system tray
  createTray(win)

  // IPC: manual alert check from renderer
  ipcMain.handle('alerts:check', () => {
    if (mainWindow) triggerAlertCheck(getDatabase(), mainWindow)
    return true
  })

  // Initial alert check after renderer loads
  setTimeout(() => {
    if (mainWindow) triggerAlertCheck(getDatabase(), mainWindow)
  }, 3000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const newWin = createWindow()
      createTray(newWin)
    }
  })
})

app.on('before-quit', () => {
  isQuitting = true
  destroyTray()
  closeDatabase()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // On Windows/Linux, don't quit — tray keeps running
    // App quits via tray menu "Quit" or before-quit event
  }
})
