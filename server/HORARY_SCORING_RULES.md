# Horary Scoring Rules for Sports Prediction

## Overview
This document defines the complete rule set for evaluating sports horary charts. The AI reads the chart data and applies these rules to generate a prediction.

**Core principle:** Territory (where power operates) > Dignity (what the planet is). Ascendant side (favorite) is more vulnerable to self-sabotage than Descendant side (underdog).

---

## 1. HOUSE EVALUATION

### 1.1 House Lords
Each house is ruled by a planet (based on the zodiac sign on the cusp).

**Dignity Scoring (sign):**
- Exalted in sign: +2 points
- Own sign (domicile): +1 point
- Peregrine (no dignity): 0 points
- Detriment (opposite of own sign): -1 point
- Fall in sign: -2 points

**Territory Scoring (house placement):**
For SIDE A (Ascendant/Favorite, houses 1, 3, 6, 10, 11):
- Lord in own cluster (A houses): +2 points
- Lord in opponent cluster (B houses): -3 points

For SIDE B (Descendant/Underdog, houses 4, 5, 7, 9, 12):
- Lord in own cluster (B houses): +2 points
- Lord in opponent cluster (A houses): -3 points

**House Type Bonus (where lord currently sits):**
- Angular house (1, 4, 7, 10): +1 point
- Succedent house (2, 5, 8, 11): 0 points
- Cadent house (3, 6, 9, 12): -1 point

**Planets IN the house:**
- Benefic planet (Venus, Jupiter) in house: +1 point
- Malefic planet (Mars, Saturn) in house: -1 point

### 1.2 Aspects to House Lord
Check all planet-to-planet aspects within orbs (Conjunction 8°, Sextile 6°, Square 8°, Trine 8°, Opposition 8°).

**Benefic aspects (benefic planets):**
- Conjunction/Trine/Sextile from benefic: +1 point each

**Malefic aspects (malefic planets):**
- Conjunction from malefic: -1 point
- Square/Opposition from malefic: -1 point each

---

## 2. ARABIC LOTS SCORING

**All 8 lots are calculated.** Score based on placement and side.

### Lot of Fortune
- In Ascendant cluster (A houses): +1 point for Side A
- In Descendant cluster (B houses): +1 point for Side B
- In neutral houses (2, 8): 0 points
- Meaning: Overall luck, favorable outcomes

### Lot of Spirit
- In Ascendant cluster: +1 point for Side A (willpower, execution)
- In Descendant cluster: +1 point for Side B (competitive drive)
- Meaning: Internal drive, ability to execute

### Lot of Victory
- In Ascendant cluster: +2 points for Side A (winning is their domain)
- In Descendant cluster: +1 point for Side B (victory accessible but harder)
- In neutral houses: 0 points (outcome undecided)
- Meaning: Where winning happens

### Lot of Success
- In Ascendant cluster: +1.5 points for Side A
- In Descendant cluster: +1.5 points for Side B
- Meaning: Achieving objectives, successful execution

### Lot of Courage
- In Ascendant cluster: +1 point for Side A (own courage)
- In Descendant cluster: +1 point for Side B (underdog courage)
- Meaning: Fighting spirit, pressure handling

### Lot of Triumph
- In Ascendant cluster: +2 points for Side A (decisive wins)
- In Descendant cluster: +1.5 points for Side B (upset wins)
- Meaning: Decisive victory, momentum

### Lot of Glory
- In Ascendant cluster: +1.5 points for Side A (recognition as expected)
- In Descendant cluster: +2 points for Side B (shocking recognition)
- Meaning: Standout performance, being noticed

### Lot of Nemesis
**CRITICAL DISTINCTION: Nemesis affects Ascendant and Descendant differently.**

**If in Ascendant cluster (A houses):**
- Angular (1, 10): -3 points (catastrophic self-sabotage)
- Succedent (2, 11): -2 points (persistent internal weakness)
- Cadent (3, 6): -1 point (manageable but present)

**If in Descendant cluster (B houses):**
- Angular (4, 7): +1 point (empowering challenge, fuel)
- Succedent (5): +0.5 points (growth through adversity)
- Cadent (9, 12): +0.25 points (weak but survivable)

**If in neutral houses (2, 8):** 0 points

Meaning: Obstacles, self-sabotage, bad breaks (but underdog thrives on adversity)

---

## 3. FIXED STARS SCORING

**Active stars trigger when conjunct a planet within orb.**

