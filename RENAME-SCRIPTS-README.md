# PowerShell Scripts for Renaming NSFW Files

This directory contains PowerShell scripts to rename all `.nsfw` files to `.flagged` files throughout the project directory tree.

## Scripts Available

### 1. `rename-nsfw-to-flagged.ps1` (Advanced)
Full-featured script with parameters and options.

**Usage:**
```powershell
# Basic usage (current directory)
.\rename-nsfw-to-flagged.ps1

# Specify different path
.\rename-nsfw-to-flagged.ps1 -Path "C:\path\to\directory"

# Dry run (see what would be renamed without actually doing it)
.\rename-nsfw-to-flagged.ps1 -WhatIf

# Dry run with specific path
.\rename-nsfw-to-flagged.ps1 -Path "C:\path\to\directory" -WhatIf
```

### 2. `rename-nsfw-simple.ps1` (Simple)
Interactive script that prompts for confirmation.

**Usage:**
```powershell
# Run the script and follow prompts
.\rename-nsfw-simple.ps1
```

## What These Scripts Do

1. **Search**: Recursively find all files with `.nsfw` extension
2. **List**: Show all files that will be renamed
3. **Rename**: Change extension from `.nsfw` to `.flagged`
4. **Report**: Provide summary of successful and failed operations

## Example

If you have files like:
- `image1.jpg.nsfw`
- `document.pdf.nsfw` 
- `photo.png.nsfw`

They will be renamed to:
- `image1.jpg.flagged`
- `document.pdf.flagged`
- `photo.png.flagged`

## Safety Features

- **Preview mode**: Use `-WhatIf` parameter to see what would be renamed
- **Confirmation**: Simple script asks for confirmation before proceeding
- **Error handling**: Scripts report any files that couldn't be renamed
- **Relative paths**: Output shows paths relative to current directory

## Requirements

- Windows PowerShell 5.1 or PowerShell Core 6+
- Appropriate file system permissions to rename files

## Running the Scripts

1. Open PowerShell as Administrator (recommended)
2. Navigate to the project root directory
3. Run one of the scripts:
   ```powershell
   .\rename-nsfw-simple.ps1
   ```

## Troubleshooting

- **"Execution policy"** error: Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- **"Access denied"** error: Run PowerShell as Administrator
- **"File in use"** error: Close any applications that might be using the files
