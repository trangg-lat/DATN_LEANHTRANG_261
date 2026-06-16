with open('App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    if '<TopHeader user={user} onProfileClick={() => setShowProfile(true)} />' in line and i < 270:
        # skip rendering TopHeader at the root level
        i += 1
        continue
    
    if '{/* --- NỘI DUNG CHÍNH --- */}' in line:
        # inject main-wrapper and TopHeader
        new_lines.append('            <div className="main-wrapper">\n')
        new_lines.append('              <TopHeader user={user} onProfileClick={() => setShowProfile(true)} />\n')
        new_lines.append(line)
        i += 1
        continue

    if '</main>' in line:
        # close main-wrapper
        new_lines.append(line)
        new_lines.append('            </div>\n')
        i += 1
        continue
        
    new_lines.append(line)
    i += 1

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
    
print("Fixed App.jsx layout")
