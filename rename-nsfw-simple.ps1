# PowerShell script to rename all *.nsfw files to *.flagged
# Automatically reads folder paths from .env file
# Runs without user interaction

Write-Host "=== NSFW to Flagged File Renamer (Auto Mode) ===" -ForegroundColor Green
Write-Host "Reading configuration from .env file..." -ForegroundColor Yellow

# Function to read .env file
function Read-EnvFile {
    param([string]$FilePath)
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "Error: .env file not found at $FilePath" -ForegroundColor Red
        return $null
    }
    
    $envVars = @{}
    Get-Content $FilePath | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)\s*=\s*(.*)\s*$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"')
            $envVars[$key] = $value
        }
    }
    return $envVars
}

# Read .env file
$envPath = ".env"
$envVars = Read-EnvFile -FilePath $envPath

if (-not $envVars -or -not $envVars.ContainsKey("FOLDERS")) {
    Write-Host "Error: Could not find FOLDERS configuration in .env file" -ForegroundColor Red
    Write-Host "Expected format: FOLDERS=/path1/;/path2/;/path3/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Parse folder paths
$folderPaths = $envVars["FOLDERS"] -split ';' | Where-Object { $_.Trim() -ne "" }

if ($folderPaths.Count -eq 0) {
    Write-Host "Error: No valid folder paths found in FOLDERS configuration" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Found $($folderPaths.Count) folder(s) to process:" -ForegroundColor Cyan
foreach ($folder in $folderPaths) {
    Write-Host "  $folder" -ForegroundColor Gray
}

Write-Host ""

# Process each folder
$totalFound = 0
$totalRenamed = 0
$totalFailed = 0

foreach ($folderPath in $folderPaths) {
    $cleanPath = $folderPath.Trim()
    
    Write-Host "Processing folder: $cleanPath" -ForegroundColor Yellow
    
    if (-not (Test-Path $cleanPath)) {
        Write-Host "  ⚠️  Folder not found, skipping: $cleanPath" -ForegroundColor Yellow
        continue
    }
    
    # Find all .nsfw files in this folder
    try {
        $nsfwFiles = Get-ChildItem -Path $cleanPath -Filter "*.nsfw" -Recurse -File -ErrorAction Stop
    } catch {
        Write-Host "  ❌ Error accessing folder: $($_.Exception.Message)" -ForegroundColor Red
        continue
    }
    
    if ($nsfwFiles.Count -eq 0) {
        Write-Host "  ✓ No .nsfw files found in this folder" -ForegroundColor Green
        continue
    }
    
    Write-Host "  📁 Found $($nsfwFiles.Count) .nsfw file(s) to rename" -ForegroundColor Cyan
    $totalFound += $nsfwFiles.Count
    
    # Rename files in this folder
    $folderRenamed = 0
    $folderFailed = 0
    
    foreach ($file in $nsfwFiles) {
        $oldPath = $file.FullName
        $directory = $file.Directory.FullName
        $nameWithoutExtension = [System.IO.Path]::GetFileNameWithoutExtension($file.Name -replace '\.nsfw$', '')
        $newName = "$nameWithoutExtension.flagged"
        $newPath = Join-Path $directory $newName
        
        try {
            Rename-Item -Path $oldPath -NewName $newName -ErrorAction Stop
            Write-Host "    ✓ $($file.Name) → $newName" -ForegroundColor Green
            $folderRenamed++
        } catch {
            Write-Host "    ❌ Failed: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
            $folderFailed++
        }
    }
    
    $totalRenamed += $folderRenamed
    $totalFailed += $folderFailed
    
    Write-Host "  📊 Folder summary: $folderRenamed renamed, $folderFailed failed" -ForegroundColor White
    Write-Host ""
}

# Final summary
Write-Host "=== FINAL SUMMARY ===" -ForegroundColor Yellow
Write-Host "Folders processed: $($folderPaths.Count)" -ForegroundColor White
Write-Host "Total .nsfw files found: $totalFound" -ForegroundColor White
Write-Host "Successfully renamed: $totalRenamed files" -ForegroundColor Green
Write-Host "Failed to rename: $totalFailed files" -ForegroundColor Red

if ($totalRenamed -gt 0) {
    Write-Host ""
    Write-Host "🎉 Successfully renamed $totalRenamed .nsfw files to .flagged!" -ForegroundColor Green
    Write-Host "The application will now use the new .flagged extension." -ForegroundColor Green
}

if ($totalFailed -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Some files could not be renamed. Common causes:" -ForegroundColor Yellow
    Write-Host "   - Files are currently in use by another application" -ForegroundColor Gray
    Write-Host "   - Insufficient permissions" -ForegroundColor Gray
    Write-Host "   - Files are read-only" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Script completed!" -ForegroundColor Green
