const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');
const url = require('url');
const pkg = require('./package.json');
// 保持一个对于 window 对象的全局引用，如果你不这样做，
// 当 JavaScript 对象被垃圾回收， window 会被自动地关闭
let win;
const template = [
  {
    label: '文件(F)',
    submenu: [
      {
        label: '新建(N)',
        accelerator: 'CmdOrCtrl+N',
      },
      {
        label: '导出(E)',
      },
      {
        type: 'separator',
      },
      {
        label: '退出(Q)',
        accelerator: 'CmdOrCtrl+Q',
        role: 'close',
      },
    ],
  },
  {
    label: '编辑(E)',
    submenu: [
      {
        label: '撤销',
        accelerator: 'CmdOrCtrl+Z',
        role: 'undo',
      },
      {
        label: '重做',
        accelerator: 'Shift+CmdOrCtrl+Z',
        role: 'redo',
      },
      {
        type: 'separator',
      },
      {
        label: '剪切',
        accelerator: 'CmdOrCtrl+X',
        role: 'cut',
      },
      {
        label: '复制',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy',
      },
      {
        label: '粘贴',
        accelerator: 'CmdOrCtrl+V',
        role: 'paste',
      },
    ],
  },
  {
    label: '选择(S)',
    submenu: [
      {
        label: '全选',
        accelerator: 'CmdOrCtrl+A',
        role: 'selectall',
      },
    ],
  },
  {
    label: '查看',
    submenu: [
      {
        label: '全屏切换',
        role: 'togglefullscreen',
      },
    ],
  },
  {
    label: '格式(O)',
    submenu: [
      {
        label: '字体',
      },
      {
        label: '段落',
        submenu: [
          {
            label: '左对齐',
          },
          {
            label: '居中',
          },
          {
            label: '右对齐',
          },
        ],
      },
      {
        label: '样式',
        submenu: [
          {
            label: '加粗',
          },
          {
            label: '斜体',
          },
          {
            label: '下划线',
          },
          {
            label: '高亮',
          },
        ],
      },
      {
        label: '待办事项',
      },
      {
        label: '缩放',
      },
    ],
  },
  {
    label: '工具(T)',
    submenu: [
      {
        label: '最小化',
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize',
      },
      {
        label: '刷新当前窗口',
        role: 'reload',
      },
      {
        label: '全屏切换',
        role: 'togglefullscreen',
      },
      {
        type: 'separator',
      },
      {
        label: '重新打开窗口',
        accelerator: 'CmdOrCtrl+Shift+T',
        key: 'reopenMenuItem',
        click() {
          app.emit('activate');
        },
      },
      {
        label: '隐藏/显示开发者工具',
        role: 'toggledevtools',
      },
    ],
  },
  {
    label: '帮助(H)',
    submenu: [
      {
        label: '检查更新...',
        key: 'checkForUpdate',
        click(item, focusedWindow) {
          const options = {
            type: 'info',
            title: '安全笔记',
            message: '当前没有可用更新',
          };
          dialog.showMessageBox(focusedWindow, options, () => {});
        },
      },
      {
        label: '重启并安装更新',
        enabled: false,
        key: 'restartToUpdate',
      },
      {
        type: 'separator',
      },
      {
        label: '帮助',
        key: 'restartToUpdate',
        click() {
          shell.openExternal('https://www.yuque.com/yuque/help/insert-codes');
        },
      },
      {
        label: '关于',
        key: 'restartToUpdate',
        click(item, focusedWindow) {
          const options = {
            type: 'info',
            title: '安全笔记',
            message: `
            版本: 1.38.1 (user setup)
            提交: b37e54c98e1 a74ba89e03073e5a3761284e3ffbo
            日期: 2019-09-11T13:35:15.0052
            Electron: 4.2.10
            Chrome: 69.0.3497.128
            Node.is: 10.11.0
            V8: 6.9.427.31-electron.0
            OS: Windows NT x64 10.0.18362`,
          };
          dialog.showMessageBox(focusedWindow, options, () => {});
        },
      },
    ],
  },
];
function createWindow() {
  // 创建浏览器窗口。
  win = new BrowserWindow({
    minWidth: 1000,
    minHeight: 700,
    webPreferences: { webSecurity: false, nodeIntegration: true },
    backgroundColor: '#ffffff',
  });
  // 然后加载应用的 index.html。
  // package中的DEV为true时，开启调试窗口。为false时使用编译发布版本
  if (pkg.DEV) {
    win.loadURL('http://localhost:8000/');
  } else {
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, './dist/index.html'),
        protocol: 'file:',
        slashes: true,
      }),
    );
  }

  const appMenu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(appMenu);

  // 打开开发者工具。
  // win.webContents.openDevTools();
  // 当 window 被关闭，这个事件会被触发。
  win.on('closed', () => {
    // 取消引用 window 对象，如果你的应用支持多窗口的话，
    // 通常会把多个 window 对象存放在一个数组里面，
    // 与此同时，你应该删除相应的元素。
    win = null;
  });
}
// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
app.on('ready', createWindow);
// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', () => {
  // 在macOS上，当单击dock图标并且没有其他窗口打开时，
  // 通常在应用程序中重新创建一个窗口。
  if (win === null) {
    createWindow();
  }
});

// 在这文件，你可以续写应用剩下主进程代码。
// 也可以拆分成几个文件，然后用 require 导入。
// 在这里可以添加一些electron相关的其他模块，比如nodejs的一些原生模块
// 文件模块
// const BTFile = require('./sys_modules/BTFile')
// BTFile.getAppPath()
