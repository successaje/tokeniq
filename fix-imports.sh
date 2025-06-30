#!/bin/bash

# Change to the components directory
cd "$(dirname "$0")/src/components/ui"

# Rename all .tsx files to lowercase
for file in *.tsx; do
  # Convert filename to lowercase
  newname=$(echo "$file" | tr '[:upper:]' '[:lower:]')
  # Skip if the filename is already lowercase
  if [ "$file" != "$newname" ]; then
    # Rename the file to lowercase
    mv "$file" "$newname"
    echo "Renamed $file to $newname"
  fi
done

echo "All component files have been renamed to lowercase."
