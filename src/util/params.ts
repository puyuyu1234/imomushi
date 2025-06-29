export class BlockSprite {
  key: string
  imgNos: number[]
  isWall: boolean
  constructor(key: string, imgNos: number[], options: { isWall?: boolean } = {}) {
    this.key = key
    this.imgNos = imgNos
    this.isWall = options.isWall || false
  }
}
export class EntitySprite extends BlockSprite {
  creator: unknown
  constructor(key: string, imgNos: number[], creator: unknown) {
    super(key, imgNos, {})
    this.creator = creator
  }
}

import Phaser from 'phaser'
import { Player } from '@/Entity/player'

const createSpider = (
  x: number,
  y: number,
  stageData: string[],
  imgNos: number[],
  scene: Phaser.Scene,
) => {
  // スパイダーエンティティを作成
  const physicsScene = scene as Phaser.Scene & { physics: Phaser.Physics.Arcade.ArcadePhysics }
  const spider = physicsScene.physics.add.sprite(x, y, 'block') // とりあえずblockアセットを使用
  spider.setTint(0xff00ff) // マゼンタ色でスパイダーを識別
  spider.setCollideWorldBounds(true)
  return spider
}

const createPlayer = (
  x: number,
  y: number,
  stageData: string[],
  imgNos: number[],
  scene: Phaser.Scene,
) => {
  // プレイヤーエンティティを作成
  const player = new Player(scene, x, y)
  return player
}

export const BLOCK_DATA = new Map(
  [
    new BlockSprite(' ', [0]),
    new BlockSprite('0', [1], { isWall: true }),
    new BlockSprite('1', [2]),
    new BlockSprite('2', [3], { isWall: true }),
    new BlockSprite('3', [4], { isWall: true }),
    new BlockSprite('4', [5]),
    new BlockSprite('5', [6]),
    new BlockSprite('6', [7]),
    new BlockSprite('7', [8], { isWall: true }),
    new BlockSprite('8', [9], { isWall: true }),
    new BlockSprite('9', [10], { isWall: true }),
    new BlockSprite('A', [11], { isWall: true }),
    new BlockSprite('B', [12], { isWall: true }),
    new BlockSprite('C', [13]),
    new BlockSprite('D', [14]),
    new BlockSprite('E', [15]),
    new BlockSprite('F', [16], { isWall: true }),
    new BlockSprite('G', [17], { isWall: true }),
    new BlockSprite('H', [18], { isWall: true }),
    new BlockSprite('I', [19]),
    new BlockSprite('J', [20]),
    new BlockSprite('K', [21]),
    new BlockSprite('L', [22]),
    new BlockSprite('M', [23]),
    new BlockSprite('N', [24], { isWall: true }),
    new BlockSprite('O', [25], { isWall: true }),
    new BlockSprite('P', [26], { isWall: true }),
    new BlockSprite('Q', [27]),
    new BlockSprite('R', [28]),
    new BlockSprite('S', [29]),
    new BlockSprite('T', [30]),
    new BlockSprite('U', [31]),
    new EntitySprite('V', [32], createSpider),
    new BlockSprite('W', [33]),
    new BlockSprite('X', [34]),
    new BlockSprite('Y', [35]),
    new BlockSprite('Z', [36]),
    new BlockSprite('a', [37]),
    new BlockSprite('b', [38]),
    new BlockSprite('c', [39]),
    new BlockSprite('d', [40]),
    new BlockSprite('e', [41]),
    new BlockSprite('f', [42]),
    new BlockSprite('g', [43]),
    new BlockSprite('h', [44]),
    new BlockSprite('i', [45]),
    new BlockSprite('j', [46]),
    new BlockSprite('k', [47]),
    new BlockSprite('l', [48]),
    new BlockSprite('m', [49]),
    new BlockSprite('n', [50]),
    new BlockSprite('o', [51]),
    new BlockSprite('p', [52]),
    new BlockSprite('q', [53]),
    new BlockSprite('r', [54]),
    new BlockSprite('s', [55]),
    new BlockSprite('t', [56]),
    new BlockSprite('u', [57]),
    new BlockSprite('v', [58]),
    new BlockSprite('w', [59]),
    new BlockSprite('x', [60]),
    new BlockSprite('y', [61]),
    new BlockSprite('z', [62]),
    new BlockSprite('!', [63]),
    new EntitySprite('@', [0], createPlayer),
  ].map((v) => [v.key, v]),
)

export const STAGE_DATA = [
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGG2OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO3GGGG',
  'GGGGGGGGGGGGGGGGGGGGGGH  11  FH   1 1   1    1                               FGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGH  11  FH   1 1   1    1                               FGGGG',
  'GGGGGGGGGGGG2OOOOOOOOOP  79  NP   1 1   1   01                               FGGGG',
  'GGGGGGGGGGGGHPPP2P  1 1  FH  11 II789VVV788889  46  46  46  46  46  46  46   FGGGG',
  'GGGGGGGGGGGGHPP2P   1 1  FH  11 QQFGHVVVF0GG0H  CE  CE  CE  CE  CE  CE  CE   FGGGG',
  'GGGGGGGGGGGGHP2P    78888888888888FGHVVVFGGGGH  CE  CE  CE  CE  CE  CE  CE   FGGGG',
  'GGGGG2OOOO3GH2P    7FGGGGGGGGGGGGGFGHVVVFGGGGH0 KM  KM  KM  KM  KM  KM  KM  0FGGGG',
  'GGGGGH    FGHP    7BFG0000000000GGFGHVVVF0GG0H0               0             0FGGGG',
  'GGGGGH    FGH    7BGFG0000000000GGFGHVVVFGGGGH00  00  0    0000    000     00FGGGG',
  'GGGGGH    NOP   7BGGFG0000000000GGFGHVVV7888888888888888888888888888889111178BGGGG',
  'GGGGGH    1 1  7GGGGFGGGGGGGGGGGGGFGHVVVF0GGGGGG0GGGGGG0GGGGGG0GGGGGG0H    FGGGGGG',
  'GGGGGH III1 1  NOOOONOOOOOOOOOOOOOFGHVVVFGGGGGGGGGGGGGGGGGGGGGGGGGGGGGH    FGGGGGG',
  'GGGGGH QQQ789   N3GGFH            FGHVVVFGGGGGGGGGGGGGGGGGGGGGGGGGGGGGHGGGGFGGGGGG',
  'GGGGGA8888BGH    N3GFH            FGHVVVFGGGGGGGGGGGGGGGGGGGGGGGGGGGGGH    FGGGGGG',
  'GGGGGGGG79GGH9    NONP   456  456 NOP   FGGGGGGGGGGGGGGGGGGGGGGGGGGGGGH    FGGGGGG',
  'GGGGGGGGNPGGHA9   1  1   KLM  KLM 1 1   FGGGGGGGGGGGGGGGGGGGGGGGGGGGGGH    FGGGGGG',
  'GGGGGGGGGGGGH9A9  1  1II          1 1   F0GGGGGG0GGGGGG0GGGGGG0GGGGGG0H    FGGGGGG',
  'GGGGGGGGGGGGH99A9 1  1QQ @        1 1   FGGGGGGGGGGGGGGGGGGGGGGGGGGGGGH    FGGGGGG',
  'GGGGGGGGGGGGH8888888888888888888888888888888                                      ',
  'GGGGGGGGGGGGHGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG                                      ',
  'GGGGGGGGGGGGHGGGG79G000000000000000000000000                                      ',
  'GGGGGGGGGGGGHGGGGNPG000000000000000000000000                                      ',
]
