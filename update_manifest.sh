#!/bin/bash
# Scans the /songs folder and generates songs.json manifest
# Usage: ./update_manifest.sh

SONGS_DIR="songs"
OUTPUT="songs.json"

echo '{' > "$OUTPUT"
echo '  "songs": [' >> "$OUTPUT"

first=true
for dir in "$SONGS_DIR"/*/; do
  [ -d "$dir" ] || continue
  folder_name=$(basename "$dir")

  mp3_files=()
  pdf_file=""
  for f in "$dir"*; do
    fname=$(basename "$f")
    case "$fname" in
      *.mp3|*.MP3) mp3_files+=("$fname") ;;
      *.pdf|*.PDF) pdf_file="$fname" ;;
    esac
  done

  [ ${#mp3_files[@]} -eq 0 ] && continue

  if [ "$first" = true ]; then
    first=false
  else
    echo '    ,' >> "$OUTPUT"
  fi

  echo '    {' >> "$OUTPUT"
  echo "      \"name\": \"$folder_name\"," >> "$OUTPUT"
  echo "      \"folder\": \"$SONGS_DIR/$folder_name\"," >> "$OUTPUT"

  echo '      "files": [' >> "$OUTPUT"
  first_file=true
  for mp3 in "${mp3_files[@]}"; do
    if [ "$first_file" = true ]; then
      first_file=false
    else
      echo ',' >> "$OUTPUT"
    fi
    printf '        "%s"' "$mp3" >> "$OUTPUT"
  done
  echo '' >> "$OUTPUT"

  if [ -n "$pdf_file" ]; then
    echo '      ],' >> "$OUTPUT"
    echo "      \"pdf\": \"$pdf_file\"" >> "$OUTPUT"
  else
    echo '      ]' >> "$OUTPUT"
  fi

  echo -n '    }' >> "$OUTPUT"
done

echo '' >> "$OUTPUT"
echo '  ]' >> "$OUTPUT"
echo '}' >> "$OUTPUT"

echo "Generated $OUTPUT"
