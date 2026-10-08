"""Package editable source, supplied media, art, fonts and inspection evidence."""
from pathlib import Path
import zipfile
import json
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'out'/'v2'
destination=OUT/'雨爱-V2-可修改工程.zip'
files=[]
for directory in ['src','scripts','public','geci']:
    for file in (ROOT/directory).rglob('*'):
        if file.is_file() and '__pycache__' not in file.parts:files.append(file)
for pattern in ['package.json','package-lock.json','tsconfig.json','remotion.config.*','README*.md','.gitignore','requirements-alignment.lock.txt','*.mp3']:
    files.extend(p for p in ROOT.glob(pattern) if p.is_file())
for pattern in ['*.md','*.json','*.jpg','keyframes/*.png']:
    files.extend(p for p in OUT.glob(pattern) if p.is_file())
files=sorted(set(files))
with zipfile.ZipFile(destination,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
    for file in files:archive.write(file,file.relative_to(ROOT))
with zipfile.ZipFile(destination) as archive:
    corrupt=archive.testzip()
    if corrupt:raise ValueError(f'Archive CRC failed: {corrupt}')
    assert 'src/v2/word-timing.json' in archive.namelist()
    assert 'public/v2/fonts/SourceHanSerifSC-Light.otf' in archive.namelist()
    assert 'public/v2/art/06-spectrum.png' in archive.namelist()
    assert not any('.venv-alignment/' in f or 'node_modules/' in f or '.cache/' in f for f in archive.namelist())
print(f'Packaged {len(files)} files: {destination.name} ({destination.stat().st_size/1024**2:.1f} MB).')
