"""Pack editable project without environments, model cache, or rendered MP4 files."""
from pathlib import Path
import zipfile
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'out'/'v3'
destination=OUT/'雨爱-V3-可修改工程.zip'
files=[]
for directory in ['src','scripts','public','geci']:
    files += [f for f in (ROOT/directory).rglob('*') if f.is_file() and '__pycache__' not in f.parts]
for pattern in ['package.json','package-lock.json','tsconfig.json','remotion.config.*','README*.md','.gitignore','requirements-alignment.lock.txt','*.mp3']:
    files += [f for f in ROOT.glob(pattern) if f.is_file()]
for pattern in ['*.md','*.json','*.jpg']:
    files += [f for f in OUT.glob(pattern) if f.is_file()]
files=sorted(set(files))
with zipfile.ZipFile(destination,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
    for f in files:archive.write(f,f.relative_to(ROOT))
with zipfile.ZipFile(destination) as archive:
    assert archive.testzip() is None
    for required in ['src/v3/overrides.json','src/v3/FilmV3.tsx','src/v3/glyphs.json','public/reference.mp3','public/v3/fonts/SourceHanSansSC-Light.otf','README-V3.md']:
        assert required in archive.namelist(),required
    assert not any('node_modules/' in n or '.cache/' in n or '.venv-alignment/' in n for n in archive.namelist())
print(f'Packaged {len(files)} files: {destination.name} ({destination.stat().st_size/1024**2:.1f} MB).')
