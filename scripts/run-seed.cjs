const { execFileSync } = require('child_process')
const electronPath = require('electron')

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

execFileSync(electronPath, ['scripts/seed.cjs'], { stdio: 'inherit', env })
