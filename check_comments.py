import os
import re

def check_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    issues = []

    if path.endswith('.js'):
        if re.search(r'//.*', content):
            issues.append('Single line comment')
        if re.search(r'/\*.*?\*/', content, re.DOTALL):
            issues.append('Multi line comment')

    if path.endswith('.html'):
        if re.search(r'<!--.*?-->', content, re.DOTALL):
            issues.append('HTML comment')

    if path.endswith('.css'):
        if re.search(r'/\*.*?\*/', content, re.DOTALL):
            issues.append('CSS comment')

    return issues

has_issues = False
for root, _, files in os.walk('netlify'):
    for file in files:
        if file.endswith(('.js', '.html', '.css')):
            path = os.path.join(root, file)
            issues = check_file(path)
            if issues:
                print(f"{path}: {issues}")
                has_issues = True

if not has_issues:
    print("No comments found!")
