param([ValidateSet('x86_64','aarch64')][string]$Target='aarch64',[switch]$Release,[switch]$OptimizedDebug)
$ErrorActionPreference='Stop'
$workspace=Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $workspace
if(-not $env:JAVA_HOME){$env:JAVA_HOME='C:/Program Files/Android/Android Studio/jbr'}
if(-not $env:ANDROID_HOME){$env:ANDROID_HOME=Join-Path $env:LOCALAPPDATA 'Android/Sdk'}
if(-not $env:NDK_HOME){$env:NDK_HOME=(Get-ChildItem -LiteralPath (Join-Path $env:ANDROID_HOME 'ndk') -Directory | Sort-Object Name -Descending | Select-Object -First 1).FullName}
if(-not(Test-Path -LiteralPath $env:JAVA_HOME)){throw 'Set JAVA_HOME to your JDK 21+.'}
if(-not(Test-Path -LiteralPath $env:NDK_HOME)){throw 'Set NDK_HOME to an Android NDK installation.'}
& npm.cmd run build
if($LASTEXITCODE){throw 'Frontend build failed.'}
$triple="$Target-linux-android"
$abi=if($Target -eq 'aarch64'){'arm64-v8a'}else{'x86_64'}
$gradleArch=if($Target -eq 'aarch64'){'Arm64'}else{'X86_64'}
$profile=if($Release -or $OptimizedDebug){'release'}else{'debug'}
$profileName=if($Release){'Release'}else{'Debug'}
$toolchain=Join-Path $env:NDK_HOME 'toolchains/llvm/prebuilt/windows-x86_64/bin'
$linker=Join-Path $toolchain "$($Target)-linux-android24-clang.cmd"
$envName='CARGO_TARGET_'+$triple.ToUpper().Replace('-','_')+'_LINKER'
[Environment]::SetEnvironmentVariable($envName,$linker,'Process')
[Environment]::SetEnvironmentVariable('CC_'+$triple.Replace('-','_'),$linker,'Process')
[Environment]::SetEnvironmentVariable('AR_'+$triple.Replace('-','_'),(Join-Path $toolchain 'llvm-ar.exe'),'Process')
$cargoArgs=@('build','--manifest-path','src-tauri/Cargo.toml','--target',$triple,'--lib','--features','tauri/custom-protocol')
if($Release -or $OptimizedDebug){$cargoArgs+='--release'}
& cargo @cargoArgs
if($LASTEXITCODE){throw 'Rust Android build failed.'}
$jni=Join-Path $workspace "src-tauri/gen/android/app/src/main/jniLibs/$abi"
New-Item -ItemType Directory -Force -Path $jni | Out-Null
Copy-Item -LiteralPath "src-tauri/target/$triple/$profile/libflux_lib.so" -Destination (Join-Path $jni 'libflux_lib.so') -Force
Push-Location src-tauri/gen/android
try {
 & ./gradlew.bat "assemble$gradleArch$profileName" '-x' "rustBuild$gradleArch$profileName" '--no-daemon'
 if($LASTEXITCODE){throw 'Gradle assembly failed.'}
} finally {Pop-Location}
Write-Output "APK built under src-tauri/gen/android/app/build/outputs/apk/$($gradleArch.ToLower())/$($profileName.ToLower())"
