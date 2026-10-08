Unicode true
RequestExecutionLevel user
SetCompressor /SOLID lzma

Name "Smart Market OS"
OutFile "Smart Market OS Portable.exe"
Icon "src-tauri\icons\icon.ico"
SilentInstall silent

Section
  ; Output directory for portable edition
  SetOutPath "$LOCALAPPDATA\SmartMarketPortable"

  ; Main application executable
  File "src-tauri\target\release\smartmarket.exe"

  ; Resources (includes bundled node.exe and server)
  SetOutPath "$LOCALAPPDATA\SmartMarketPortable\resources"
  File /r "src-tauri\target\release\resources\*.*"

  ; Launch application and wait until closed
  SetOutPath "$LOCALAPPDATA\SmartMarketPortable"
  ExecWait '"$LOCALAPPDATA\SmartMarketPortable\smartmarket.exe"'
SectionEnd
