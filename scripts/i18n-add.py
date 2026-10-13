#!/usr/bin/env python3
"""Append/merge translation sections into src/i18n/{tj,ru,en}.ts.
Input JSON: { "section": { "key": ["tj", "ru", "en"], ... }, ... }
Existing sections are extended (new keys appended); existing keys are replaced."""
import json, re, sys
data = json.load(open(sys.argv[1]))
files = {"tj": 0, "ru": 1, "en": 2}
for lang, idx in files.items():
    p = f"src/i18n/{lang}.ts"; s = open(p).read()
    for sec, keys in data.items():
        m = re.search(r"\n  " + re.escape(sec) + r": \{(.*?)\},\n", s, re.S)
        body = {k: v[idx] for k, v in keys.items()}
        if m:
            inner = m.group(1)
            for k, v in body.items():
                kv = f"{k}: {json.dumps(v, ensure_ascii=False)}"
                if re.search(r"(^|[\s,{])" + re.escape(k) + r": \"", inner):
                    inner = re.sub(r"(^|[\s,{])" + re.escape(k) + r": \"(?:[^\"\\]|\\.)*\"", lambda mm: mm.group(1) + kv, inner, count=1)
                else:
                    inner = inner.rstrip() + (", " if inner.strip() else " ") + kv + " "
            s = s[:m.start(1)] + inner + s[m.end(1):]
        else:
            lines = ", ".join(f"{k}: {json.dumps(v, ensure_ascii=False)}" for k, v in body.items())
            anchor = s.rfind("\n};")
            s = s[:anchor] + f"\n  {sec}: {{ {lines} }}," + s[anchor:]
    open(p, "w").write(s)
print("ok", ", ".join(data.keys()))
