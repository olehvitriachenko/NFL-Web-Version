; Custom NSIS script for NFL Web installer
; Allows user to choose installation directory and configure options

; Вимкнути перевірку запущених процесів перед встановленням
!macro customInit
  ; Не намагатися закривати процеси автоматично
  ; Це дозволяє встановлювати навіть якщо процес "заблокований"
!macroend

; Function called after successful installation
Function .onInstSuccess
  ; Additional actions after installation can be added here
  ; For example, open the app or show a message
FunctionEnd

; Function called before installation completion on failure
Function .onInstFailed
  ; Error handling for installation can be added here
FunctionEnd

