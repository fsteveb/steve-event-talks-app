import xml.etree.ElementTree as ET
import urllib.request
import re

url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

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
            'body': html_body
        })
    if not items:
        items.append({
            'type': 'Update',
            'body': content_html.strip()
        })
    return items

try:
    response = urllib.request.urlopen(url)
    xml_data = response.read()
    
    root = ET.fromstring(xml_data)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    entries = root.findall('atom:entry', ns)
    
    for i, entry in enumerate(entries[:3]):
        title = entry.find('atom:title', ns).text
        content_elem = entry.find('atom:content', ns)
        content_html = content_elem.text if content_elem is not None else ""
        
        print(f"\nEntry {i+1}: {title}")
        parsed_items = parse_html_content(content_html)
        for item in parsed_items:
            print(f"  Type: [{item['type']}]")
            print(f"  Body (first 100 chars): {item['body'][:100]}...")
            
except Exception as e:
    print("Error:", e)
