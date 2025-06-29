import Phaser from 'phaser'
import { Bullet } from './bullet'

interface IPlayer extends Phaser.Physics.Arcade.Sprite {
  clearBullet(): void
  body: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | null
}

export class Thread extends Phaser.GameObjects.Graphics {
  private player: IPlayer
  private bullet: Bullet | null
  private isAttached: boolean = false
  private attachPoint: Phaser.Math.Vector2 | null = null

  constructor(scene: Phaser.Scene, player: IPlayer, bullet: Bullet) {
    super(scene)

    this.player = player
    this.bullet = bullet

    scene.add.existing(this)

    console.log('Thread created between player and bullet')
  }

  update() {
    if (!this.scene) {
      return
    }

    this.clear()

    if (!this.isAttached) {
      // 弾丸が存在する場合は黄色い線で結ぶ
      if (this.bullet && this.bullet.active) {
        this.lineStyle(1, 0xffff00, 1) // 黄色の線
        this.beginPath()
        this.moveTo(this.player.x, this.player.y)
        this.lineTo(this.bullet.x, this.bullet.y)
        this.strokePath()
      }
    } else {
      // 壁に固定された場合は赤い線で描画
      if (this.attachPoint) {
        this.lineStyle(1, 0xff0000, 1) // 赤色の線
        this.beginPath()
        this.moveTo(this.player.x, this.player.y)
        this.lineTo(this.attachPoint.x, this.attachPoint.y)
        this.strokePath()
      }
    }
  }

  setAttached(x: number, y: number) {
    console.log('Thread attached to wall at:', x, y)
    this.isAttached = true
    this.attachPoint = new Phaser.Math.Vector2(x, y)
    this.bullet = null // 弾丸は削除されたので参照をクリア
  }

  getIsAttached(): boolean {
    return this.isAttached
  }

  destroy(fromScene?: boolean) {
    console.log('Thread destroyed')

    if (this.player) {
      this.player.clearBullet()
    }

    super.destroy(fromScene)
  }
}
