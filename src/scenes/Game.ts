// src/game/scenes/GameScene.ts

import Phaser from 'phaser'
import { BLOCK_DATA, STAGE_DATA, BlockSprite, EntitySprite } from '@/util/params'
import { Player } from '@/Entity/player'

export default class GameScene extends Phaser.Scene {
  private tilemap!: Phaser.Tilemaps.Tilemap
  private groundLayer!: Phaser.Tilemaps.TilemapLayer
  private wallLayer!: Phaser.Tilemaps.TilemapLayer
  private entitiesGroup!: Phaser.Physics.Arcade.Group
  private player!: Player
  private debugDots: Phaser.GameObjects.Graphics[] = []

  private readonly TILE_WIDTH = 16
  private readonly TILE_HEIGHT = 16

  constructor() {
    super('GameScene')
  }

  preload() {
    this.load.image('block', 'assets/block.gif')
    this.load.image('player', 'assets/player.gif')
  }

  create() {
    // タイルセット画像のフィルタリングを設定
    this.textures.get('tileset_image').setFilter(Phaser.Textures.FilterMode.NEAREST)
    // プレイヤー画像も同様に設定
    this.textures.get('player_atlas').setFilter(Phaser.Textures.FilterMode.NEAREST)

    this.cameras.main.setBackgroundColor('#cccccc')

    this.physics.world.setBounds(
      0,
      0,
      STAGE_DATA[0].length * this.TILE_WIDTH,
      STAGE_DATA.length * this.TILE_HEIGHT,
    )

    this.tilemap = this.make.tilemap({
      tileWidth: this.TILE_WIDTH,
      tileHeight: this.TILE_HEIGHT,
      width: STAGE_DATA[0].length,
      height: STAGE_DATA.length,
    })

    const tileset = this.tilemap.addTilesetImage(
      'tileset_image',
      'block',
      this.TILE_WIDTH,
      this.TILE_HEIGHT,
    )

    if (!tileset) {
      console.error('Failed to create tileset')
      return
    }

    const groundLayer = this.tilemap.createBlankLayer('GroundLayer', tileset)
    const wallLayer = this.tilemap.createBlankLayer('WallLayer', tileset)

    if (!groundLayer || !wallLayer) {
      console.error('Failed to create layers')
      return
    }

    this.groundLayer = groundLayer
    this.wallLayer = wallLayer
    this.entitiesGroup = this.physics.add.group()

    this.loadStageData()

    // 壁の当たり判定を可視化
    const debugGraphics = this.add.graphics().setAlpha(0.5)
    this.wallLayer.renderDebug(debugGraphics, {
      tileColor: null,
      collidingTileColor: new Phaser.Display.Color(255, 255, 0, 100),
      faceColor: new Phaser.Display.Color(40, 39, 37, 100),
    })

    if (this.player) {
      this.physics.add.collider(this.player, this.wallLayer)

      this.cameras.main.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels)
      this.cameras.main.startFollow(this.player)
      this.cameras.main.setRoundPixels(true)
    }
  }

  loadStageData() {
    let hasWallTiles = false

    STAGE_DATA.forEach((rowString: string, y: number) => {
      rowString.split('').forEach((charKey: string, x: number) => {
        const blockData = BLOCK_DATA.get(charKey)

        if (blockData) {
          const tileIndex = blockData.imgNos[0]
          const pixelX = x * this.TILE_WIDTH
          const pixelY = y * this.TILE_HEIGHT

          if (blockData instanceof BlockSprite && !(blockData instanceof EntitySprite)) {
            if (blockData.isWall) {
              this.wallLayer.putTileAt(tileIndex, x, y)
              hasWallTiles = true
            } else {
              this.groundLayer.putTileAt(tileIndex, x, y)
            }
          } else if (blockData instanceof EntitySprite) {
            if (typeof blockData.creator === 'function') {
              const entity = blockData.creator(pixelX, pixelY, STAGE_DATA, blockData.imgNos, this)
              if (entity && entity.body) {
                if (blockData.key === '@') {
                  this.player = entity
                }
                this.entitiesGroup.add(entity)
              } else {
                console.warn('Entity creator returned undefined or invalid entity:', blockData.key)
                const placeholder = this.physics.add.sprite(pixelX, pixelY, 'block')
                placeholder.setTint(0x00ff00)
                this.entitiesGroup.add(placeholder)
              }
            }
          }
        }
      })
    })

    // 壁タイルがある場合のみ衝突を設定
    if (hasWallTiles) {
      this.wallLayer.setCollisionByExclusion([-1])
      console.log('Wall collision set up for wall layer')
    }
  }

  update() {
    if (this.player) {
      this.player.update()
    }
  }

  // デバッグ用：マウスクリック位置に点を描画
  addDebugDot(x: number, y: number) {
    if (this.debugDots.length >= 5) {
      const oldDot = this.debugDots.shift()
      if (oldDot) {
        oldDot.destroy()
      }
    }

    const dot = this.add.graphics()
    dot.fillStyle(0xff0000, 1)
    dot.fillCircle(x, y, 3)
    this.debugDots.push(dot)

    console.log('Debug dot added at:', x, y)

    this.time.delayedCall(3000, () => {
      const index = this.debugDots.indexOf(dot)
      if (index > -1) {
        this.debugDots.splice(index, 1)
        dot.destroy()
      }
    })
  }
}
