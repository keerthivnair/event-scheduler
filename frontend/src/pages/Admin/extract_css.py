import os

filepath = r"c:\Users\USER\OneDrive\Desktop\scheduling-platform\frontend\src\pages\Admin\EventTypes.jsx"
csspath = r"c:\Users\USER\OneDrive\Desktop\scheduling-platform\frontend\src\pages\Admin\EventTypes.css"

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

css_lines = []
in_style = False
jsx_lines = []

for idx, line in enumerate(lines):
    if line.startswith("const styles = `"):
        in_style = True
        jsx_lines.append("import './EventTypes.css';\n")
        continue
    
    if in_style and line.strip() == "`;":
        in_style = False
        continue
        
    if in_style:
        css_lines.append(line)
        continue
        
    if "<style>{styles}</style>" in line:
        continue
        
    jsx_lines.append(line)

with open(csspath, 'w', encoding='utf-8') as f:
    f.writelines(css_lines)

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(jsx_lines)
