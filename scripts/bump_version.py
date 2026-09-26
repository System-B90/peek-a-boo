import json
import os
import re
from argparse import ArgumentParser
from enum import Enum
from pathlib import Path


class Version(Enum):
    MAJOR = "major"
    MINOR = "minor"
    REVISION = "revision"


BUMP_TYPES = (
    Version.MAJOR.value,
    Version.MINOR.value,
    Version.REVISION.value,
)


def get_current_version() -> str:
    package = Path(".") / "package.json"
    data = json.loads(package.read_text(encoding="UTF-8"))
    version = data["version"]
    assert isinstance(version, str)
    assert re.match(r"\d+\.\d+\.\d+", version)
    return version


def save_new_version(new_version: str) -> None:
    package = Path(".") / "package.json"
    data = json.loads(package.read_text(encoding="UTF-8"))
    assert isinstance(new_version, str)
    assert re.match(r"\d+\.\d+\.\d+", new_version)
    data["version"] = new_version
    package.write_text(json.dumps(data), encoding="UTF-8")


def main():
    parser = ArgumentParser()
    parser.add_argument(
        "version",
        choices=BUMP_TYPES,
    )
    args = parser.parse_args()
    bump = str(args.version)

    current_version = get_current_version()

    major, minor, revision = (int(x) for x in current_version.split("."))

    DISPATCH = {
        Version.MAJOR.value: major,
        Version.MINOR.value: minor,
        Version.REVISION.value: revision,
    }

    DISPATCH[bump] = DISPATCH[bump] + 1

    new_version = ".".join(str(DISPATCH[x]) for x in BUMP_TYPES)

    save_new_version(new_version)

    os.system(f"git tag v{new_version}")
    os.system(f"git push origin v{new_version}")

    print(f"Bumped from {current_version} to {new_version}")


if __name__ == "__main__":
    main()
