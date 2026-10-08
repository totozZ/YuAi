"""Package all editable versions, fonts/media and the V3.1 inspection evidence."""
from pathlib import Path
import zipfile
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'out'/'v3.1'
destination=OUT/'雨爱-V3.1-可修改工程.zip'
files=[]
for directory in ['src','scripts','public','geci']:
    files += [f for f in (ROOT/directory).rglob('*') if f.is_file() and '__pycache__' not in f.parts]
for pattern in ['package.json','package-lock.json','tsconfig.json','remotion.config.*','README*.md','项目简介.md','.gitignore','requirements*.txt','*.mp3']:
    files += [f for f in ROOT.glob(pattern) if f.is_file()]
for pattern in ['*.md','*.json','*.jpg']:
    files += [f for f in OUT.glob(pattern) if f.is_file()]
files=sorted(set(files))
with zipfile.ZipFile(destination,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
    for f in files:archive.write(f,f.relative_to(ROOT))
with zipfile.ZipFile(destination) as archive:
    assert archive.testzip() is None
    for required in ['src/v3/scene-style.ts','src/v3/SceneBackdrop.tsx','src/v3/overrides.json','src/v3/glyphs.json','public/reference.mp3','README.md','README-V1.md','README-V3.1.md','项目简介.md']:
        assert required in archive.namelist(),required
    assert not any('node_modules/' in n or '.cache/' in n or '.venv-alignment/' in n for n in archive.namelist())
print(f'Packaged {len(files)} files: {destination.name} ({destination.stat().st_size/1024**2:.1f} MB).')
