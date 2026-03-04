import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron'
import { join } from 'path'
import type { BudgetAlertData } from './notification.service'

let tray: Tray | null = null
let lastAlerts: BudgetAlertData[] = []

function getTrayIcon(): nativeImage {
  // Try loading icon from resources, fallback to programmatic 16x16 icon
  try {
    const iconPath = join(__dirname, '../../resources/icon.png')
    const img = nativeImage.createFromPath(iconPath)
    if (!img.isEmpty()) return img.resize({ width: 16, height: 16 })
  } catch {
    // ignore
  }

  // Fallback: create a simple 16x16 blue square icon
  const size = 16
  const channels = 4
  const buffer = Buffer.alloc(size * size * channels)
  for (let i = 0; i < size * size; i++) {
    buffer[i * channels + 0] = 22 // R
    buffer[i * channels + 1] = 119 // G
    buffer[i * channels + 2] = 255 // B
    buffer[i * channels + 3] = 255 // A
  }
  return nativeImage.createFromBuffer(buffer, { width: size, height: size })
}

function buildContextMenu(mainWindow: BrowserWindow | null): Menu {
  const alertItems: Electron.MenuItemConstructorOptions[] =
    lastAlerts.length > 0
      ? [
          { type: 'separator' },
          {
            label: `⚠ ${lastAlerts.length} budget alert(s)`,
            enabled: false
          },
          ...lastAlerts.slice(0, 3).map((a) => ({
            label: `${a.level.toUpperCase()}: ${a.budget_name} (${Math.round(a.utilization * 100)}%)`,
            click: (): void => {
              if (mainWindow) {
                mainWindow.show()
                mainWindow.focus()
                mainWindow.webContents.send('navigate', '/budgets')
              }
            }
          })),
          { type: 'separator' as const }
        ]
      : [{ type: 'separator' as const }]

  return Menu.buildFromTemplate([
    {
      label: 'Show FinOps Tracker',
      click: (): void => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    ...alertItems,
    {
      label: 'Dashboard',
      click: (): void => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
          mainWindow.webContents.send('navigate', '/')
        }
      }
    },
    {
      label: 'Budgets',
      click: (): void => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
          mainWindow.webContents.send('navigate', '/budgets')
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: (): void => {
        app.quit()
      }
    }
  ])
}

export function createTray(mainWindow: BrowserWindow): Tray {
  const icon = getTrayIcon()
  tray = new Tray(icon)
  tray.setToolTip('FinOps Cloud Cost Tracker')
  tray.setContextMenu(buildContextMenu(mainWindow))

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })

  return tray
}

export function updateTrayAlerts(
  alerts: BudgetAlertData[],
  mainWindow: BrowserWindow
): void {
  lastAlerts = alerts
  if (tray) {
    tray.setContextMenu(buildContextMenu(mainWindow))
    const count = alerts.length
    tray.setToolTip(
      count > 0
        ? `FinOps Tracker — ${count} alert(s)`
        : 'FinOps Cloud Cost Tracker'
    )
  }
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}