### Regulus (Leo 29°43', orb 1.0°)
- Meaning: Kingship, honor, victory, championship potential
- Nature: Benefic
- If conjunct Ascendant lord: +2 points to Ascendant side
- If conjunct Descendant lord: +1.5 points to Descendant side
- If conjunct personal planets (Sun, Moon, Mars): +1 point to that planet's side

### Spica (Virgo 23°50', orb 1.0°)
- Meaning: Fortune, gifts, protection, lucky breaks
- Nature: Benefic
- Same scoring as Regulus (+2 / +1.5 / +1)

### Aldebaran (Taurus 9°47', orb 0.8°)
- Meaning: Courage, military honor, aggression, fighting spirit
- Nature: Benefic (for competition)
- If conjunct Mars: +1.5 points (amplifies aggression)
- If conjunct Ascendant lord: +1.5 points
- If conjunct Descendant lord: +1 point

### Antares (Scorpio 26°26', orb 1.0°)
- Meaning: Intense battles, conquest, high-risk/high-reward, comeback energy
- Nature: Malefic (but beneficial for underdogs in comebacks)
- If conjunct Ascendant lord: -1 point (high-risk exposure)
- If conjunct Descendant lord: +1.5 points (comeback fuel)
- If conjunct Mars: Amplifies conflict energy

### Fomalhaut (Pisces 3°14', orb 0.8°)
- Meaning: Inspiration, vision, momentum, unexpected success
- Nature: Benefic
- If conjunct Moon: +1 point (emotional clarity)
- If conjunct Jupiter: +1.5 points (expansive luck)
- If conjunct Ascendant lord: +1 point

### Sirius (Cancer 14°00', orb 0.8°)
- Meaning: Glory, fame, power, big performances, star-player energy
- Nature: Benefic
- If conjunct Sun: +2 points (champion energy)
- If conjunct Mars: +1.5 points (powerful warrior)
- If conjunct personal planets (Moon, Mercury): +1 point each

### Arcturus (Virgo 14°11', orb 0.8°)
- Meaning: Leadership, achievement, strong execution, strategic advantage
- Nature: Benefic
- If conjunct Mercury (strategy): +1.5 points
- If conjunct Ascendant lord: +1.5 points
- If conjunct Descendant lord: +1 point

### Algol (Taurus 26°41', orb 0.8°)
- Meaning: Crisis, loss of control, meltdowns, penalties, collapses
- Nature: Malefic
- If conjunct Ascendant lord: -2 points (critical failure risk)
- If conjunct Mars: -1.5 points (uncontrolled aggression)
- If conjunct Moon: -1 point (emotional collapse risk)
- If conjunct Descendant lord: -0.5 points (manageable)

---

## 4. RETROGRADE PLANETS

Each retrograde planet in the chart:
- In Ascendant cluster: -1 point to Ascendant side (internal blocks, reversals)
- In Descendant cluster: -0.5 points to Descendant side (challenges but survivable)

Retrograde Mercury is especially critical (communication/strategy blocked).

---

## 5. MOON PHASE

- Waxing Moon (0–180° from Sun): +1 point to Ascendant side (favorable for initiated action)
- Waning Moon (180–360° from Sun): +1 point to Descendant side (favorable for defensive/reactive play)

---

## 6. COMBUSTION / CAZIMI

- Planet combust (8° from Sun, except Mercury 4°, Venus 5°): -1 point per planet in that side's cluster
- Planet cazimi (0.1° from Sun's heart): +2 points to that side (pure solar amplification)

---

## CALCULATION SUMMARY

For each side:

1. **House Evaluation:** Sum all 12 houses (lord dignity + territory + house type + planets in house + aspects)
2. **Arabic Lots:** Sum all lot bonuses by house placement
3. **Fixed Stars:** Sum all conjunctions
4. **Retrograde:** Penalty per retrograde planet in cluster
5. **Moon Phase:** +1 to favored side
6. **Combustion/Cazimi:** Per planet

**GRAND TOTAL = House + Lots + Stars + Retrograde + Moon + Combustion**

**Prediction:**
- Margin > 2 points: Clear winner (confidence = 50 + margin × 3, capped 85%)
- Margin ≤ 2 points: Too close to call (confidence 30%)
- Winner: Higher score

---

## INTERPRETATION NOTES

**Territory > Dignity:** A weak planet at home beats a strong planet displaced.

**Nemesis reversal:** Self-sabotage is catastrophic for favorites; obstacles empower underdogs.

**Angular houses matter most:** Placements in angles (1, 4, 7, 10) are 3× more significant than cadent.

**Fixed stars amplify:** They don't change the core signal, they amplify existing strength/weakness.

**Context is king:** Same placement means different things for Ascendant vs Descendant.
