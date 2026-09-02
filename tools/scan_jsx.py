#!/usr/bin/env python3
"""Scan tous les .jsx du front : identifiants JSX/hooks utilisés vs imports présents."""
import re, os, sys

SRC = os.path.expanduser("~/Bureau/EmspCLub/frontend/src")

# Identifiants JSX légitimes sans import (HTML/SVG + composants définis localement gérés plus bas)
HTML_TAGS = {"div","span","p","a","img","ul","ol","li","table","thead","tbody","tr","td","th",
             "h1","h2","h3","h4","h5","h6","form","input","button","label","select","option",
             "svg","path","circle","rect","line","g","defs","stop","linearGradient","br","hr",
             "small","strong","em","b","i","section","header","footer","nav","main","video",
             "source","iframe","style","canvas","textarea","pre","code"}

HOOKS = ["useState","useRef","useEffect","useMemo","useCallback","useContext","useReducer",
         "useLayoutEffect","useId","useScroll","useTransform","useSpring","useInView",
         "useMotionValue","useAnimate","AnimatePresence","motion","LayoutGroup"]

def check_file(path):
    with open(path, encoding="utf-8") as f:
        src = f.read()
    if not src.strip():
        return []

    # imports du fichier
    imports = set()
    for m in re.finditer(r"import\s+(?:type\s+)?(?:\*\s+as\s+\w+|(\{[^}]*\})|\w+)\s+from\s+['\"][^'\"]+['\"]", src):
        if m.group(1):
            for part in m.group(1).split(","):
                part = part.strip().split(" as ")[-1].strip()
                if part:
                    imports.add(part)
        else:
            names = re.findall(r"\w+", m.group(0))
            imports.update(names)
    for m in re.finditer(r"import\s+(?:type\s+)?\{([^}]*)\}\s*from", src):
        for part in m.group(1).split(","):
            part = part.strip().split(" as ")[-1].strip()
            if part:
                imports.add(part)
    # exports de composants définis localement
    for m in re.finditer(r"(?:function|const|class)\s+([A-Z]\w+)", src):
        imports.add(m.group(1))

    problemes = []

    # hooks / framer utilisés en appel
    for h in HOOKS:
        if re.search(rf"\b{h}\s*[\(\.\<]", src) and h not in imports:
            problemes.append(h)

    # composants JSX capitalisés
    for m in re.finditer(r"<([A-Z]\w+)[\s/>]", src):
        ident = m.group(1)
        if ident not in imports:
            problemes.append(ident)

    return sorted(set(problemes))

bad = 0
for root, dirs, files in os.walk(SRC):
    dirs[:] = [d for d in dirs if d != "node_modules"]
    for fn in files:
        if not fn.endswith(".jsx"):
            continue
        path = os.path.join(root, fn)
        probs = check_file(path)
        if probs:
            bad += 1
            rel = os.path.relpath(path, SRC)
            print(f"❌ {rel} : {', '.join(probs)}")

print(f"\n{'Aucun autre problème détecté ✅' if bad == 0 else f'{bad} fichier(s) à corriger'}")
