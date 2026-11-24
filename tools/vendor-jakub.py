#!/usr/bin/env python3
"""Verify a vendored snapshot, compare it to Git, or stage a replacement in a new directory."""
import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT = ROOT / "vendor" / "jakub"
REPO = "https://github.com/jakubkrehel/skills"
CURRENT = "672ae44ace6aaed65b86cbb1e2fd6fbea0e79578"
HISTORICAL = "16a6eb87b96479964d6686efc78ac6d29fba22aa"
ORCHESTRATOR = "technical-drawing"


def hash_record(data):
    git_object = f"blob {len(data)}\0".encode() + data
    return {"sha256": hashlib.sha256(data).hexdigest(), "gitBlob": hashlib.sha1(git_object).hexdigest()}


def git(repo, *args):
    return subprocess.check_output(["git", "-C", str(repo), *args])


def tree(repo, ref):
    entries = []
    for line in git(repo, "ls-tree", "-r", "-z", ref).split(b"\0"):
        if not line:
            continue
        meta, filename = line.split(b"\t", 1)
        mode, kind, oid = meta.decode().split()
        if (mode, kind) != ("100644", "blob"):
            raise ValueError(f"Unsupported upstream entry {filename!r}: {mode} {kind}")
        entries.append((filename.decode("utf-8"), oid))
    return entries


def snapshot(repo, current):
    skills = []
    data = {}
    licenses = []
    current_names = git(repo, "ls-tree", "-d", "--name-only", f"{current}:skills").decode().splitlines()
    sources = [(name, "current", current) for name in current_names]
    if ORCHESTRATOR not in current_names:
        sources.append((ORCHESTRATOR, "historical", HISTORICAL))
    for name, revision, commit in sources:
        if not re.fullmatch(r"[a-z0-9-]+", name):
            raise ValueError(f"Unsafe skill directory {name!r}")
        directory = f"skills/{name}"
        ref = f"{commit}:{directory}"
        files = []
        for filename, oid in tree(repo, ref):
            content = git(repo, "cat-file", "blob", oid)
            data[directory + "/" + filename] = content
            files.append({"path": filename, **hash_record(content)})
        if not any(f["path"] == "SKILL.md" for f in files):
            raise ValueError(f"Missing SKILL.md in {directory}")
        skills.append({"name": name, "revision": revision, "commit": commit, "directory": directory,
                       "entry": directory + "/SKILL.md", "tree": git(repo, "rev-parse", ref).decode().strip(),
                       "files": files})
    for commit in dict.fromkeys(s["commit"] for s in skills):
        content = git(repo, "cat-file", "blob", f"{commit}:LICENSE")
        path = "LICENSE" if commit == current or content == data["LICENSE"] else "LICENSE-" + commit
        data[path] = content
        licenses.append({"commit": commit, "path": path, **hash_record(content)})
    manifest = {"schemaVersion": 1, "repository": REPO, "currentCommit": current, "orchestrator": ORCHESTRATOR,
                "skills": skills, "licenses": licenses}
    return manifest, data


def verify(directory, manifest):
    required = {"manifest.json"}
    for skill in manifest["skills"]:
        for file in skill["files"]:
            name = skill["directory"] + "/" + file["path"]
            verify_file(directory, name, file)
            required.add(name)
    for item in manifest["licenses"]:
        verify_file(directory, item["path"], item)
        required.add(item["path"])
    actual = {p.relative_to(directory).as_posix() for p in directory.rglob("*") if p.is_file() or p.is_symlink()}
    if required != actual:
        raise ValueError(f"Snapshot inventory differs: {sorted(required ^ actual)}")


def verify_file(directory, name, record):
    path = directory / name
    if path.is_symlink() or not path.resolve().is_relative_to(directory.resolve()):
        raise ValueError(f"Unsafe snapshot path {name}")
    digests = hash_record(path.read_bytes())
    if any(record[k] != v for k, v in digests.items()):
        raise ValueError(f"Snapshot bytes differ: {name}")


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--source", type=Path, help="Local clone of the public upstream repository")
    cli.add_argument("--current", default=CURRENT, help="Full Git commit to use with --source")
    cli.add_argument("--directory", type=Path, default=DEFAULT, help="Snapshot to check")
    cli.add_argument("--stage", type=Path, help="Write a replacement to a new directory, requires --source")
    args = cli.parse_args()
    if not re.fullmatch("[0-9a-f]{40}", args.current):
        cli.error("--current must be a full Git commit")
    if args.stage and not args.source:
        cli.error("--stage requires --source")
    directory = args.stage or args.directory
    if args.source:
        original, data = snapshot(args.source, args.current)
    if args.stage:
        directory.mkdir(parents=True, exist_ok=False)
        for name, content in data.items():
            path = directory / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
        (directory / "manifest.json").write_bytes((json.dumps(original, indent=2, ensure_ascii=False) + "\n").encode())
    manifest = json.loads((directory / "manifest.json").read_bytes())
    if args.source and manifest != original:
        raise ValueError("Manifest differs from upstream Git trees, blobs, license or inventory")
    verify(directory, manifest)
    n = sum(len(s["files"]) for s in manifest["skills"])
    print(f"Verified {len(manifest['skills'])} skills and {n} original files at {manifest['currentCommit']}")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        sys.exit(str(error))
