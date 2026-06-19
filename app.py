from flask import Flask, jsonify, render_template, request
import xml.etree.ElementTree as ET
import urllib.request
import re
import time

app = Flask(__name__)

# Cache configuration
CACHE_TIMEOUT = 300  # 5 minutes
_cache = {
    "data": None,
    "timestamp": 0
}

def strip_html(html_str):
    # Strip HTML tags
    text = re.sub(r'<[^>]+>', '', html_str)
    # Replace HTML entities
    text = text.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    # Normalize whitespaces
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def parse_html_content(content_html):
    matches = list(re.finditer(r'<h3>([^<]+)</h3>', content_html))
    items = []
    for idx, match in enumerate(matches):
        type_str = match.group(1).strip()
        start = match.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(content_html)
        html_body = content_html[start:end].strip()
        items.append({
            'type': type_str,
            'body_html': html_body,
            'body_text': strip_html(html_body)
        })
    if not items:
        items.append({
            'type': 'Update',
            'body_html': content_html.strip(),
            'body_text': strip_html(content_html)
        })
    return items

def fetch_and_parse_feed():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    )
    
    with urllib.request.urlopen(req) as response:
        xml_data = response.read()
        
    root = ET.fromstring(xml_data)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    entries = root.findall('atom:entry', ns)
    parsed_entries = []
    
    for entry in entries:
        date_str = entry.find('atom:title', ns).text
        updated = entry.find('atom:updated', ns).text
        
        link_elem = entry.find("atom:link[@rel='alternate']", ns)
        link = link_elem.attrib.get('href') if link_elem is not None else ""
        
        id_str = entry.find('atom:id', ns).text
        
        content_elem = entry.find('atom:content', ns)
        content_html = content_elem.text if content_elem is not None else ""
        
        sub_items = parse_html_content(content_html)
        for idx, item in enumerate(sub_items):
            parsed_entries.append({
                'id': f"{id_str}_{idx}",
                'date': date_str,
                'updated': updated,
                'link': link,
                'type': item['type'],
                'body_html': item['body_html'],
                'body_text': item['body_text']
            })
            
    return parsed_entries

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    current_time = time.time()
    
    if force_refresh or _cache["data"] is None or (current_time - _cache["timestamp"] > CACHE_TIMEOUT):
        try:
            data = fetch_and_parse_feed()
            _cache["data"] = data
            _cache["timestamp"] = current_time
        except Exception as e:
            # If fetch fails, return cached data if available, otherwise return error
            if _cache["data"] is not None:
                return jsonify({
                    "status": "warning",
                    "message": f"Failed to fetch fresh data: {str(e)}. Displaying cached data.",
                    "notes": _cache["data"]
                })
            return jsonify({
                "status": "error",
                "message": f"Failed to fetch release notes: {str(e)}"
            }), 500
            
    return jsonify({
        "status": "success",
        "notes": _cache["data"]
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
