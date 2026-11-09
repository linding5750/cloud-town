"""把 index.html、样式和脚本合成一个文件，生成 dist/cloud-town.html。

这个文件不带 <html>/<head>/<body>，正好符合网页发布的要求；
平时本地玩直接双击 index.html 就行，不需要运行这个脚本。
用法：python tools/build.py
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
html = (ROOT / "index.html").read_text(encoding="utf-8")
body = html.split("<!-- BODY START -->")[1].split("<!-- BODY END -->")[0].strip()
css = (ROOT / "css" / "style.css").read_text(encoding="utf-8")
scripts = re.findall(r'<script src="(js/[^"]+)"></script>', html)
js = "\n".join((ROOT / s).read_text(encoding="utf-8") for s in scripts)
if "</script" in js.lower():
    raise SystemExit("脚本里出现了 </script，无法内联")

out = f'<meta charset="utf-8">\n<title>云朵小镇</title>\n<style>\n{css}\n</style>\n{body}\n<script>\n{js}\n</script>\n'
dist = ROOT / "dist"
dist.mkdir(exist_ok=True)
(dist / "cloud-town.html").write_text(out, encoding="utf-8")
print(f"dist/cloud-town.html  {len(out.encode('utf-8')) / 1024:.0f} KB  ({len(scripts)} scripts)")
