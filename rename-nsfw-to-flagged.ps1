# PowerShell script to rename all *.nsfw files to *.flagged
# This script will find all .nsfw files recursively and rename them to .flagged

param(
    [string]$Path = ".",
    [switch]$WhatIf = $false
)

Write-Host "Renaming NSFW files to Flagged files..." -ForegroundColor Green
Write-Host "Starting directory: $(Resolve-Path $Path)" -ForegroundColor Yellow

# Get all .nsfw files recursively
$nsfwFiles = Get-ChildItem -Path $Path -Filter "*.nsfw" -Recurse

if ($nsfwFiles.Count -eq 0) {
    Write-Host "No .nsfw files found." -ForegroundColor Yellow
    exit 0
}

Write-Host "Found $($nsfwFiles.Count) .nsfw files to rename:" -ForegroundColor Cyan

$renamed = 0
$errors = 0

foreach ($file in $nsfwFiles) {
    $oldName = $file.FullName
    $newName = $oldName -replace '\.nsfw$', '.flagged'
    
    Write-Host "  $($file.FullName)" -ForegroundColor Gray
    Write-Host "    -> $newName" -ForegroundColor Green
    
    if ($WhatIf) {
        Write-Host "    [WHATIF] Would rename to: $newName" -ForegroundColor Magenta
        $renamed++
    } else {
        try {
            Rename-Item -Path $oldName -NewName (Split-Path $newName -Leaf) -ErrorAction Stop
            Write-Host "    [SUCCESS] Renamed successfully" -ForegroundColor Green
            $renamed++
        } catch {
            Write-Host "    [ERROR] Failed to rename: $($_.Exception.Message)" -ForegroundColor Red
            $errors++
        }
    }
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Files processed: $($nsfwFiles.Count)" -ForegroundColor White
Write-Host "  Successfully renamed: $renamed" -ForegroundColor Green
Write-Host "  Errors: $errors" -ForegroundColor Red

if ($WhatIf) {
    Write-Host ""
    Write-Host "This was a dry run. Use the script without -WhatIf to actually rename files." -ForegroundColor Magenta
}

Write-Host ""
Write-Host "Script completed!" -ForegroundColor Green
