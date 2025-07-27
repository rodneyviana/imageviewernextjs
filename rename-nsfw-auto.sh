#!/bin/bash

# Bash script to rename all *.nsfw files to *.flagged
# Automatically reads folder paths from .env file
# Runs without user interaction

echo "=== NSFW to Flagged File Renamer (Auto Mode) ==="
echo "Reading configuration from .env file..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found in current directory"
    echo "Expected .env file with FOLDERS configuration"
    exit 1
fi

# Read FOLDERS from .env file
FOLDERS=$(grep "^FOLDERS=" .env | cut -d'=' -f2 | tr -d '"')

if [ -z "$FOLDERS" ]; then
    echo "Error: Could not find FOLDERS configuration in .env file"
    echo "Expected format: FOLDERS=/path1/;/path2/;/path3/"
    exit 1
fi

# Convert semicolon-separated paths to array
IFS=';' read -ra FOLDER_ARRAY <<< "$FOLDERS"

# Remove empty elements
FOLDER_PATHS=()
for folder in "${FOLDER_ARRAY[@]}"; do
    if [ -n "$(echo "$folder" | xargs)" ]; then
        FOLDER_PATHS+=("$(echo "$folder" | xargs)")
    fi
done

if [ ${#FOLDER_PATHS[@]} -eq 0 ]; then
    echo "Error: No valid folder paths found in FOLDERS configuration"
    exit 1
fi

echo "Found ${#FOLDER_PATHS[@]} folder(s) to process:"
for folder in "${FOLDER_PATHS[@]}"; do
    echo "  $folder"
done

echo ""

# Initialize counters
total_found=0
total_renamed=0
total_failed=0

# Process each folder
for folder_path in "${FOLDER_PATHS[@]}"; do
    echo "Processing folder: $folder_path"
    
    if [ ! -d "$folder_path" ]; then
        echo "  ⚠️  Folder not found, skipping: $folder_path"
        continue
    fi
    
    # Find all .nsfw files in this folder
    nsfw_files=()
    while IFS= read -r -d '' file; do
        nsfw_files+=("$file")
    done < <(find "$folder_path" -name "*.nsfw" -type f -print0 2>/dev/null)
    
    if [ ${#nsfw_files[@]} -eq 0 ]; then
        echo "  ✓ No .nsfw files found in this folder"
        continue
    fi
    
    echo "  📁 Found ${#nsfw_files[@]} .nsfw file(s) to rename"
    total_found=$((total_found + ${#nsfw_files[@]}))
    
    # Rename files in this folder
    folder_renamed=0
    folder_failed=0
    
    for file in "${nsfw_files[@]}"; do
        # Get directory and filename without .nsfw extension
        dir=$(dirname "$file")
        basename=$(basename "$file" .nsfw)
        new_file="$dir/$basename.flagged"
        
        if mv "$file" "$new_file" 2>/dev/null; then
            echo "    ✓ $(basename "$file") → $(basename "$new_file")"
            folder_renamed=$((folder_renamed + 1))
        else
            echo "    ❌ Failed: $(basename "$file") - Permission denied or file in use"
            folder_failed=$((folder_failed + 1))
        fi
    done
    
    total_renamed=$((total_renamed + folder_renamed))
    total_failed=$((total_failed + folder_failed))
    
    echo "  📊 Folder summary: $folder_renamed renamed, $folder_failed failed"
    echo ""
done

# Final summary
echo "=== FINAL SUMMARY ==="
echo "Folders processed: ${#FOLDER_PATHS[@]}"
echo "Total .nsfw files found: $total_found"
echo "Successfully renamed: $total_renamed files"
echo "Failed to rename: $total_failed files"

if [ $total_renamed -gt 0 ]; then
    echo ""
    echo "🎉 Successfully renamed $total_renamed .nsfw files to .flagged!"
    echo "The application will now use the new .flagged extension."
fi

if [ $total_failed -gt 0 ]; then
    echo ""
    echo "⚠️  Some files could not be renamed. Common causes:"
    echo "   - Files are currently in use by another application"
    echo "   - Insufficient permissions (try running with sudo)"
    echo "   - Files are read-only"
fi

echo ""
echo "Script completed!"
