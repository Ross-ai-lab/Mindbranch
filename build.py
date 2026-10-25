"""Check the browser code and stage only public assets for the existing host."""
from pathlib import Path
from datetime import datetime, timezone
import json
import re
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent
PREVIEW = (ROOT / '.preview').resolve()
assert PREVIEW.is_relative_to(ROOT), 'Preview directory must stay inside this project.'
PREVIEW.mkdir(exist_ok=True)
FILES = ['index.html','styles.css','body.css','data.js','art.js','engine.js',
         'app.js','body-data.js','body-engine.js','body-app.js']
for name in FILES:
    if not (ROOT/name).is_file():
        raise SystemExit('Missing browser asset: '+name)
for name in FILES:
    if name.endswith('.js'):
        subprocess.run(['node','--check',name],cwd=ROOT,check=True)
subprocess.run(['node','--test','tests/bodybranch.test.cjs'],cwd=ROOT,check=True)
stage = Path(tempfile.mkdtemp(prefix='deploy-stage-',dir=PREVIEW)).resolve()
assert stage.is_relative_to(PREVIEW)
for name in FILES:
    shutil.copy2(ROOT/name,stage/name)
for directory in ['photos','audio']:
    if (ROOT/directory).is_dir():
        shutil.copytree(ROOT/directory,stage/directory)
index = (stage/'index.html').read_text(encoding='utf-8')
for asset in re.findall(r'(?:src|href)="([^"#]+)"',index):
    if asset.startswith(('http:','https:','data:')):
        continue
    local = (stage/asset.split('?',1)[0]).resolve()
    assert local.is_relative_to(stage), 'An asset escaped the public package.'
    if not local.is_file():
        raise SystemExit('Packaged HTML points at a missing asset: '+asset)
destination = (PREVIEW/'deploy').resolve()
assert destination.is_relative_to(PREVIEW) and destination != PREVIEW
expected = {p.relative_to(stage).as_posix() for p in stage.rglob('*') if p.is_file()}
previous_manifest = PREVIEW/'deployment-manifest.json'
previous_files = set(json.loads(previous_manifest.read_text(encoding='utf-8'))['files']) if previous_manifest.exists() else set()
if destination.exists():
    existing = {p.relative_to(destination).as_posix() for p in destination.rglob('*') if p.is_file()}
    for relative in existing - expected:
        assert relative in previous_files, 'Unrecognized file in generated package: '+relative
        obsolete = (destination/relative).resolve()
        assert obsolete.is_relative_to(destination)
        backup = (PREVIEW/'deploy-previous-files'/relative).resolve()
        assert backup.is_relative_to(PREVIEW)
        backup.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(obsolete,backup)
        obsolete.unlink()
# Windows can hold a newly copied directory open while indexing it. Copying
# checked files into a generated package avoids depending on directory rename.
shutil.copytree(stage,destination,dirs_exist_ok=True)
files = sorted(p.relative_to(destination).as_posix() for p in destination.rglob('*') if p.is_file())
assert set(files) == expected, 'Public package differs from the checked stage.'
assert not any(p.startswith(('.preview/','.git/','tests/','__pycache__/','photowork/')) for p in files)
(PREVIEW/'deployment-manifest.json').write_text(json.dumps({'built':datetime.now(timezone.utc).isoformat(),'files':files},indent=2),encoding='utf-8')
print(f'Public package ready: {len(files)} files in {destination}')
