// 部品の CSS（src/style.css）を、そのまま dist/style.css に置く（Tailwind などは使っていないので、手を加えない）
import { copyFileSync, mkdirSync } from 'node:fs'

mkdirSync('dist', { recursive: true })
copyFileSync('src/style.css', 'dist/style.css')
console.log('dist/style.css をコピーしました')
