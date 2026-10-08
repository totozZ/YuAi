from pathlib import Path
import urllib.request,zipfile,io
ROOT=Path(__file__).resolve().parent.parent
folder=ROOT/'public'/'v3'/'fonts'
folder.mkdir(parents=True,exist_ok=True)
for weight in ['Light','Regular','Bold']:
    file=folder/f'SourceHanSansSC-{weight}.otf'
    if not file.exists():
        url=f'https://raw.githubusercontent.com/adobe-fonts/source-han-sans/release/OTF/SimplifiedChinese/{file.name}'
        urllib.request.urlretrieve(url,file)
    print(file.name,flush=True)
if not (folder/'Inter-Light.otf').exists():
    request=urllib.request.Request('https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip',headers={'User-Agent':'YuAi-font-archive'})
    data=urllib.request.urlopen(request).read()
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        for weight in ['Light','Medium','Bold']:
            candidates=[n for n in archive.namelist() if n.endswith(f'/Inter-{weight}.otf')]
            if not candidates:raise ValueError('Missing static Inter OTF: '+weight)
            (folder/f'Inter-{weight}.otf').write_bytes(archive.read(candidates[0]))
        for name in archive.namelist():
            if name.endswith('OFL.txt'):(folder/'Inter-OFL.txt').write_bytes(archive.read(name));break
urllib.request.urlretrieve('https://raw.githubusercontent.com/adobe-fonts/source-han-sans/release/LICENSE.txt',folder/'SourceHanSans-OFL.txt')
if not (folder/'Inter-OFL.txt').exists():
    urllib.request.urlretrieve('https://raw.githubusercontent.com/rsms/inter/v4.1/LICENSE.txt',folder/'Inter-OFL.txt')
print('Official Source Han Sans and Inter font archives ready.',flush=True)
