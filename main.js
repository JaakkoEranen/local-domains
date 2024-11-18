const { app, BrowserWindow, Menu, Tray, ipcMain, shell } = require('electron');
const Store = require('electron-store');
const path = require('path');
const { init, parseApacheConfigForDomainsAndPorts, ensureHostsFileComments } = require('./src/init');
const { addDomainToApacheConfig, editDomainInApacheConfig, removeDomainFromApacheConfig, restartApache } = require('./src/apacheConfigManager');
const { addDomainToHostsFile, editDomainInHostsFile, removeDomainFromHostsFile } = require('./src/hostsFileManager');
const { executeSudoCommands } = require('./src/sudoCommand');

const store = new Store();

let tray = null;
let domains = [];

const browserWindowOptions = {
  width: 381,
  height: 600,
  resizable: false,
  webPreferences: {
    nodeIntegration: true,
    contextIsolation: false,
    enableRemoteModule: true
  }
};

const createInputWindow = () => {
  let inputWin = new BrowserWindow(browserWindowOptions);

  const inputPath = path.join(__dirname, './views/input.html');

  inputWin.loadFile(inputPath);
};

const createTray = () => {
  const iconPath = path.join(__dirname, './assets/IconTemplate.png');

  tray = new Tray(iconPath);
  updateTrayMenu();
}


const generateDomainMenuItems = () => {
  return domains.map((item, index) => ({
    label: `${item.domain}`,
    submenu: [
      { label: `Port: ${item.port}`, enabled: false },
      { type: 'separator' },
      { 
        label: 'Edit', 
        click: () => editDomain(index)
      },
      { 
        label: 'Delete', 
        click: () => removeDomain(item.domain, index)
      },
      { type: 'separator' },
      {
        label: 'Open in Browser',
        click: () => shell.openExternal(`http://${item.domain}`)
      },
      {
        label: 'Open as Localhost',
        click: () => shell.openExternal(`http://localhost:${item.port}`)
      }
    ]
  }));
}

const updateTrayMenu = () => {
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Add Domain', click: () => createInputWindow() },
    { type: 'separator' },
    ...generateDomainMenuItems(),
    { type: 'separator' },
    { label: 'Exit', role: 'quit' }
  ]);
  tray.setContextMenu(contextMenu);
}

const editDomain = index => {
  let editWin = new BrowserWindow(browserWindowOptions);

  const domainData = domains[index];
  const locations = encodeURIComponent(JSON.stringify(domainData.locations || []));
  
  editWin.loadURL(`file://${__dirname}/views/edit.html?domain=${domainData.domain}&port=${domainData.port}&index=${index}&locations=${locations}`);
};

const removeDomain = async (domain, index) => {
  const apacheConfigCommand = await removeDomainFromApacheConfig(domain);
  const hostsFileCommand = await removeDomainFromHostsFile(domain);
  const restartCommand = restartApache();

  await executeSudoCommands([apacheConfigCommand, hostsFileCommand, restartCommand])

  domains.splice(index, 1);
  store.set('domains', domains);

  updateTrayMenu();
} 


const setIpcMainListeners = () => {
  ipcMain.on('add-domain', async (event, { domain, port, locations }) => {
    try {
      const apacheConfigCommand = addDomainToApacheConfig(domain, port, locations);
      const hostsFileCommand = await addDomainToHostsFile(domain);
      const restartCommand = restartApache();
      
      await executeSudoCommands([apacheConfigCommand, hostsFileCommand, restartCommand])
  
      domains.push({ domain, port, locations });
      store.set('domains', domains);
  
      updateTrayMenu();
      event.reply('add-complete');
    } catch (error) {
      console.error('Sudo command error:', error);
      event.reply('add-error', {message: error.message});
    }
  });

  ipcMain.on('edit-domain', async (event, { domain, port, index, locations }) => {
    const domainIndex = parseInt(index, 10);

    if (domainIndex >= 0 && domainIndex < domains.length) {
      try {
        const editApacheConfigCommand = await editDomainInApacheConfig(domains[domainIndex].domain, domain, port, locations)
        const editHostsFileCommand = await editDomainInHostsFile(domains[domainIndex].domain, domain)
        const restartCommand = restartApache()

        await executeSudoCommands([editApacheConfigCommand, editHostsFileCommand, restartCommand])

        domains[domainIndex] = { domain, port, locations };
        store.set('domains', domains);

        updateTrayMenu();
        event.reply('edit-complete');
      } catch (error) {
        console.error('Sudo command error:', error);
        event.reply('edit-error', {message: error.message});
      }
    }
  });
}

app.whenReady().then(async () => {
  if (app.dock) {
    app.dock.hide();
  }

  app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: process.platform === 'darwin' ? true : false,
  });

  let savedDomains = store.get('domains');

  if (savedDomains) {
    domains = savedDomains
  } else {
    let commands = await init();

    const hostFileCommand = await ensureHostsFileComments();
    if (hostFileCommand) {
      commands.push(hostFileCommand)
    }

    if (commands.length) {
      await executeSudoCommands(commands)
    }

    const currentList = await parseApacheConfigForDomainsAndPorts();
    if (currentList.length) {
      domains = [...currentList];
      store.set('domains', domains);
    }
  }
  
  createTray();
  setIpcMainListeners();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
