#!/bin/zsh
url="$1"; out="$2"
curl -sL --http2 --max-time 40 --compressed \
 -H 'sec-ch-ua: "Chromium";v="126", "Not)A;Brand";v="24", "Google Chrome";v="126"' \
 -H 'sec-ch-ua-mobile: ?0' -H 'sec-ch-ua-platform: "macOS"' \
 -H 'Sec-Fetch-Dest: document' -H 'Sec-Fetch-Mode: navigate' -H 'Sec-Fetch-Site: none' -H 'Sec-Fetch-User: ?1' \
 -H 'Upgrade-Insecure-Requests: 1' \
 -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8' \
 -H 'Accept-Language: en-US,en;q=0.9' \
 -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' \
 -o "$out" -w "%{http_code} $(basename $out)\n" "$url"
