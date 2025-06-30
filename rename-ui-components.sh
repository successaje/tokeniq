#!/bin/bash

# Navigate to the UI components directory
cd "$(dirname "$0")/src/components/ui"

# Rename all .tsx files to lowercase
for file in [A-Z]*.tsx; do
  if [ -f "$file" ]; then
    # Get the lowercase version of the filename
    lowercase=$(echo "$file" | tr '[:upper:]' '[:lower:]')
    
    # Only rename if the target doesn't exist or is different
    if [ ! -e "$lowercase" ] || [ "$file" != "$lowercase" ]; then
      # If target exists, append a temporary suffix
      if [ -e "$lowercase" ]; then
        tempname="${lowercase}.temp"
        mv -v "$file" "$tempname"
        # If the target exists and is different, remove it
        if [ -e "$lowercase" ]; then
          rm -v "$lowercase"
        fi
        mv -v "$tempname" "$lowercase"
      else
        mv -v "$file" "$lowercase"
      fi
    fi
  fi
done

echo "All UI component files have been renamed to lowercase."
