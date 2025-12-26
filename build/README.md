# Build Assets

Ця папка містить ресурси для збірки додатку (іконки тощо).

## Потрібні файли:

- `icon.ico` - іконка для Windows (256x256 або більше)
- `icon.icns` - іконка для macOS
- `icon.png` - іконка для Linux (512x512)

## Створення іконок:

### Windows (.ico)
Можна використати онлайн-сервіси або ImageMagick:
```bash
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

### macOS (.icns)
```bash
iconutil -c icns icon.iconset
```

### Linux (.png)
Просто PNG файл 512x512 пікселів.


