---
title: The Nebraska Scramble
description: A four-person scramble format I made up, built around a rotating harvest mechanic, Second Wind Tokens, Team Mulligans, and a rope called the Corn Row.
draft: false
comments: true
maturity: working
tags:
  - off-watch
  - golf
  - formats
date: 2026-08-01
updated: 2026-08-01
aliases:
  - Nebraska Scramble
  - Harvest Scramble
---

## Overview

The Nebraska Scramble is a four-person team golf format based on a traditional scramble, but with a rotating "harvest" mechanic.

After a player's shot is selected, that player becomes unavailable [[cs/systems/process-scheduling-algorithms|until every member of the team has contributed a selected shot]]. This prevents one strong golfer from carrying the team and creates pressure situations where fewer players remain available.

Each team also receives [[cs/dsa/amortized-analysis-methods|a limited number of **Second Wind Tokens**]], which can temporarily return an unavailable player for one rescue shot.

---

## 1. Basic Format

- Teams consist of four golfers.
- All four golfers tee off at the beginning of each hole.
- The team selects the best available shot.
- The team plays its next stroke from the selected ball position.
- Standard stroke-play scoring is used.

---

## 2. Harvest Rotation

When a player's shot is selected, that player becomes **harvested**.

A harvested player:

- Cannot normally hit another shot during the current rotation.
- Remains harvested until all four players have contributed a selected shot.
- May only return early through the use of a Second Wind Token.

The remaining eligible players continue hitting from each selected ball position.

Once all four golfers have contributed a selected shot, the harvest is complete and the rotation resets. All four players become eligible again.

A hole may end before the harvest rotation is completed. Any unfinished rotation resets at the beginning of the next hole.

### Example

1. All four golfers tee off.
2. Player 1's drive is selected.
3. Player 1 becomes harvested.
4. Players 2, 3, and 4 hit the second shot.
5. Player 2's shot is selected.
6. Player 2 becomes harvested.
7. Players 3 and 4 hit the third shot.
8. Player 3's shot is selected.
9. Player 3 becomes harvested.
10. Player 4 is now the only normally eligible golfer.
11. Once Player 4's shot is selected, the harvest resets and all four players return.

---

## 3. Second Wind Tokens

Each team receives:

- Two Second Wind Tokens on the front nine.
- Two Second Wind Tokens on the back nine.
- Four Second Wind Tokens total during an 18-hole round.

Unused front-nine Second Wind Tokens do not carry over to the back nine.

Second Wind Tokens are included with tournament entry and are not normally available for purchase.

### Using a Second Wind Token

A Second Wind Token allows one harvested golfer to temporarily return and hit one shot from the team's current ball position.

The Second Wind Token may be declared after the normally eligible golfer or golfers have hit, but it must be declared before the team plays its next stroke.

The team may choose either:

- One of the original eligible players' shots, or
- The Second Wind shot.

### Second Wind Token Restrictions

- The returning golfer remains harvested after hitting.
- The Second Wind shot does not reset the harvest rotation.
- The Second Wind shot does not count as an additional harvest contribution.
- No other harvested golfer may hit unless another Second Wind Token is used.
- A Second Wind Token is consumed once the returning golfer hits, even if the team does not select that shot.
- A Second Wind Token cannot be used after the next team stroke has begun.

### Example

Player 4 is the only eligible golfer and hits a poor approach shot.

The team uses a Second Wind Token and temporarily returns Player 1.

Player 1 hits from the same location and places the ball on the green.

The team selects Player 1's Second Wind shot.

Player 1 remains harvested, and Player 4 still has not completed the harvest rotation. Player 4 remains the only normally eligible golfer for the next stroke.

---

## 4. Optional Extra Second Wind Exception

The tournament may designate one sponsored challenge where a team can earn one additional Second Wind Token.

Possible challenges include:

- Hitting the green on a designated par 3.
- Landing a drive inside a marked fairway area.
- Winning a closest-to-the-pin challenge.
- Completing another sponsor-selected skill challenge.

Rules for an earned Second Wind Token:

- A team may earn no more than one additional Second Wind Token.
- The earned token may be used on either nine.
- The earned token does not replace the team's normal Second Wind Tokens.
- The challenge must be completed without purchasing additional attempts unless the tournament specifically allows them.

This exception is optional and should be announced before the round.

---

## 5. Team Mulligans

Instead of selling individual mulligans to each golfer, the tournament sells a limited number of **Team Mulligans**.

A Team Mulligan allows every golfer who was normally eligible for the current stroke to replay that stroke.

Using a Team Mulligan does not consume a Second Wind Token.

### Team Mulligan Procedure

1. The team declares the Team Mulligan before playing its next stroke.
2. All shots from the original team stroke are erased.
3. The ball returns to the original position.
4. Every golfer who was eligible before the original stroke may hit again.
5. Golfers who were already harvested remain harvested.
6. The team must select one of the replayed shots.
7. The golfer whose replayed shot is selected becomes harvested.
8. The harvest rotation then continues normally.

### Example

Players 1 and 2 are harvested.

Players 3 and 4 hit poor approach shots.

The team declares a Team Mulligan.

Players 3 and 4 replay the stroke. Players 1 and 2 do not hit because they were already harvested.

The team must use one of the replayed shots. If Player 3's replay is selected, Player 3 becomes harvested and Player 4 remains the only normally eligible golfer.

### Team Mulligan Restrictions

