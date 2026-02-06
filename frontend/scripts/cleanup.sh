#!/bin/bash

# Remove macOS metadata files
find . -name ".DS_Store" -depth -exec rm {} \;
find . -name "__MACOSX" -type d -exec rm -rf {} \;
find . -name "._*" -depth -exec rm {} \;

echo "Cleanup complete. macOS metadata files removed."
