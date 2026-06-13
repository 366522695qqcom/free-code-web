// 用 CSS 网格还原终端里的像素小机器人吉祥物
const O = "#cdc7a0" // 机身浅褐
const D = "#2a2a1c" // 深色（眼睛/缝隙）
const _ = "" // 透明

const GRID: string[][] = [
  [_, _, O, O, O, O, O, O, _, _],
  [_, O, O, O, O, O, O, O, O, _],
  [O, O, O, O, O, O, O, O, O, O],
  [O, D, D, O, O, O, O, D, D, O],
  [O, D, D, O, O, O, O, D, D, O],
  [O, O, O, O, O, O, O, O, O, O],
  [O, O, O, O, O, O, O, O, O, O],
  [_, O, O, O, O, O, O, O, O, _],
  [_, O, _, O, O, O, O, _, O, _],
  [_, O, _, _, _, _, _, _, O, _],
]

export function PixelMascot() {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: "repeat(10, 1fr)",
        width: 100,
        height: 100,
        imageRendering: "pixelated",
      }}
      role="img"
      aria-label="Free Code 像素吉祥物机器人"
    >
      {GRID.flat().map((color, i) => (
        <div key={i} style={{ backgroundColor: color || "transparent" }} />
      ))}
    </div>
  )
}
