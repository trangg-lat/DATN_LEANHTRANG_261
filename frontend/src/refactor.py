import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'import { toast, Toaster }' not in content:
    content = content.replace('import React, { useState, useEffect } from "react";', 'import React, { useState, useEffect } from "react";\nimport { toast, Toaster } from "react-hot-toast";')

if '<Toaster' not in content:
    content = content.replace('<Router>', '<Router>\n      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />')

def rep(m):
    msg = m.group(1)
    # Check what kind of alert it is
    if 'thành công' in msg.lower():
        return f'toast.success({msg})'
    elif 'lỗi' in msg.lower() or 'không' in msg.lower() or 'vui lòng' in msg.lower():
        return f'toast.error({msg})'
    else:
        return f'toast({msg})'

# Replace alert(...)
content = re.sub(r'alert\((.*?)\);', rep, content)

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Refactored alerts to toast")
