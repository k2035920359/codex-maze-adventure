# Desktop Build Notes

## Windows

An unpacked Windows desktop build has been generated in:

- `dist/win-unpacked/`

The executable is:

- `dist/win-unpacked/迷宮冒險.exe`

A zipped copy is also available:

- `dist/maze-adventure-windows.zip`

## macOS

The Electron project is configured for macOS in `package.json`, but a real macOS app bundle was not built here because this workspace is running on Windows.

On a Mac, run:

```bash
npm install
npm run pack:mac
```

The output will be written to:

- `dist/`
