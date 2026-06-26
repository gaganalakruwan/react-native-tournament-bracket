# react-native-tournament-bracket

A customizable tournament bracket view for React Native with animated scroll, SVG connector lines, and a round navigation bar.

Supports bracket sizes of **4, 8, 16, and 32 teams** (powers of 2).

![demo](./demo.gif)

---

## Installation

```sh
npm install react-native-tournament-bracket react-native-svg
```

or

```sh
yarn add react-native-tournament-bracket react-native-svg
```

> `react-native-svg` is a required peer dependency. Follow its [setup guide](https://github.com/software-mansion/react-native-svg#installation) for native linking.

---

## Basic Usage

```tsx
import BracketWithLines from 'react-native-tournament-bracket';

<BracketWithLines
  data={matches}
  onMatchPress={(match) => console.log(match.id)}
/>
```

---

## Data Format

Pass a **flat array** of matches ordered by round. Each match must include a `level` field that groups it into a round. The component handles grouping internally.

```ts
const matches = [
  {
    id: 1,
    level: 'SEMI_FINAL',
    levelName: 'Semi Final',          // optional display name for the nav bar
    home_team: { id: 10, name: 'Team A' },
    away_team: { id: 11, name: 'Team B' },
  },
  {
    id: 2,
    level: 'SEMI_FINAL',
    levelName: 'Semi Final',
    home_team: { id: 12, name: 'Team C' },
    away_team: { id: 13, name: 'Team D' },
  },
  {
    id: 3,
    level: 'FINAL',
    levelName: 'Final',
    home_team: { id: 10, name: 'Team A' },
    away_team: { id: 13, name: 'Team D' },
  },
];
```

> **Bracket size note:** Each round must have exactly half the matches of the previous one (e.g. 16 → 8 → 4 → 2 → 1). Non-power-of-2 sizes will log a warning.

---

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `BracketMatch[]` | required | Flat array of all matches across all rounds |
| `onMatchPress` | `(match) => void` | — | Called when a match card is pressed |
| `renderMatch` | `(match) => ReactNode` | — | Custom match card renderer |
| `renderNavButton` | `(props) => ReactNode` | — | Custom nav button renderer |
| `showNavigation` | `boolean` | `true` | Show or hide the round navigation bar |
| `navPadding` | `{ horizontal?, vertical? }` | `{ horizontal: 20, vertical: 30 }` | Padding of the navigation bar |
| `lineColor` | `string` | `"#2b6cb0"` | Color of the SVG connector lines |
| `itemHeight` | `number` | `100` | Height of each match card |
| `gap` | `number` | `12` | Vertical gap between match cards |
| `columnWidth` | `number` | `200` | Width of each column (also controls scroll snap) |
| `backgroundColor` | `string` | `"#0D1E62"` | Background color of the component |
| `matchBackgroundColor` | `string` | `"#213693"` | Background color of the default match card |
| `navActiveColor` | `string` | `"#F5BD47"` | Nav button color when active |
| `navInactiveColor` | `string` | `"#213693"` | Nav button color when inactive |
| `trophySource` | `ImageSourcePropType` | — | Trophy image shown after the final round. Hidden if not provided |
| `trophySize` | `{ width, height }` | `{ width: 70, height: 100 }` | Size of the trophy image |

---

## Custom Match Card

Use `renderMatch` to replace the default card with your own design:

```tsx
<BracketWithLines
  data={matches}
  renderMatch={(match) => (
    <View style={{ padding: 8 }}>
      <Text style={{ color: 'white' }}>{match.away_team.name}</Text>
      <View style={{ height: 1, backgroundColor: '#555' }} />
      <Text style={{ color: 'white' }}>{match.home_team.name}</Text>
    </View>
  )}
/>
```

---

## Custom Nav Button

Use `renderNavButton` to replace the default round navigation buttons:

```tsx
<BracketWithLines
  data={matches}
  renderNavButton={({ item, isActive, onPress }) => (
    <TouchableOpacity onPress={onPress} style={{ marginRight: 8 }}>
      <Text style={{ color: isActive ? '#F5BD47' : '#fff', fontWeight: 'bold' }}>
        {item.name}
      </Text>
      {isActive && <View style={{ height: 2, backgroundColor: '#F5BD47' }} />}
    </TouchableOpacity>
  )}
/>
```

---

## Trophy Image

Pass any local or remote image source. The trophy appears aligned with the final round:

```tsx
<BracketWithLines
  data={matches}
  trophySource={require('./assets/trophy.png')}
  trophySize={{ width: 60, height: 90 }}
/>
```

---

## TypeScript

All types are exported from the package:

```ts
import BracketWithLines from 'react-native-tournament-bracket';
import type { BracketMatch, BracketViewProps, NavButtonItem } from 'react-native-tournament-bracket';
```

---

## Example

A full working example is available in the [`example/`](./example) folder.

---

## License

MIT
