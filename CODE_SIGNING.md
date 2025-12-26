# Code Signing для Windows

## Варіанти підпису коду

### 1. Self-Signed сертифікат (для тестування)

#### Створення сертифікату:

```powershell
# Відкрити PowerShell як Адміністратор
New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=NFL Web" -CertStoreLocation Cert:\CurrentUser\My -KeyUsage DigitalSignature
```

#### Експорт сертифікату в PFX файл:

```powershell
# Знайти thumbprint сертифікату
Get-ChildItem -Path Cert:\CurrentUser\My -CodeSigningCert

# Експортувати (замініть THUMBPRINT на реальний)
$password = ConvertTo-SecureString -String "YourPassword123" -Force -AsPlainText
Export-PfxCertificate -Cert Cert:\CurrentUser\My\THUMBPRINT -FilePath "certificate.pfx" -Password $password
```

#### Використання:

1. Збережіть `certificate.pfx` в папку проекту (або безпечне місце)
2. Встановіть змінні оточення:

```powershell
$env:WIN_CERTIFICATE_FILE = "C:\path\to\certificate.pfx"
$env:WIN_CERTIFICATE_PASSWORD = "YourPassword123"
```

3. Запустіть білд:

```bash
npm run electron:build
```

### 2. Комерційний сертифікат (для продакшену)

#### Отримання сертифікату:

1. Придбайте код signing certificate у одного з провайдерів:
   - DigiCert
   - Sectigo (Comodo)
   - GlobalSign
   - SSL.com

2. Після покупки ви отримаєте:
   - `.pfx` файл (або `.p12`)
   - Пароль для сертифікату

#### Використання:

1. Збережіть `.pfx` файл в безпечне місце
2. Встановіть змінні оточення:

```powershell
$env:WIN_CERTIFICATE_FILE = "C:\path\to\your-certificate.pfx"
$env:WIN_CERTIFICATE_PASSWORD = "YourCertificatePassword"
```

3. Запустіть білд:

```bash
npm run electron:build
```

### 3. Автоматичний підпис через змінні оточення

Можна також використовувати змінні оточення для автоматичного підпису:

```powershell
# Встановити змінні оточення постійно (для поточного користувача)
[System.Environment]::SetEnvironmentVariable('WIN_CERTIFICATE_FILE', 'C:\path\to\certificate.pfx', 'User')
[System.Environment]::SetEnvironmentVariable('WIN_CERTIFICATE_PASSWORD', 'YourPassword', 'User')
```

### 4. Вимкнути підпис (для розробки)

Якщо потрібно тимчасово вимкнути підпис, встановіть:

```powershell
$env:WIN_CERTIFICATE_FILE = ""
```

Або змініть в `package.json`:

```json
"sign": false
```

## Важливо: Проблема з winCodeSign

Якщо виникає помилка `Cannot create symbolic link` при білді, це означає, що electron-builder намагається завантажити winCodeSign, який містить macOS файли. Це не критично для Windows білду.

### Рішення:

**Варіант 1: Запустити PowerShell як Адміністратор**

- Це дозволить створити символічні посилання для macOS файлів (хоча вони не потрібні для Windows)

**Варіант 2: Використати вбудований Windows signtool**

- Встановіть Windows SDK або Visual Studio Build Tools
- Electron-builder автоматично використає вбудований signtool замість winCodeSign

**Варіант 3: Тимчасово вимкнути підпис**

- Встановіть `"sign": false` в `package.json` для тестування білду
- Підпис можна додати пізніше вручну через signtool

### Ручний підпис через signtool:

```powershell
# Після білду, підпишіть файл вручну
signtool sign /f certificate.pfx /p NFL2024 /t http://timestamp.digicert.com "dist-electron\win-unpacked\NFL Web.exe"
```

## Примітки

- Self-signed сертифікати будуть показувати попередження Windows про невідомого видавця
- Комерційні сертифікати не показують попереджень і довірені Windows
- Сертифікат має бути валідним на момент підпису
- Не зберігайте паролі сертифікатів у коді - використовуйте змінні оточення або секрети
- Для продакшену рекомендовано використовувати комерційний сертифікат
