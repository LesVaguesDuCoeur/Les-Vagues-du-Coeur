import re

with open('index.html', 'r') as f:
    html = f.read()

# Make pdfjsLib globally available by switching to the non-mjs UMD build for pdf.js, or by importing it explicitly.
# The prompt specified: https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.min.mjs
# To make pdfjsLib available globally from an MJS file, we can either import it in pdf-engine.js or attach it to window in index.html.

html = html.replace(
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.min.mjs" type="module"></script>',
    '<script type="module">\n    import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.min.mjs";\n    window.pdfjsLib = pdfjsLib;\n  </script>'
)

with open('index.html', 'w') as f:
    f.write(html)
