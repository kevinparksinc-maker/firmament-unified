import shutil, datetime, sys

path = "client/src/lib/astroEngine.ts"
backup = f"{path}.bak.{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
shutil.copy(path, backup)
print(f"Backup created: {backup}")
print("(This script only edits client/src/lib/astroEngine.ts. Nothing else is touched.)")

with open(path, "r") as f:
    content = f.read()

edits_applied = 0

def apply_edit(label, old, new):
    global content, edits_applied
    count = content.count(old)
    if count != 1:
        print(f"ABORTING at '{label}': expected exactly 1 match, found {count}. No further changes made.")
        with open(path, "w") as f:
            f.write(content)
        print(f"Partial progress saved ({edits_applied} edit(s) applied before this one). Original is in the backup if you need to revert.")
        sys.exit(1)
    content = content.replace(old, new)
    edits_applied += 1
    print(f"Applied: {label}")

# Edit 1 — header comment accuracy
apply_edit(
    "header comment",
    "// Sidereal framework · Traditional Vedic planetary rulers · No outer planet weight",
    "// Sidereal framework · Traditional Vedic planetary rulers · Outer planets weighted"
)

# Edit 2 — glyphs
apply_edit(
    "PLANET_GLYPHS",
    '''  Saturn: "♄",
  Rahu: "☊",''',
    '''  Saturn: "♄",
  Uranus: "⛢",
  Neptune: "♆",
  Pluto: "♇",
  Rahu: "☊",'''
)

# Edit 3 — priority weights
apply_edit(
    "PRIORITY weights",
    '''  Jupiter: 4,
  Rahu: 3.5,''',
    '''  Jupiter: 4,
  Pluto: 4.5,
  Neptune: 3.8,
  Uranus: 3.5,
  Rahu: 3.5,'''
)

# Edit 4 — PLANET_CORE symbolism
apply_edit(
    "PLANET_CORE symbolism",
    '''  Ketu: {
    mind: "detachment, fragmentation, abstraction, psychic static",
    soul: "disinterest, release, past-life familiarity, severance",
    spirit: "liberation, negation, moksha impulse",
  },
};''',
    '''  Ketu: {
    mind: "detachment, fragmentation, abstraction, psychic static",
    soul: "disinterest, release, past-life familiarity, severance",
    spirit: "liberation, negation, moksha impulse",
  },
  Uranus: {
    mind: "pattern disruption, sudden insight, refusal of inherited frameworks",
    soul: "restlessness that cannot settle until the authentic self is expressed — the hunger to break what no longer fits",
    spirit:
      "awakening, liberation through disruption, the lightning that cracks the old structure open",
  },
  Neptune: {
    mind: "dissolution of boundaries, impressionability, thinking in images and felt senses rather than logic",
    soul: "longing for the infinite, the grief of not quite belonging to ordinary reality, compassion that has no edges",
    spirit:
      "mystical receptivity, union with something larger than self, the tide that erases the line between here and everywhere",
  },
  Pluto: {
    mind: "compulsive excavation, the mind that cannot stop going deeper, psychological penetration",
    soul: "the part of the self that has already been through the fire — desire for total transformation, not surface change",
    spirit:
      "death and rebirth as a living process, power that has been earned through loss, the seed that only germinates in the dark",
  },
};'''
)

# Edit 5 — scorePillar transit scoring branches
apply_edit(
    "scorePillar transit scoring",
    '''    } else if (p === "Moon") {
      score += hard ? -1 : 1;
      reasons.push(
        `Transit Moon is coloring the day around natal ${act.natalPlanet}.`
      );
    }
  }''',
    '''    } else if (p === "Moon") {
      score += hard ? -1 : 1;
      reasons.push(
        `Transit Moon is coloring the day around natal ${act.natalPlanet}.`
      );
    } else if (p === "Pluto") {
      score += hard ? -11 : conj ? -10 : -6;
      reasons.push(
        `Transit Pluto is forcing deep transformation around natal ${act.natalPlanet} by ${act.aspect}.`
      );
    } else if (p === "Neptune") {
      score += hard ? -7 : conj ? -5 : -3;
      reasons.push(
        `Transit Neptune is dissolving clarity around natal ${act.natalPlanet} by ${act.aspect}.`
      );
    } else if (p === "Uranus") {
      score += hard ? -8 : conj ? -4 : 3;
      reasons.push(
        `Transit Uranus is disrupting and awakening natal ${act.natalPlanet} by ${act.aspect}.`
      );
    }
  }'''
)

with open(path, "w") as f:
    f.write(content)

print(f"\nAll {edits_applied} edits applied successfully to client/src/lib/astroEngine.ts.")
print("FirmamentEngine.tsx and server/astroEngine.ts were not touched.")