- A Team Mulligan does not return harvested golfers.
- A Team Mulligan does not reset the harvest rotation.
- The original shots cannot be used after the mulligan is declared.
- A Second Wind Token is not required to use a Team Mulligan.
- A Second Wind Token may still be used after the replayed eligible golfers hit.
- Team Mulligans must be purchased before the round unless the tournament establishes another sales period.

### Recommended Limit

- Maximum of two Team Mulligans per team for an 18-hole round.

---

## 6. Corn Row Rope

The tournament may sell a measured section of rope called the **Corn Row**.

The Corn Row allows a team to move its selected ball toward the hole without counting an additional stroke.

### Corn Row Rules

- Each team may purchase one Corn Row.
- The recommended rope length is 10 feet.
- The rope may be used all at once or divided among multiple holes.
- Every portion used is permanently removed, cut off, or clearly marked as spent.
- The ball may be moved no farther than the amount of rope used.
- Using the rope does not count as a golf stroke.
- Using the rope does not change the harvest rotation.
- No player becomes harvested solely because the rope was used.

### On the Green

If the remaining distance from the ball to the hole is completely covered by the available rope:

- The ball is considered holed.
- No additional stroke is counted.
- The amount of rope covering the distance is spent.

### Corn Row Restrictions

The Corn Row cannot be used to:

- Move a ball out of a penalty area.
- Move a ball from a bunker onto grass.
- Move a ball through a tree, wall, bunker lip, fence, or other physical obstruction.
- Move a ball closer to the hole by more than the amount of rope spent.
- Create an otherwise impossible path for the ball.

The tournament committee should clarify before the round whether the Corn Row may be used from the rough, fringe, fairway, or bunker.

---

## 7. Tournament Purchases

The tournament should limit purchases to two main items.

### Corn Row

**Effect:**

Provides a measured section of rope that may be used to move the team's ball closer to the hole.

**Recommended limit:**

- One Corn Row per team.

**Suggested price:**

- $20 to $30 per team.

### Team Mulligans

**Effect:**

Allows all currently eligible golfers to replay one team stroke.

**Recommended limit:**

- Two Team Mulligans per team.

**Suggested price:**

- $15 to $20 each.
- Alternatively, sell two as a package for $25 to $35.

### Nebraska Advantage Package

A tournament may offer one combined package containing:

- One 10-foot Corn Row.
- Two Team Mulligans.

Suggested package price:

- $40 to $50 per team.

Second Wind Tokens are not included in the purchase package because every team already receives two per nine holes.

---

## 8. Ball Placement

Unless the tournament course establishes different local rules:

### Fairway or Rough

- The ball may be placed within one club length of the selected shot.
- The ball may not be placed closer to the hole.
- The original playing condition must be maintained.
- A ball in the rough may not be moved into the fairway.

### Bunker

- The ball may be placed within one club length.
- The ball must remain in the same bunker.
- The ball may not be placed closer to the hole.

### Putting Green

- The ball may be placed within one putter-head length of the selected position.
- The ball may not be placed closer to the hole.

### Penalty Areas

- Normal course and USGA penalty procedures apply.
- The ball may not be moved out of a penalty area using ordinary scramble placement or Corn Row rope.

---

## 9. Tee-Shot Requirement

To ensure every golfer contributes throughout the round, each team must use a minimum number of tee shots from every player.

Recommended requirement:

- At least two tee shots from each golfer during an 18-hole round.
- At least one tee shot from each golfer must be used on the front nine.
- At least one tee shot from each golfer must be used on the back nine.

The tournament committee may reduce the requirement for three-person teams or unusual playing conditions.

---

## 10. Three-Person Teams

A three-person team may play using the same rules with the following adjustment:

- Each player hits one additional alternating shot from the fourth-player position.
- The player taking the extra shot should rotate from hole to hole.
- The extra shot does not create a separate harvest position.
- The same golfer may not use both their normal shot and the fourth-player shot during the same team stroke unless permitted by tournament officials.

Alternatively, the tournament may provide a designated substitute or scoring adjustment.

---

## 11. Strategy Summary

Each mechanic serves a different purpose.

### Harvest Rotation

Forces every player to contribute and prevents one golfer from carrying the team.

### Second Wind Token

Temporarily returns one harvested golfer for an emergency or strategic rescue shot.

### Team Mulligan

Allows all currently eligible golfers to replay a poor team stroke without consuming a Second Wind Token.

### Corn Row

Improves the team's ball position without replaying a shot or changing the harvest rotation.

---

## 12. Recommended Official Setup

For a standard 18-hole Nebraska Scramble:

- Four-person teams.
- Two Second Wind Tokens per nine holes.
- Second Wind Tokens do not carry between nines.
- One optional challenge may award one additional Second Wind Token.
- Maximum of two purchasable Team Mulligans per team.
- Maximum of one purchasable 10-foot Corn Row per team.
- Two required tee shots per player.
- Standard stroke-play scoring.
- Lowest team score wins.

---

## Official One-Paragraph Description

The Nebraska Scramble is a four-person golf format in which all players begin each harvest rotation together. Whenever a player's shot is selected, that player becomes harvested and cannot normally hit again until every teammate has contributed a selected shot. Once all four golfers contribute, the rotation resets. Each team receives two Second Wind Tokens per nine holes, allowing a harvested golfer to temporarily return for one rescue shot without resetting the rotation. Teams may also purchase a limited number of Team Mulligans, which allow all currently eligible players to replay a stroke, and a Corn Row rope that may be used to move the ball closer to the hole without counting an additional stroke.

---

*Back to [[off-watch/golf/index|The Clubhouse]].*
